import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/optical-plan/metrics - Get aggregate optical items statistics
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('optical_plan', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()

    // Fetch all optical items for aggregation
    const { data: items, error } = await supabase
      .from('optical_items')
      .select('stock_quantity, reorder_level, purchase_price, selling_price, mrp')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch optical plan metrics' },
        { status: 500 }
      )
    }

    // Calculate aggregates
    const totalItems = items?.length || 0
    
    // Count low stock items (stock_quantity <= reorder_level)
    const lowStockCount = items?.filter(item => 
      item.stock_quantity <= item.reorder_level
    ).length || 0

    // Count out of stock items (stock_quantity = 0)
    const outOfStockCount = items?.filter(item => 
      item.stock_quantity === 0
    ).length || 0

    // Calculate total inventory value (stock_quantity * purchase_price)
    const totalInventoryValue = items?.reduce((sum, item) => {
      const value = (item.stock_quantity || 0) * (item.purchase_price || 0)
      return sum + value
    }, 0) || 0

    // Calculate total potential revenue (stock_quantity * selling_price)
    const totalPotentialRevenue = items?.reduce((sum, item) => {
      const value = (item.stock_quantity || 0) * (item.selling_price || 0)
      return sum + value
    }, 0) || 0

    // Calculate average purchase price
    const averagePurchasePrice = totalItems > 0
      ? items?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) / totalItems || 0
      : 0

    // Count items above reorder level
    const itemsAboveReorder = totalItems - lowStockCount

    return NextResponse.json({
      success: true,
      data: {
        total_items: totalItems,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_inventory_value: totalInventoryValue,
        total_potential_revenue: totalPotentialRevenue,
        average_purchase_price: averagePurchasePrice,
        items_above_reorder: itemsAboveReorder
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching optical plan metrics' },
      { status: 500 }
    )
  }
}

