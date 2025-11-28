"use client"

import * as React from "react"
import { Search, Eye, Edit, Trash2, AlertTriangle, Eye as EyeIcon, PackagePlus, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { OpticalItemViewDialog } from "@/components/dialogs/optical-item-view-dialog"
import { StockHistoryDialog } from "@/components/dialogs/stock-history-dialog"
import { OpticalItemForm } from "@/components/forms/optical-item-form"
import { StockAdjustmentForm } from "@/components/forms/stock-adjustment-form"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { opticalPlanApi, type OpticalItem, type OpticalFilters, type OpticalMetrics } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { createClient } from "@/lib/supabase/client"

const itemTypeBadgeStyles = {
  frames: "bg-blue-50 text-blue-700 border border-blue-100",
  lenses: "bg-purple-50 text-purple-700 border border-purple-100",
  accessories: "bg-green-50 text-green-700 border border-green-100",
  equipment: "bg-orange-50 text-orange-700 border border-orange-100",
  consumables: "bg-gray-50 text-gray-700 border border-gray-100",
  medicine: "bg-rose-50 text-rose-700 border border-rose-100",
} as const

export default function OpticalPlanPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("created_at")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [editingItem, setEditingItem] = React.useState<OpticalItem | null>(null)
  const [metrics, setMetrics] = React.useState<OpticalMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = React.useState(false)

  // API hooks
  const {
    data: opticalItems,
    loading,
    error,
    pagination,
    search,
    sort,
    filter,
    changePage,
    changePageSize,
    addItem,
    updateItem,
    removeItem,
    refresh
  } = useApiList<OpticalItem>(opticalPlanApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createItem, loading: createLoading } = useApiForm<OpticalItem>()
  const { submitForm: updateOpticalItem, loading: updateLoading } = useApiForm<OpticalItem>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim())
      } else {
        search("")
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  // Handle page changes
  React.useEffect(() => {
    changePage(currentPage)
  }, [currentPage, changePage])

  React.useEffect(() => {
    changePageSize(pageSize)
  }, [pageSize, changePageSize])

  const handleAddItem = async (values: any) => {
    try {
      const result = await createItem(
        () => opticalPlanApi.create(values),
        {
          successMessage: `${values.name} has been added to inventory.`,
          onSuccess: (newItem) => {
            addItem(newItem)
            fetchMetrics() // Refresh metrics after creating item
          }
        }
      )
      if (result) {
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error creating optical item:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateItem = async (itemId: string, values: any) => {
    try {
      const result = await updateOpticalItem(
        () => opticalPlanApi.update(itemId, values),
        {
          successMessage: "Item updated successfully.",
          onSuccess: (updatedItem) => {
            updateItem(itemId, updatedItem)
            fetchMetrics() // Refresh metrics after updating item
          }
        }
      )
      if (result) {
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error updating optical item:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item. Please try again."
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const item = opticalItems.find(i => i.id === itemId)
    if (!item) return

    const success = await deleteItem(
      () => opticalPlanApi.delete(itemId),
      {
        successMessage: `${item.name} has been removed from inventory.`,
        onSuccess: () => {
          removeItem(itemId)
          fetchMetrics() // Refresh metrics after deleting item
        }
      }
    )
  }

  const handleEdit = (item: OpticalItem) => {
    setEditingItem(item)
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: OpticalFilters = {}

    if (filters.includes("low_stock")) {
      filterParams.low_stock = true
    }
    
    // Handle item type filters
    const itemTypeFilters = ["frames", "lenses", "accessories", "equipment", "consumables", "medicine"]
    const selectedTypes = filters.filter(f => itemTypeFilters.includes(f))
    if (selectedTypes.length > 0) {
      filterParams.item_type = selectedTypes[selectedTypes.length - 1]
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  // Fetch metrics from server
  const fetchMetrics = React.useCallback(async () => {
    setMetricsLoading(true)
    try {
      const response = await opticalPlanApi.metrics()
      if (response.success && response.data) {
        setMetrics(response.data)
      }
    } catch (error) {
      console.error('Error fetching optical plan metrics:', error)
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Refresh metrics when items are modified
  React.useEffect(() => {
    if (opticalItems.length > 0) {
      fetchMetrics()
    }
  }, [opticalItems.length, fetchMetrics])

  // Use server-provided aggregate metrics
  const lowStockItems = metrics?.low_stock_count || 0
  const totalValue = metrics?.total_inventory_value || 0

  // Realtime subscription for optical items
  React.useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('optical_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'optical_items'
        },
        (payload) => {
          console.log('Optical item change received:', payload)
          
          if (payload.eventType === 'INSERT') {
            addItem(payload.new as OpticalItem)
          } else if (payload.eventType === 'UPDATE') {
            updateItem(payload.new.id, payload.new as OpticalItem)
          } else if (payload.eventType === 'DELETE') {
            removeItem(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addItem, updateItem, removeItem])

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "low_stock", label: "Low Stock", count: lowStockItems },
      { id: "frames", label: "Frames", count: opticalItems.filter(i => i.item_type === "frames").length },
      { id: "lenses", label: "Lenses", count: opticalItems.filter(i => i.item_type === "lenses").length },
      { id: "accessories", label: "Accessories", count: opticalItems.filter(i => i.item_type === "accessories").length },
    ],
    sortOptions: [
      { id: "name", label: "Name" },
      { id: "category", label: "Category" },
      { id: "item_type", label: "Item Type" },
      { id: "stock_quantity", label: "Stock Level" },
      { id: "selling_price", label: "Selling Price" },
      { id: "mrp", label: "MRP" },
    ],
    showExport: false,
    showSettings: false,
  }

  // Metrics cards
  const metricsCards = [
    {
      title: "Total Items",
      value: metrics?.total_items || 0,
      description: "Items in inventory",
      color: "text-blue-600"
    },
    {
      title: "Low Stock",
      value: metrics?.low_stock_count || 0,
      description: "Items below reorder level",
      color: "text-red-600"
    },
    {
      title: "Inventory Value",
      value: `₹${(metrics?.total_inventory_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      description: "Total purchase value",
      color: "text-green-600"
    },
    {
      title: "Potential Revenue",
      value: `₹${(metrics?.total_potential_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      description: "At selling price",
      color: "text-purple-600"
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Optical Plan</h1>
            <p className="text-muted-foreground">
              Manage optical inventory including frames, lenses, and accessories
            </p>
          </div>
          <OpticalItemForm
            itemData={editingItem}
            mode={editingItem ? "edit" : "create"}
            onSubmit={editingItem ? (data) => handleUpdateItem(editingItem.id, data) : handleAddItem}
          >
            <Button className="gap-2 rounded-lg bg-emerald-600 text-white shadow-md transition-colors hover:bg-emerald-700">
              <EyeIcon className="h-4 w-4" />
              Add Item
            </Button>
          </OpticalItemForm>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsCards.map((card, index) => (
            <Card key={index} className="rounded-xl border border-slate-100 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  View and manage all optical items and stock levels
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search items..."
                    className="w-[300px] pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <ViewOptions
                  config={viewOptionsConfig}
                  currentView="list"
                  appliedFilters={appliedFilters}
                  currentSort={currentSort}
                  sortDirection={sortDirection}
                  onViewChange={() => {}}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  onExport={() => {}}
                  onSettings={() => {}}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      ITEM NAME
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      TYPE
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      CATEGORY
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      SKU
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      STOCK
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      SELLING PRICE
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      MRP
                    </TableHead>
                    <TableHead className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      STATUS
                    </TableHead>
                    <TableHead className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        Loading inventory...
                      </TableCell>
                    </TableRow>
                  ) : opticalItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    opticalItems.map((item) => {
                      const isLowStock = item.stock_quantity <= item.reorder_level
                      const isOutOfStock = item.stock_quantity === 0
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                <EyeIcon className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                {item.brand && (
                                  <div className="text-xs text-gray-500">{item.brand}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                itemTypeBadgeStyles[item.item_type as keyof typeof itemTypeBadgeStyles] ||
                                "bg-gray-50 text-gray-700 border border-gray-100"
                              }`}
                            >
                              {item.item_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-600">{item.sku}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-sm font-bold ${isLowStock ? "text-red-600" : "text-emerald-600"}`}
                                >
                                  {item.stock_quantity}
                                </span>
                                {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              </div>
                              <div className="text-[10px] text-gray-400">Reorder: {item.reorder_level}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-gray-900">
                            ₹{item.selling_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-gray-500">
                            ₹{item.mrp.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {isOutOfStock ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : isLowStock ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="secondary">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <OpticalItemViewDialog item={item}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </OpticalItemViewDialog>
                              <StockHistoryDialog
                                itemType="optical"
                                itemId={item.id}
                                itemName={item.name}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="View stock history">
                                  <History className="h-4 w-4" />
                                </Button>
                              </StockHistoryDialog>
                              <StockAdjustmentForm
                                itemType="optical"
                                itemId={item.id}
                                itemName={item.name}
                                currentStock={item.stock_quantity}
                                onSuccess={() => {
                                  refresh()
                                  fetchMetrics()
                                }}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Adjust stock">
                                  <PackagePlus className="h-4 w-4" />
                                </Button>
                              </StockAdjustmentForm>
                              <OpticalItemForm
                                itemData={item}
                                mode="edit"
                                onSubmit={(data) => handleUpdateItem(item.id, data)}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </OpticalItemForm>
                              <DeleteConfirmDialog
                                title="Delete Item"
                                description={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
                                onConfirm={() => handleDeleteItem(item.id)}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DeleteConfirmDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 0}
              pageSize={pagination?.limit || 10}
              totalItems={pagination?.total || 0}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

