import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'
import { handleDatabaseError, handleNotFoundError, handleServerError } from '@/lib/utils/api-errors'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'

// GET /api/invoices - List invoices with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('invoices', 'view')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

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
    const billing_type = searchParams.get('billing_type') || ''

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

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query for invoices - fetch without join first
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })

    // Apply search filter - search in invoice columns only (patient search done post-fetch)
    if (search) {
      query = query.ilike('invoice_number', `%${search}%`)
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

    // Apply billing_type filter
    if (billing_type) {
      const allowedBillingTypes = ['consultation_operation', 'medical', 'optical']
      if (allowedBillingTypes.includes(billing_type)) {
        query = query.eq('billing_type', billing_type)
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      return handleDatabaseError(error, 'fetch', 'invoices')
    }

    // Fetch patient data for all invoices
    if (invoices && invoices.length > 0) {
      const patientIds = [...new Set(invoices.map(inv => inv.patient_id))]
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, patient_id, full_name, email, mobile, gender')
        .in('id', patientIds)

      if (!patientsError && patients) {
        // Create a map for quick lookup
        const patientMap = new Map(patients.map(p => [p.id, p]))
        
        // Attach patient data to each invoice
        invoices.forEach(invoice => {
          const patient = patientMap.get(invoice.patient_id)
          if (patient) {
            (invoice as any).patients = patient
          }
        })
      }
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
    return handleServerError(error, 'fetch', 'invoices')
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('invoices', 'create')
    if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
    const { context } = authCheck

    const supabase = createClient()
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
      status = 'unpaid',
      billing_type = 'consultation_operation'
    } = body

    if (!invoice_number || !patient_id || !invoice_date || !total_amount || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid data: invoice_number, patient_id, invoice_date, total_amount, items (must be a non-empty array)' },
        { status: 400 }
      )
    }

    // Validate each invoice item has required fields
    const invalidItems = items.filter((item: any) => 
      !item.service || item.quantity === undefined || item.quantity === null || item.quantity === '' || !item.rate || item.rate === undefined || item.rate === null || item.rate === ''
    )

    if (invalidItems.length > 0) {
      return NextResponse.json(
        { error: 'Invalid invoice items: each item must have service, quantity, and rate' },
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
      return handleNotFoundError('Patient', patient_id)
    }

    // Validate billing_type
    const allowedBillingTypes = ['consultation_operation', 'medical', 'optical']
    if (billing_type && !allowedBillingTypes.includes(billing_type)) {
      return NextResponse.json(
        { error: `Invalid billing_type. Must be one of: ${allowedBillingTypes.join(', ')}` },
        { status: 400 }
      )
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

    // Validate stock availability for inventory items and prepare stock movements
    const stockMovements: any[] = []
    const inventoryItems: any[] = []

    for (const item of items) {
      // Check if this is an inventory item (pharmacy or optical)
      if (item.item_type && item.item_id && (item.item_type === 'pharmacy' || item.item_type === 'optical')) {
        const itemQuantity = item.quantity || 1

        // Validate stock availability
        const { data: stockAvailable, error: stockError } = await supabase
          .rpc('validate_stock_availability', {
            p_item_type: item.item_type,
            p_item_id: item.item_id,
            p_quantity: itemQuantity
          })

        if (stockError) {
          return NextResponse.json(
            { error: `Error validating stock for ${item.service || item.description || 'item'}: ${stockError.message}` },
            { status: 400 }
          )
        }

        if (!stockAvailable) {
          // Get current stock for error message
          const tableName = item.item_type === 'pharmacy' ? 'pharmacy_items' : 'optical_items'
          const { data: inventoryItem } = await supabase
            .from(tableName)
            .select('stock_quantity, name')
            .eq('id', item.item_id)
            .single()

          return NextResponse.json(
            {
              error: `Insufficient stock for ${item.service || item.description || inventoryItem?.name || 'item'}. Available: ${inventoryItem?.stock_quantity || 0}, Requested: ${itemQuantity}`,
              item_name: item.service || item.description || inventoryItem?.name,
              available_stock: inventoryItem?.stock_quantity || 0,
              requested_quantity: itemQuantity
            },
            { status: 400 }
          )
        }

        // Get item details for stock movement
        const tableName = item.item_type === 'pharmacy' ? 'pharmacy_items' : 'optical_items'
        const { data: inventoryItem } = await supabase
          .from(tableName)
          .select('name, stock_quantity, unit_price, selling_price, mrp, sku')
          .eq('id', item.item_id)
          .single()

        if (inventoryItem) {
          inventoryItems.push({
            ...item,
            item_name: inventoryItem.name,
            item_sku: inventoryItem.sku || null,
            current_stock: inventoryItem.stock_quantity
          })

          // Prepare stock movement (will be created after invoice is created)
          const { data: { user } } = await supabase.auth.getUser()
          stockMovements.push({
            movement_date: invoice_date,
            movement_type: 'sale',
            item_type: item.item_type,
            item_id: item.item_id,
            item_name: inventoryItem.name,
            quantity: itemQuantity,
            unit_price: item.unit_price || inventoryItem.selling_price || inventoryItem.mrp || inventoryItem.unit_price,
            total_value: (item.unit_price || inventoryItem.selling_price || inventoryItem.mrp || 0) * itemQuantity,
            invoice_id: null, // Will be set after invoice creation
            user_id: user?.id || null,
            customer_name: null, // Will be populated with patient name
            notes: `Sale via invoice ${invoice_number}`
          })
        }
      }
    }

    // Create invoice with items stored as JSONB
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
          payment_status,
          payment_method,
          notes,
          status,
          billing_type: billing_type || 'consultation_operation',
          items: items // Store items as JSONB
        }
      ])
      .select()
      .single()

    if (invoiceError) {
      return handleDatabaseError(invoiceError, 'create', 'invoice')
    }

    // Get patient name for stock movements
    const { data: patientData } = await supabase
      .from('patients')
      .select('full_name')
      .eq('id', patient_id)
      .single()

    const customerName = patientData?.full_name || null

    // Create stock movements for inventory items
    if (stockMovements.length > 0) {
      // Update stock movements with invoice_id and customer_name
      const movementsToInsert = stockMovements.map(movement => ({
        ...movement,
        invoice_id: invoice.id,
        customer_name: customerName
      }))

      const { error: movementsError } = await supabase
        .from('stock_movements')
        .insert(movementsToInsert)

      if (movementsError) {
        // If stock movement creation fails, we should ideally rollback the invoice
        // For now, log the error and continue (stock movements can be created manually)
        console.error('Error creating stock movements:', movementsError)
        // Note: In production, you might want to delete the invoice here or use a transaction
      }
    }

    // Return invoice with patient info
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
    return handleServerError(error, 'create', 'invoice')
  }
}