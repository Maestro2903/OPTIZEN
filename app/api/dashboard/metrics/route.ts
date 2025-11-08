/**
 * Dashboard Metrics API
 * Provides global aggregate statistics for dashboard KPIs
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/dashboard/metrics - Get all dashboard metrics
export async function GET(request: NextRequest) {
  // Authorization check - any authenticated user can view dashboard metrics
  const authCheck = await requirePermission('patients', 'view')
  if (!authCheck.authorized) return authCheck.response

  try {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Run all metrics queries in parallel for performance
    const [
      patientsResult,
      appointmentsResult,
      casesResult,
      invoicesResult,
      pharmacyResult,
      bedsResult
    ] = await Promise.all([
      // Patients metrics
      supabase
        .from('patients')
        .select('id, status, created_at', { count: 'exact', head: false })
        .eq('status', 'active'),

      // Appointments metrics
      supabase
        .from('appointments')
        .select('id, status, appointment_date', { count: 'exact', head: false })
        .gte('appointment_date', today),

      // Cases metrics
      supabase
        .from('encounters')
        .select('id, status', { count: 'exact', head: false }),

      // Invoices metrics
      supabase
        .from('invoices')
        .select('total_amount, status, amount_paid', { count: 'exact', head: false }),

      // Pharmacy metrics
      supabase
        .from('pharmacy_items')
        .select('is_low_stock', { count: 'exact', head: false })
        .eq('is_low_stock', true),

      // Beds metrics
      supabase
        .from('beds')
        .select('id, status', { count: 'exact', head: false })
    ])

    // Process patients metrics
    const totalPatients = patientsResult.count || 0
    const newPatientsThisMonth = patientsResult.data?.filter(p => {
      const created = new Date(p.created_at)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length || 0

    // Process appointments metrics
    const totalAppointments = appointmentsResult.count || 0
    const appointmentsToday = appointmentsResult.data?.filter(a => 
      a.appointment_date === today
    ).length || 0
    const appointmentsCompleted = appointmentsResult.data?.filter(a => 
      a.status === 'completed'
    ).length || 0
    const appointmentsPending = appointmentsResult.data?.filter(a => 
      a.status === 'scheduled' || a.status === 'checked-in'
    ).length || 0

    // Process cases metrics
    const totalCases = casesResult.count || 0
    const activeCases = casesResult.data?.filter(c => c.status === 'active').length || 0
    const completedCases = casesResult.data?.filter(c => c.status === 'completed').length || 0

    // Process invoices metrics
    const totalRevenue = invoicesResult.data?.reduce((sum, inv) => 
      sum + (parseFloat(inv.total_amount) || 0), 0
    ) || 0
    const totalPaid = invoicesResult.data?.reduce((sum, inv) => 
      sum + (parseFloat(inv.amount_paid) || 0), 0
    ) || 0
    const totalPending = totalRevenue - totalPaid
    const paidInvoices = invoicesResult.data?.filter(i => i.status === 'paid').length || 0
    const unpaidInvoices = invoicesResult.data?.filter(i => 
      i.status === 'sent' || i.status === 'overdue'
    ).length || 0

    // Process pharmacy metrics
    const lowStockItems = pharmacyResult.count || 0

    // Process beds metrics
    const totalBeds = bedsResult.count || 0
    const availableBeds = bedsResult.data?.filter(b => b.status === 'available').length || 0
    const occupiedBeds = bedsResult.data?.filter(b => b.status === 'occupied').length || 0

    return NextResponse.json({
      success: true,
      data: {
        patients: {
          total: totalPatients,
          new_this_month: newPatientsThisMonth
        },
        appointments: {
          total: totalAppointments,
          today: appointmentsToday,
          completed: appointmentsCompleted,
          pending: appointmentsPending
        },
        cases: {
          total: totalCases,
          active: activeCases,
          completed: completedCases
        },
        financials: {
          total_revenue: totalRevenue,
          total_paid: totalPaid,
          total_pending: totalPending,
          paid_invoices: paidInvoices,
          unpaid_invoices: unpaidInvoices
        },
        pharmacy: {
          low_stock_items: lowStockItems
        },
        beds: {
          total: totalBeds,
          available: availableBeds,
          occupied: occupiedBeds,
          occupancy_rate: totalBeds > 0 ? (occupiedBeds / totalBeds * 100).toFixed(1) : 0
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
