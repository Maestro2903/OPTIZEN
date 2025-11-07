"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Package,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  BarChart3,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PharmacyItemForm } from "@/components/pharmacy-item-form"
import { OpticalItemForm } from "@/components/optical-item-form"
import { StockMovementForm } from "@/components/stock-movement-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"

// Mock data for pharmacy items
const pharmacyItems = [
  {
    id: "1",
    name: "Timolol Eye Drops",
    generic_name: "Timolol Maleate",
    category: "Eye Drops",
    stock_quantity: 45,
    reorder_level: 20,
    unit_price: 85.50,
    mrp: 120.00,
    expiry_date: "15/08/2026",
    batch_number: "TD2024A",
    supplier: "Pharma Vision Ltd",
  },
  {
    id: "2",
    name: "Ciprofloxacin Eye Drops",
    generic_name: "Ciprofloxacin HCl",
    category: "Antibiotics",
    stock_quantity: 8,
    reorder_level: 15,
    unit_price: 45.00,
    mrp: 65.00,
    expiry_date: "22/02/2025",
    batch_number: "CP2024B",
    supplier: "MedSupply Co",
  },
  {
    id: "3",
    name: "Artificial Tears",
    generic_name: "Carboxymethylcellulose",
    category: "Eye Drops",
    stock_quantity: 120,
    reorder_level: 30,
    unit_price: 95.00,
    mrp: 135.00,
    expiry_date: "10/12/2026",
    batch_number: "AT2025C",
    supplier: "Pharma Vision Ltd",
  },
  {
    id: "4",
    name: "Prednisolone Eye Drops",
    generic_name: "Prednisolone Acetate",
    category: "Anti-inflammatory",
    stock_quantity: 32,
    reorder_level: 15,
    unit_price: 110.00,
    mrp: 155.00,
    expiry_date: "05/03/2025",
    batch_number: "PD2024D",
    supplier: "MedSupply Co",
  },
]

// Mock data for optical items
const opticalItems = [
  {
    id: "1",
    sku: "FR-001-BLK",
    name: "Classic Aviator Frame",
    brand: "Ray-Ban",
    item_type: "frames",
    category: "Sunglasses",
    color: "Black",
    size: "52-18-140",
    stock_quantity: 15,
    reorder_level: 5,
    selling_price: 2500.00,
    mrp: 3500.00,
  },
  {
    id: "2",
    sku: "LN-002-CLR",
    name: "Progressive Lenses",
    brand: "Essilor",
    item_type: "lenses",
    category: "Progressive",
    color: "Clear",
    size: "N/A",
    stock_quantity: 25,
    reorder_level: 10,
    selling_price: 3500.00,
    mrp: 4500.00,
  },
  {
    id: "3",
    sku: "FR-003-BRN",
    name: "Rectangular Metal Frame",
    brand: "Oakley",
    item_type: "frames",
    category: "Eyeglasses",
    color: "Brown",
    size: "54-16-135",
    stock_quantity: 3,
    reorder_level: 8,
    selling_price: 3200.00,
    mrp: 4200.00,
  },
  {
    id: "4",
    sku: "AC-004-BLU",
    name: "Premium Lens Cleaning Kit",
    brand: "Zeiss",
    item_type: "accessories",
    category: "Cleaning Kits",
    color: "Blue",
    size: "Standard",
    stock_quantity: 45,
    reorder_level: 15,
    selling_price: 450.00,
    mrp: 650.00,
  },
]

