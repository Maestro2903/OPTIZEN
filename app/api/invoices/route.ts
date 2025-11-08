import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'

// GET /api/invoices - List invoices with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    let page = parseInt(searchParams.get('page') || '1', 10)
    let limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'invoice_date'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status') || ''
    const patient_id = searchParams.get('patient_id') || ''
    const date_from = searchParams.get('date_from') || ''
    const date_to = searchParams.get('date_to') || ''

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100) // Cap at 100

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Validate sortBy against allowlist
    const allowedSortColumns = [
      'invoice_date',
      'invoice_number',
      'total_amount',
      'amount_paid',
      'balance_due',
      'status',
      'payment_status',
      'created_at',
      'due_date'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'invoice_date'
    }

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with joins to get patient information and invoice items
    let query = supabase
      .from('invoices')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        invoice_items (
          id,
          item_description,
          quantity,
          unit_price,
          total_price
        )
      `, { count: 'exact' })

    // Apply search filter (note: nested table search requires referencedTable option)
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,patients.full_name.ilike.%${search}%,patients.mobile.ilike.%${search}%`, { referencedTable: 'patients' })
    }

    // Parse and validate status parameter (supports arrays)
    const allowedStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'unpaid', 'partial']
    const statusValues = status ? validateArrayParam(
      parseArrayParam(status),
      allowedStatuses,
      false
    ) : []

    // Apply status filter (supports multiple values)
    if (statusValues.length > 0) {
      query = applyArrayFilter(query, 'status', statusValues)
    }

    // Apply patient filter
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    // Apply date range filter
    if (date_from) {
      query = query.gte('invoice_date', date_from)
    }
    if (date_to) {
      query = query.lte('invoice_date', date_to)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const {
      invoice_number,
      patient_id,
      invoice_date,
      due_date,
      subtotal,
      discount_amount = 0,
      tax_amount = 0,
      total_amount,
      amount_paid = 0,
      payment_method,
      notes,
      items, // Array of invoice items
      status = 'unpaid'
    } = body

    if (!invoice_number || !patient_id || !invoice_date || !total_amount || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid data: invoice_number, patient_id, invoice_date, total_amount, items (must be a non-empty array)' },
        { status: 400 }
      )
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Calculate balance
    const balance_due = total_amount - amount_paid

    // Determine payment status
    let payment_status = 'unpaid'
    if (amount_paid >= total_amount) {
      payment_status = 'paid'
    } else if (amount_paid > 0) {
      payment_status = 'partial'
    }

    // Start a transaction to create invoice and items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([
        {
          invoice_number,
          patient_id,
          invoice_date,
          due_date,
          subtotal,
          discount_amount,
          tax_amount,
          total_amount,
          amount_paid,
          balance_due,
          payment_status,
          payment_method,
          notes,
          status,
          created_by: session.user.id
        }
      ])
      .select()
      .single()

    if (invoiceError) {
      console.error('Database error creating invoice:', invoiceError)
      if (invoiceError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Invoice number already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create invoice items
    const invoiceItems = items.map((item: any) => ({
      ...item,
      invoice_id: invoice.id,
      total_price: item.quantity * item.unit_price
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
      .select()

    if (itemsError) {
      console.error('Database error creating invoice items:', itemsError)
      // Rollback - delete the invoice
      await supabase.from('invoices').delete().eq('id', invoice.id)
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 })
    }

    // Return invoice with items and patient info
    const { data: fullInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender
        ),
        invoice_items (
          id,
          item_description,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', invoice.id)
      .single()

    if (fetchError || !fullInvoice) {
      console.error('Error fetching full invoice:', fetchError)
      // Invoice was created but we can't return full details - return basic invoice
      return NextResponse.json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully'
      }, { status: 201 })
    }

    return NextResponse.json({
      success: true,
      data: fullInvoice,
      message: 'Invoice created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}