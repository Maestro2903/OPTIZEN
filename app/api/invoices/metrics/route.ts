import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { handleDatabaseError, handleServerError } from '@/lib/utils/api-errors'

// GET /api/invoices/metrics - Get invoice metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build query
    let query = supabase
      .from('invoices')
      .select('total_amount, amount_paid, payment_status, status, invoice_date')

    // Apply date filters if provided
    if (dateFrom) {
      query = query.gte('invoice_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('invoice_date', dateTo)
    }

    const { data: invoices, error } = await query

    if (error) {
      return handleDatabaseError(error, 'fetch', 'invoice metrics')
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total_invoices: 0,
          total_revenue: 0,
          paid_amount: 0,
          pending_amount: 0,
          unpaid_amount: 0,
          paid_invoices: 0,
          unpaid_invoices: 0,
          partial_invoices: 0,
          overdue_invoices: 0,
          average_invoice_amount: 0,
          payment_status: {
            paid: 0,
            unpaid: 0,
            partial: 0,
          },
          invoice_status: {
            draft: 0,
            sent: 0,
            overdue: 0,
          },
          collection_rate: '0%',
          average_invoice_value: '0',
          date_range: {
            from: dateFrom,
            to: dateTo,
          }
        }
      })
    }

    // Calculate metrics from invoice data
    const metrics = {
      total_invoices: invoices.length,
      total_revenue: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      paid_amount: invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
      pending_amount: invoices.reduce((sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.amount_paid || 0)), 0),
      unpaid_amount: invoices
        .filter(inv => inv.payment_status === 'unpaid')
        .reduce((sum, inv) => sum + Math.max(0, (inv.total_amount || 0) - (inv.amount_paid || 0)), 0),
      paid_invoices: invoices.filter(inv => inv.payment_status === 'paid').length,
      unpaid_invoices: invoices.filter(inv => inv.payment_status === 'unpaid').length,
      partial_invoices: invoices.filter(inv => inv.payment_status === 'partial').length,
      overdue_invoices: invoices.filter(inv => inv.status === 'overdue').length,
      average_invoice_amount: invoices.length > 0 
        ? invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) / invoices.length 
        : 0,
      payment_status: {
        paid: invoices.filter(inv => inv.payment_status === 'paid').length,
        unpaid: invoices.filter(inv => inv.payment_status === 'unpaid').length,
        partial: invoices.filter(inv => inv.payment_status === 'partial').length,
      },
      invoice_status: {
        draft: invoices.filter(inv => inv.status === 'draft').length,
        sent: invoices.filter(inv => inv.status === 'sent').length,
        overdue: invoices.filter(inv => inv.status === 'overdue').length,
      },
      collection_rate: invoices.length > 0
        ? `${(((invoices.filter(inv => inv.payment_status === 'paid').length) / invoices.length) * 100).toFixed(1)}%`
        : '0%',
      average_invoice_value: invoices.length > 0
        ? (invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) / invoices.length).toFixed(2)
        : '0',
      date_range: {
        from: dateFrom,
        to: dateTo,
      }
    }

    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    return handleServerError(error, 'fetch', 'invoice metrics')
  }
}