// Mock data for stock movements
const stockMovements = [
  {
    id: "1",
    date: "05/11/2025",
    type: "purchase",
    item_type: "pharmacy",
    item_name: "Timolol Eye Drops",
    quantity: 50,
    unit_price: 85.50,
    total: 4275.00,
    supplier: "Pharma Vision Ltd",
    reference: "PO-2025-145",
  },
  {
    id: "2",
    date: "04/11/2025",
    type: "sale",
    item_type: "optical",
    item_name: "Classic Aviator Frame",
    quantity: -2,
    unit_price: 2500.00,
    total: 5000.00,
    customer: "AARAV MEHTA",
    reference: "INV-2025-089",
  },
  {
    id: "3",
    date: "03/11/2025",
    type: "expired",
    item_type: "pharmacy",
    item_name: "Ciprofloxacin Eye Drops",
    quantity: -5,
    unit_price: 45.00,
    total: -225.00,
    reference: "EXP-2025-012",
  },
  {
    id: "4",
    date: "02/11/2025",
    type: "purchase",
    item_type: "optical",
    item_name: "Progressive Lenses",
    quantity: 20,
    unit_price: 3500.00,
    total: 70000.00,
    supplier: "Essilor India",
    reference: "PO-2025-144",
  },
]

const movementTypeColors = {
  purchase: "bg-green-100 text-green-700 border-green-200",
  sale: "bg-blue-100 text-blue-700 border-blue-200",
  adjustment: "bg-gray-100 text-gray-700 border-gray-200",
  return: "bg-yellow-100 text-yellow-700 border-yellow-200",
  expired: "bg-red-100 text-red-700 border-red-200",
  damaged: "bg-red-100 text-red-700 border-red-200",
}

