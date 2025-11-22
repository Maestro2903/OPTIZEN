"use client"

import * as React from "react"
import { Search, Pill, Eye, Edit, Trash2, Printer, AlertTriangle, Calendar, Snowflake } from "lucide-react"
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
import { PharmacyPrint } from "@/components/print/pharmacy-print"
import { PharmacyViewDialog } from "@/components/dialogs/pharmacy-view-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { pharmacyApi, type PharmacyItem, type PharmacyFilters, type PharmacyMetrics } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const pharmacyItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  generic_name: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit_price: z.number().min(0, "Unit price must be positive"),
  mrp: z.number().min(0, "MRP must be positive"),
  stock_quantity: z.number().min(0, "Stock cannot be negative"),
  reorder_level: z.number().min(0, "Reorder level cannot be negative"),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  hsn_code: z.string().optional(),
  gst_percentage: z.number().optional(),
  prescription_required: z.boolean().optional(),
  dosage_form: z.string().optional(),
  strength: z.string().optional(),
  storage_instructions: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
})

const categoryBadgeStyles = {
  antibiotics: "bg-rose-50 text-rose-700 border border-rose-100",
  analgesics: "bg-amber-50 text-amber-700 border border-amber-100",
  antihistamines: "bg-purple-50 text-purple-700 border border-purple-100",
  supplements: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  other: "bg-slate-50 text-slate-700 border border-slate-100",
} as const

const THREE_MONTHS_IN_MS = 1000 * 60 * 60 * 24 * 90
const refrigerationCategories = ["antihistamines", "supplements"]
const refrigerationKeywords = [/refrigerat/i, /cold storage/i, /keep chilled/i]

