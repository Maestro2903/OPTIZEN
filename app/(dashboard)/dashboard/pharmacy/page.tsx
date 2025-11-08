"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Pill,
  Package,
  AlertTriangle,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  Calendar,
} from "lucide-react"
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
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { pharmacyApi, type PharmacyItem, type PharmacyFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
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
  item_name: z.string().min(1, "Item name is required"),
  generic_name: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit_price: z.number().min(0, "Unit price must be positive"),
  selling_price: z.number().min(0, "Selling price must be positive"),
  current_stock: z.number().min(0, "Stock cannot be negative"),
  reorder_level: z.number().min(0, "Reorder level cannot be negative"),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  description: z.string().optional(),
})

const categoryColors = {
  antibiotics: "bg-red-100 text-red-700 border-red-200",
  analgesics: "bg-blue-100 text-blue-700 border-blue-200",
  antihistamines: "bg-green-100 text-green-700 border-green-200",
  supplements: "bg-yellow-100 text-yellow-700 border-yellow-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
}

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
      item_name: "",
      generic_name: "",
      manufacturer: "",
      category: "",
      unit_price: 0,
      selling_price: 0,
      current_stock: 0,
      reorder_level: 0,
      batch_number: "",
      expiry_date: "",
      description: "",
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
          successMessage: `${values.item_name} has been added to inventory.`,
          onSuccess: (newItem) => {
            addItem(newItem)
          }
        }
      )
      if (result) {
        setIsDialogOpen(false)
        form.reset()
      }
    } catch (error) {
      console.error('Error creating pharmacy item:', error)
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
        successMessage: `${item.item_name} has been removed from inventory.`,
        onSuccess: () => {
          removeItem(itemId)
        }
      }
    )
  }

  const handleEdit = (item: PharmacyItem) => {
    setEditingItem(item)
    form.reset({
      item_name: item.item_name,
      generic_name: item.generic_name || "",
      manufacturer: item.manufacturer || "",
      category: item.category,
      unit_price: item.unit_price,
      selling_price: item.selling_price,
      current_stock: item.current_stock,
      reorder_level: item.reorder_level,
      batch_number: item.batch_number || "",
      expiry_date: item.expiry_date || "",
      description: item.description || "",
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
    if (filters.includes("antibiotics")) {
      filterParams.category = "antibiotics"
    }
    if (filters.includes("analgesics")) {
      filterParams.category = "analgesics"
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  // TODO: CRITICAL - Replace with API aggregate values
  // Current calculations only use pharmacyItems (current page), not the entire inventory
  const lowStockItems = pharmacyItems.filter(item => item.current_stock <= item.reorder_level)
  const totalValue = pharmacyItems.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0)

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "low_stock", label: "Low Stock", count: lowStockItems.length },
      { id: "antibiotics", label: "Antibiotics", count: pharmacyItems.filter(i => i.category === "antibiotics").length },
      { id: "analgesics", label: "Analgesics", count: pharmacyItems.filter(i => i.category === "analgesics").length },
      { id: "supplements", label: "Supplements", count: pharmacyItems.filter(i => i.category === "supplements").length },
    ],
    sortOptions: [
      { id: "item_name", label: "Name" },
      { id: "category", label: "Category" },
      { id: "current_stock", label: "Stock Level" },
      { id: "unit_price", label: "Price" },
      { id: "expiry_date", label: "Expiry Date" },
    ],
    showExport: true,
    showSettings: true,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Inventory</h1>
          <p className="text-muted-foreground">
            Manage medical supplies and pharmacy stock
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingItem(null)
            form.reset()
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
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
                    name="item_name"
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
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price *</FormLabel>
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
                    name="current_stock"
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">on this page</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">current page only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.from(new Set(pharmacyItems.map(i => i.category))).length}</div>
            <p className="text-xs text-muted-foreground">on this page</p>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                  className="pl-8 w-[300px]"
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ITEM NAME</TableHead>
                  <TableHead>CATEGORY</TableHead>
                  <TableHead>STOCK</TableHead>
                  <TableHead>UNIT PRICE</TableHead>
                  <TableHead>SELLING PRICE</TableHead>
                  <TableHead>BATCH</TableHead>
                  <TableHead>EXPIRY</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : pharmacyItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  pharmacyItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{item.item_name}</div>
                          {item.generic_name && <div className="text-sm text-muted-foreground">{item.generic_name}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${categoryColors[item.category as keyof typeof categoryColors] || ''}`}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.current_stock}</div>
                        <div className="text-sm text-muted-foreground">Reorder: {item.reorder_level}</div>
                      </TableCell>
                      <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>₹{item.selling_price.toFixed(2)}</TableCell>
                      <TableCell>{item.batch_number || '-'}</TableCell>
                      <TableCell>
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-GB') : '-'}
                      </TableCell>
                      <TableCell>
                        {item.current_stock <= item.reorder_level ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Delete Item"
                            description={`Are you sure you want to delete ${item.item_name}? This action cannot be undone.`}
                            onConfirm={() => handleDeleteItem(item.id)}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
  )
}