export default function PharmacyPage() {
  const [currentView, setCurrentView] = React.useState("list")
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("name")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const [pharmCurrentView, setPharmCurrentView] = React.useState("list")
  const [pharmAppliedFilters, setPharmAppliedFilters] = React.useState<string[]>([])
  const [pharmCurrentSort, setPharmCurrentSort] = React.useState("name")
  const [pharmSortDirection, setPharmSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [pharmSearchTerm, setPharmSearchTerm] = React.useState("")

  const [opticalCurrentView, setOpticalCurrentView] = React.useState("list")
  const [opticalAppliedFilters, setOpticalAppliedFilters] = React.useState<string[]>([])
  const [opticalCurrentSort, setOpticalCurrentSort] = React.useState("name")
  const [opticalSortDirection, setOpticalSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [opticalSearchTerm, setOpticalSearchTerm] = React.useState("")

  const [movementsCurrentView, setMovementsCurrentView] = React.useState("list")
  const [movementsAppliedFilters, setMovementsAppliedFilters] = React.useState<string[]>([])
  const [movementsCurrentSort, setMovementsCurrentSort] = React.useState("date")
  const [movementsSortDirection, setMovementsSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [movementsSearchTerm, setMovementsSearchTerm] = React.useState("")
  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate.split("/").reverse().join("-"))
    const diffMonths = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24 * 30)
    
    if (diffMonths < 0) return { color: "bg-red-100 text-red-700 border-red-200", text: "Expired" }
    if (diffMonths < 3) return { color: "bg-yellow-100 text-yellow-700 border-yellow-200", text: "Expiring Soon" }
    return { color: "bg-green-100 text-green-700 border-green-200", text: "Good" }
  }

  const getLowStockStatus = (stock: number, reorder: number) => {
    if (stock === 0) return { color: "bg-red-100 text-red-700 border-red-200", text: "Out of Stock" }
    if (stock <= reorder) return { color: "bg-yellow-100 text-yellow-700 border-yellow-200", text: "Low Stock" }
    return { color: "bg-green-100 text-green-700 border-green-200", text: "In Stock" }
  }

  const lowStockPharmacy = pharmacyItems.filter(item => item.stock_quantity <= item.reorder_level).length
  const expiringSoon = pharmacyItems.filter(item => {
    const expiry = new Date(item.expiry_date.split("/").reverse().join("-"))
    const today = new Date()
    const diffMonths = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24 * 30)
    return diffMonths < 3 && diffMonths > 0
  }).length

  const lowStockOptical = opticalItems.filter(item => item.stock_quantity <= item.reorder_level).length
  const totalInventoryValue = [...pharmacyItems, ...opticalItems].reduce((sum, item) => {
    return sum + (item.mrp * item.stock_quantity)
  }, 0)

  // View options configurations for each tab
  const pharmacyViewConfig: ViewOptionsConfig = {
    views: [
      { id: "list", label: "List" },
      { id: "grid", label: "Grid" },
    ],
    filters: [
      { id: "low-stock", label: "Low Stock", count: pharmacyItems.filter(item => item.stock_quantity <= item.reorder_level).length },
      { id: "expiring", label: "Expiring Soon", count: expiringSoon },
      { id: "eye-drops", label: "Eye Drops", count: pharmacyItems.filter(item => item.category === "Eye Drops").length },
      { id: "antibiotics", label: "Antibiotics", count: pharmacyItems.filter(item => item.category === "Antibiotics").length },
    ],
    sortOptions: [
      { id: "name", label: "Name" },
      { id: "stock", label: "Stock Quantity" },
      { id: "price", label: "Price" },
      { id: "expiry", label: "Expiry Date" },
    ],
    showExport: true,
  }

  const opticalViewConfig: ViewOptionsConfig = {
    views: [
      { id: "list", label: "List" },
      { id: "grid", label: "Grid" },
    ],
    filters: [
      { id: "low-stock", label: "Low Stock", count: lowStockOptical },
      { id: "frames", label: "Frames", count: opticalItems.filter(item => item.item_type === "frames").length },
      { id: "lenses", label: "Lenses", count: opticalItems.filter(item => item.item_type === "lenses").length },
      { id: "accessories", label: "Accessories", count: opticalItems.filter(item => item.item_type === "accessories").length },
    ],
    sortOptions: [
      { id: "name", label: "Name" },
      { id: "stock", label: "Stock Quantity" },
      { id: "price", label: "Price" },
      { id: "brand", label: "Brand" },
    ],
    showExport: true,
  }

  const movementsViewConfig: ViewOptionsConfig = {
    views: [
      { id: "list", label: "List" },
    ],
    filters: [
      { id: "purchase", label: "Purchase", count: stockMovements.filter(m => m.type === "purchase").length },
      { id: "sale", label: "Sale", count: stockMovements.filter(m => m.type === "sale").length },
      { id: "expired", label: "Expired", count: stockMovements.filter(m => m.type === "expired").length },
      { id: "pharmacy", label: "Pharmacy", count: stockMovements.filter(m => m.item_type === "pharmacy").length },
      { id: "optical", label: "Optical", count: stockMovements.filter(m => m.item_type === "optical").length },
    ],
    sortOptions: [
      { id: "date", label: "Date" },
      { id: "type", label: "Type" },
      { id: "value", label: "Total Value" },
      { id: "quantity", label: "Quantity" },
    ],
    showExport: true,
  }

  // Filter and sort functions for each tab
  const filteredAndSortedPharmacyItems = React.useMemo(() => {
    let filtered = [...pharmacyItems]

    // Apply text search
    if (pharmSearchTerm.trim()) {
      const q = pharmSearchTerm.trim().toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.generic_name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.batch_number.toLowerCase().includes(q)
      )
    }

    if (pharmAppliedFilters.includes("low-stock")) {
      filtered = filtered.filter(item => item.stock_quantity <= item.reorder_level)
    }
    if (pharmAppliedFilters.includes("expiring")) {
      filtered = filtered.filter(item => {
        const expiry = new Date(item.expiry_date.split("/").reverse().join("-"))
        const today = new Date()
        const diffMonths = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24 * 30)
        return diffMonths < 3 && diffMonths > 0
      })
    }
    if (pharmAppliedFilters.includes("eye-drops")) {
      filtered = filtered.filter(item => item.category === "Eye Drops")
    }
    if (pharmAppliedFilters.includes("antibiotics")) {
      filtered = filtered.filter(item => item.category === "Antibiotics")
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (pharmCurrentSort) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "stock":
          aValue = a.stock_quantity
          bValue = b.stock_quantity
          break
        case "price":
          aValue = a.unit_price
          bValue = b.unit_price
          break
        case "expiry":
          aValue = new Date(a.expiry_date.split("/").reverse().join("-"))
          bValue = new Date(b.expiry_date.split("/").reverse().join("-"))
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (pharmSortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [pharmAppliedFilters, pharmCurrentSort, pharmSortDirection, pharmSearchTerm])

  const filteredAndSortedOpticalItems = React.useMemo(() => {
    let filtered = [...opticalItems]

    // Apply text search
    if (opticalSearchTerm.trim()) {
      const q = opticalSearchTerm.trim().toLowerCase()
      filtered = filtered.filter(item =>
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.item_type.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q)
      )
    }

    if (opticalAppliedFilters.includes("low-stock")) {
      filtered = filtered.filter(item => item.stock_quantity <= item.reorder_level)
    }
    if (opticalAppliedFilters.includes("frames")) {
      filtered = filtered.filter(item => item.item_type === "frames")
    }
    if (opticalAppliedFilters.includes("lenses")) {
      filtered = filtered.filter(item => item.item_type === "lenses")
    }
    if (opticalAppliedFilters.includes("accessories")) {
      filtered = filtered.filter(item => item.item_type === "accessories")
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (opticalCurrentSort) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "stock":
          aValue = a.stock_quantity
          bValue = b.stock_quantity
          break
        case "price":
          aValue = a.selling_price
          bValue = b.selling_price
          break
        case "brand":
          aValue = a.brand
          bValue = b.brand
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (opticalSortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [opticalAppliedFilters, opticalCurrentSort, opticalSortDirection, opticalSearchTerm])

  const filteredAndSortedMovements = React.useMemo(() => {
    let filtered = [...stockMovements]

    // Apply text search
    if (movementsSearchTerm.trim()) {
      const q = movementsSearchTerm.trim().toLowerCase()
      filtered = filtered.filter(m =>
        m.item_name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.item_type.toLowerCase().includes(q) ||
        (m.reference || '').toLowerCase().includes(q) ||
        (m.customer || '').toLowerCase().includes(q) ||
        (m.supplier || '').toLowerCase().includes(q)
      )
    }

    if (movementsAppliedFilters.includes("purchase")) {
      filtered = filtered.filter(m => m.type === "purchase")
    }
    if (movementsAppliedFilters.includes("sale")) {
      filtered = filtered.filter(m => m.type === "sale")
    }
    if (movementsAppliedFilters.includes("expired")) {
      filtered = filtered.filter(m => m.type === "expired")
    }
    if (movementsAppliedFilters.includes("pharmacy")) {
      filtered = filtered.filter(m => m.item_type === "pharmacy")
    }
    if (movementsAppliedFilters.includes("optical")) {
      filtered = filtered.filter(m => m.item_type === "optical")
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (movementsCurrentSort) {
        case "date":
          aValue = new Date(a.date.split("/").reverse().join("-"))
          bValue = new Date(b.date.split("/").reverse().join("-"))
          break
        case "type":
          aValue = a.type
          bValue = b.type
          break
        case "value":
          aValue = a.total
          bValue = b.total
          break
        case "quantity":
          aValue = Math.abs(a.quantity)
          bValue = Math.abs(b.quantity)
          break
        default:
          aValue = new Date(a.date.split("/").reverse().join("-"))
          bValue = new Date(b.date.split("/").reverse().join("-"))
      }

      if (movementsSortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [movementsAppliedFilters, movementsCurrentSort, movementsSortDirection, movementsSearchTerm])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy & Inventory</h1>
          <p className="text-muted-foreground">
            Manage medicines, optical items, and stock movements
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pharmacyItems.length + opticalItems.length}</div>
            <p className="text-xs text-muted-foreground">pharmacy + optical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockPharmacy + lowStockOptical}</div>
            <p className="text-xs text-muted-foreground">needs reordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon}</div>
            <p className="text-xs text-muted-foreground">within 3 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalInventoryValue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">inventory value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pharmacy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pharmacy">Pharmacy Items</TabsTrigger>
          <TabsTrigger value="optical">Optical Items</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="pharmacy" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pharmacy Inventory</CardTitle>
                  <CardDescription>
                    Medicines and pharmaceutical products
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search medicines..."
                      className="pl-8 w-[200px]"
                      value={pharmSearchTerm}
                      onChange={(e) => setPharmSearchTerm(e.target.value)}
                    />
                  </div>
                  <ViewOptions
                    config={pharmacyViewConfig}
                    currentView={pharmCurrentView}
                    appliedFilters={pharmAppliedFilters}
                    currentSort={pharmCurrentSort}
                    sortDirection={pharmSortDirection}
                    onViewChange={setPharmCurrentView}
                    onFilterChange={setPharmAppliedFilters}
                    onSortChange={(sort, direction) => {
                      setPharmCurrentSort(sort)
                      setPharmSortDirection(direction)
                    }}
                    onExport={() => console.log("Export pharmacy data")}
                  />
                  <PharmacyItemForm>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Medicine
                    </Button>
                  </PharmacyItemForm>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>STOCK</TableHead>
                      <TableHead>UNIT PRICE</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>BATCH</TableHead>
                      <TableHead>EXPIRY</TableHead>
                      <TableHead>SUPPLIER</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPharmacyItems.map((item) => {
                      const stockStatus = getLowStockStatus(item.stock_quantity, item.reorder_level)
                      const expiryStatus = getExpiryStatus(item.expiry_date)
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.generic_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{item.stock_quantity}</span>
                              <Badge variant="outline" className={stockStatus.color}>
                                {stockStatus.text}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                          <TableCell>₹{item.mrp.toFixed(2)}</TableCell>
                          <TableCell className="text-sm">{item.batch_number}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.expiry_date}</span>
                              <Badge variant="outline" className={expiryStatus.color}>
                                {expiryStatus.text}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{item.supplier}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ViewEditDialog
                                title={`Medicine - ${item.name}`}
                                description={item.generic_name}
                                data={item as any}
                                renderViewAction={(data: any) => (
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Name</p>
                                      <p className="font-medium">{data.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Generic</p>
                                      <p className="text-muted-foreground">{data.generic_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Category</p>
                                      <Badge variant="secondary">{data.category}</Badge>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Supplier</p>
                                      <p className="text-sm">{data.supplier}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Stock</p>
                                      <p className="font-semibold">{data.stock_quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Reorder Level</p>
                                      <p className="font-semibold">{data.reorder_level}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Unit Price</p>
                                      <p className="font-semibold">₹{Number(data.unit_price).toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">MRP</p>
                                      <p className="font-semibold">₹{Number(data.mrp).toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Batch</p>
                                      <p className="font-mono text-xs">{data.batch_number}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Expiry</p>
                                      <p className="text-sm">{data.expiry_date}</p>
                                    </div>
                                  </div>
                                )}
                                renderEditAction={(form: any) => (
                                  <Form {...form}>
                                    <div className="grid grid-cols-2 gap-4">
                                      <FormField control={form.control} name={"name"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Name</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"generic_name"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Generic Name</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"category"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Category</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"supplier"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Supplier</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"stock_quantity"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Stock Quantity</FormLabel>
                                          <FormControl>
                                            <Input type="number" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"reorder_level"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Reorder Level</FormLabel>
                                          <FormControl>
                                            <Input type="number" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"unit_price"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Unit Price</FormLabel>
                                          <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"mrp"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>MRP</FormLabel>
                                          <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"batch_number"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Batch Number</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                      <FormField control={form.control} name={"expiry_date"} render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Expiry Date</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}/>
                                    </div>
                                  </Form>
                                )}
                                onSaveAction={async (values: any) => {
                                  console.log("Update medicine", values)
                                }}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </ViewEditDialog>
                              <PharmacyItemForm itemData={item} mode="edit">
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PharmacyItemForm>
                              <DeleteConfirmDialog
                                title="Delete Medicine"
                                description={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
                                onConfirm={() => console.log("Delete:", item.id)}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DeleteConfirmDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optical" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Optical Inventory</CardTitle>
                  <CardDescription>
                    Frames, lenses, and accessories
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search items..."
                      className="pl-8 w-[200px]"
                      value={opticalSearchTerm}
                      onChange={(e) => setOpticalSearchTerm(e.target.value)}
                    />
                  </div>
                  <ViewOptions
                    config={opticalViewConfig}
                    currentView={opticalCurrentView}
                    appliedFilters={opticalAppliedFilters}
                    currentSort={opticalCurrentSort}
                    sortDirection={opticalSortDirection}
                    onViewChange={setOpticalCurrentView}
                    onFilterChange={setOpticalAppliedFilters}
                    onSortChange={(sort, direction) => {
                      setOpticalCurrentSort(sort)
                      setOpticalSortDirection(direction)
                    }}
                    onExport={() => console.log("Export optical data")}
                  />
                  <OpticalItemForm>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </OpticalItemForm>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>BRAND</TableHead>
                      <TableHead>TYPE</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>COLOR/SIZE</TableHead>
                      <TableHead>STOCK</TableHead>
                      <TableHead>PRICE</TableHead>
                      <TableHead>MRP</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedOpticalItems.map((item) => {
                      const stockStatus = getLowStockStatus(item.stock_quantity, item.reorder_level)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.brand}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">{item.item_type}</Badge>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-sm">
                            <div>{item.color}</div>
                            <div className="text-xs text-muted-foreground">{item.size}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{item.stock_quantity}</span>
                              <Badge variant="outline" className={stockStatus.color}>
                                {stockStatus.text}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>₹{item.selling_price.toFixed(2)}</TableCell>
                          <TableCell>₹{item.mrp.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <OpticalItemForm itemData={item} mode="edit">
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </OpticalItemForm>
                              <DeleteConfirmDialog
                                title="Delete Item"
                                description={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
                                onConfirm={() => console.log("Delete:", item.id)}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DeleteConfirmDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Movements</CardTitle>
                  <CardDescription>
                    Complete history of all inventory transactions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search movements..."
                      className="pl-8 w-[200px]"
                      value={movementsSearchTerm}
                      onChange={(e) => setMovementsSearchTerm(e.target.value)}
                    />
                  </div>
                  <ViewOptions
                    config={movementsViewConfig}
                    currentView={movementsCurrentView}
                    appliedFilters={movementsAppliedFilters}
                    currentSort={movementsCurrentSort}
                    sortDirection={movementsSortDirection}
                    onViewChange={setMovementsCurrentView}
                    onFilterChange={setMovementsAppliedFilters}
                    onSortChange={(sort, direction) => {
                      setMovementsCurrentSort(sort)
                      setMovementsSortDirection(direction)
                    }}
                    onExport={() => console.log("Export movements data")}
                  />
                  <StockMovementForm>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Record Movement
                    </Button>
                  </StockMovementForm>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DATE</TableHead>
                      <TableHead>TYPE</TableHead>
                      <TableHead>ITEM TYPE</TableHead>
                      <TableHead>ITEM NAME</TableHead>
                      <TableHead>QUANTITY</TableHead>
                      <TableHead>UNIT PRICE</TableHead>
                      <TableHead>TOTAL VALUE</TableHead>
                      <TableHead>PARTY</TableHead>
                      <TableHead>REFERENCE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">{movement.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={movementTypeColors[movement.type as keyof typeof movementTypeColors]}
                          >
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{movement.item_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{movement.item_name}</TableCell>
                        <TableCell>
                          <span className={movement.quantity < 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                            {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>₹{movement.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">₹{movement.total.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">
                          {"supplier" in movement && movement.supplier}
                          {"customer" in movement && movement.customer}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{movement.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