export default function PharmacyPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("item_name")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<PharmacyItem | null>(null)
  const [metrics, setMetrics] = React.useState<PharmacyMetrics | null>(null)
  const [metricsLoading, setMetricsLoading] = React.useState(false)

  // API hooks
  const {
    data: pharmacyItems,
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
  } = useApiList<PharmacyItem>(pharmacyApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createItem, loading: createLoading } = useApiForm<PharmacyItem>()
  const { submitForm: updatePharmacyItem, loading: updateLoading } = useApiForm<PharmacyItem>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  const form = useForm<z.infer<typeof pharmacyItemSchema>>({
    resolver: zodResolver(pharmacyItemSchema),
    defaultValues: {
      name: "",
      generic_name: "",
      manufacturer: "",
      supplier: "",
      category: "",
      unit_price: 0,
      mrp: 0,
      stock_quantity: 0,
      reorder_level: 10,
      batch_number: "",
      expiry_date: "",
      hsn_code: "",
      gst_percentage: 0,
      prescription_required: false,
      dosage_form: "",
      strength: "",
      storage_instructions: "",
      description: "",
      image_url: "",
    },
  })

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

  const handleAddItem = async (values: z.infer<typeof pharmacyItemSchema>) => {
    try {
      const result = await createItem(
        () => pharmacyApi.create(values),
        {
          successMessage: `${values.name} has been added to inventory.`,
          onSuccess: (newItem) => {
            addItem(newItem)
            fetchMetrics() // Refresh metrics after creating item
          }
        }
      )
      if (result) {
        setIsDialogOpen(false)
        form.reset()
      }
    } catch (error) {
      console.error('Error creating pharmacy item:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateItem = async (itemId: string, values: z.infer<typeof pharmacyItemSchema>) => {
    try {
      const result = await updatePharmacyItem(
        () => pharmacyApi.update(itemId, values),
        {
          successMessage: "Item updated successfully.",
          onSuccess: (updatedItem) => {
            updateItem(itemId, updatedItem)
            fetchMetrics() // Refresh metrics after updating item
          }
        }
      )
      if (result) {
        setIsDialogOpen(false)
        setEditingItem(null)
        form.reset()
      }
    } catch (error) {
      console.error('Error updating pharmacy item:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item. Please try again."
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const item = pharmacyItems.find(i => i.id === itemId)
    if (!item) return

    const success = await deleteItem(
      () => pharmacyApi.delete(itemId),
      {
        successMessage: `${item.name} has been removed from inventory.`,
        onSuccess: () => {
          removeItem(itemId)
          fetchMetrics() // Refresh metrics after deleting item
        }
      }
    )
  }

  const handleEdit = (item: PharmacyItem) => {
    setEditingItem(item)
    form.reset({
      name: item.name,
      generic_name: item.generic_name || "",
      manufacturer: item.manufacturer || "",
      supplier: item.supplier || "",
      category: item.category,
      unit_price: item.unit_price,
      mrp: item.mrp,
      stock_quantity: item.stock_quantity,
      reorder_level: item.reorder_level,
      batch_number: item.batch_number || "",
      expiry_date: item.expiry_date || "",
      hsn_code: item.hsn_code || "",
      gst_percentage: item.gst_percentage || 0,
      prescription_required: item.prescription_required || false,
      dosage_form: item.dosage_form || "",
      strength: item.strength || "",
      storage_instructions: item.storage_instructions || "",
      description: item.description || "",
      image_url: item.image_url || "",
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (values: z.infer<typeof pharmacyItemSchema>) => {
    if (editingItem) {
      await handleUpdateItem(editingItem.id, values)
    } else {
      await handleAddItem(values)
    }
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: PharmacyFilters = {}

    if (filters.includes("low_stock")) {
      filterParams.low_stock = true
    }
    
    // Handle category filters - only one category should be active at a time
    // If multiple category filters are selected, use the last one
    const categoryFilters = ["antibiotics", "analgesics", "supplements"]
    const selectedCategories = filters.filter(f => categoryFilters.includes(f))
    if (selectedCategories.length > 0) {
      // Use the last selected category
      filterParams.category = selectedCategories[selectedCategories.length - 1]
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
      const response = await pharmacyApi.metrics()
      if (response.success && response.data) {
        setMetrics(response.data)
      }
    } catch (error) {
      console.error('Error fetching pharmacy metrics:', error)
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Refresh metrics when items are modified
  React.useEffect(() => {
    if (pharmacyItems.length > 0) {
      fetchMetrics()
    }
  }, [pharmacyItems.length, fetchMetrics])

  // Use server-provided aggregate metrics instead of calculating from paginated data
  const lowStockItems = metrics?.low_stock_count || 0
  const totalValue = metrics?.total_inventory_value || 0

  // Realtime subscription for pharmacy items
  React.useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('pharmacy_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pharmacy_items'
        },
        (payload) => {
          console.log('Pharmacy change received:', payload)
          
          if (payload.eventType === 'INSERT') {
            addItem(payload.new as PharmacyItem)
          } else if (payload.eventType === 'UPDATE') {
            updateItem(payload.new.id, payload.new as PharmacyItem)
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
      { id: "antibiotics", label: "Antibiotics", count: pharmacyItems.filter(i => i.category === "antibiotics").length },
      { id: "analgesics", label: "Analgesics", count: pharmacyItems.filter(i => i.category === "analgesics").length },
      { id: "supplements", label: "Supplements", count: pharmacyItems.filter(i => i.category === "supplements").length },
    ],
    sortOptions: [
      { id: "name", label: "Name" },
      { id: "category", label: "Category" },
      { id: "stock_quantity", label: "Stock Level" },
      { id: "unit_price", label: "Price" },
      { id: "expiry_date", label: "Expiry Date" },
    ],
    showExport: false,
    showSettings: false,
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Pharmacy Inventory</h1>
            <p className="text-muted-foreground">
              Manage medical supplies and pharmacy stock
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                setEditingItem(null)
                form.reset()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-lg bg-emerald-600 text-white shadow-md transition-colors hover:bg-emerald-700">
                <Pill className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update item information" : "Add a new item to the pharmacy inventory"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Paracetamol 500mg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="generic_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generic Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acetaminophen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="antibiotics">Antibiotics</SelectItem>
                            <SelectItem value="analgesics">Analgesics</SelectItem>
                            <SelectItem value="antihistamines">Antihistamines</SelectItem>
                            <SelectItem value="supplements">Supplements</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MRP *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reorder_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reorder Level *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="batch_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch Number</FormLabel>
                        <FormControl>
                          <Input placeholder="B123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    setEditingItem(null)
                    form.reset()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading || updateLoading}>
                    {createLoading || updateLoading ? "Processing..." : (editingItem ? "Update Item" : "Add Item")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
        <Card className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  View and manage all pharmacy items and stock levels
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
                      CATEGORY
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      STOCK
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      UNIT PRICE
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      MRP
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      BATCH
                    </TableHead>
                    <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      EXPIRY
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
                  ) : pharmacyItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    pharmacyItems.map((item) => {
                      const isLowStock = item.stock_quantity < item.reorder_level
                      const needsRefrigeration =
                        refrigerationCategories.includes(item.category) ||
                        (item.storage_instructions
                          ? refrigerationKeywords.some((regex) => regex.test(item.storage_instructions!))
                          : false)
                      const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null
                      const timeToExpiry = expiryDate ? expiryDate.getTime() - Date.now() : null
                      const isExpired = timeToExpiry !== null && timeToExpiry < 0
                      const isExpiringSoon =
                        timeToExpiry !== null && timeToExpiry >= 0 && timeToExpiry <= THREE_MONTHS_IN_MS
                      const expiryTextClass = isExpired
                        ? "text-red-600"
                        : isExpiringSoon
                        ? "text-amber-600"
                        : "text-gray-700"
                      const formattedExpiry = expiryDate
                        ? expiryDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : null
                      return (
                        <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                              <Pill className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                {needsRefrigeration && <Snowflake className="h-3 w-3 text-sky-500" />}
                              </div>
                              {item.generic_name && (
                                <div className="text-xs italic text-gray-500">{item.generic_name}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`capitalize rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              categoryBadgeStyles[item.category as keyof typeof categoryBadgeStyles] ||
                              "bg-gray-50 text-gray-700 border border-gray-100"
                            }`}
                          >
                            {item.category}
                          </Badge>
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
                          ₹{item.unit_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-gray-500 hover:line-through">
                          ₹{item.mrp.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.batch_number ? (
                            <span className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-600">
                              {item.batch_number}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {formattedExpiry ? (
                            <div className="flex items-center gap-1">
                              <Calendar
                                className={`h-4 w-4 ${
                                  isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-gray-400"
                                }`}
                              />
                              <span className={`text-sm ${expiryTextClass}`}>{formattedExpiry}</span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {item.stock_quantity <= item.reorder_level ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="secondary">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <PharmacyViewDialog item={item}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </PharmacyViewDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <PharmacyPrint
                              pharmacy={{
                                id: item.id,
                                name: item.name,
                                generic_name: item.generic_name,
                                manufacturer: item.manufacturer,
                                category: item.category,
                                unit_price: item.unit_price,
                                mrp: item.mrp,
                                stock_quantity: item.stock_quantity,
                                reorder_level: item.reorder_level,
                                batch_number: item.batch_number,
                                expiry_date: item.expiry_date,
                                description: item.description,
                                storage_instructions: item.storage_instructions,
                                hsn_code: item.hsn_code,
                                supplier: item.supplier,
                              }}
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Print inventory record">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </PharmacyPrint>
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