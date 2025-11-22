import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/pharmacy/metrics - Get aggregate pharmacy statistics
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('pharmacy', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()

    // Fetch all pharmacy items for aggregation
    const { data: items, error } = await supabase
      .from('pharmacy_items')
      .select('stock_quantity, reorder_level, unit_price, is_low_stock')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pharmacy metrics' },
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

    // Calculate total inventory value (stock_quantity * unit_price)
    const totalInventoryValue = items?.reduce((sum, item) => {
      const value = (item.stock_quantity || 0) * (item.unit_price || 0)
      return sum + value
    }, 0) || 0

    // Calculate average unit price
    const averageUnitPrice = totalItems > 0
      ? items?.reduce((sum, item) => sum + (item.unit_price || 0), 0) / totalItems || 0
      : 0

    // Count items by low stock status (using computed column if available)
    const lowStockByComputedColumn = items?.filter(item => 
      item.is_low_stock === true
    ).length || 0

    return NextResponse.json({
      success: true,
      data: {
        total_items: totalItems,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_inventory_value: totalInventoryValue,
        average_unit_price: averageUnitPrice,
        // Additional helpful metrics
        low_stock_by_computed: lowStockByComputedColumn,
        items_above_reorder: totalItems - lowStockCount
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching pharmacy metrics' },
      { status: 500 }
    )
  }
}

