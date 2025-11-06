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
import { PharmacyItemForm } from "@/components/pharmacy-item-form"
import { OpticalItemForm } from "@/components/optical-item-form"
import { StockMovementForm } from "@/components/stock-movement-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

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
    const price = "mrp" in item ? item.mrp : item.mrp
    return sum + (price * item.stock_quantity)
  }, 0)

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
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
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
                    {pharmacyItems.map((item) => {
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
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
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
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
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
                    {opticalItems.map((item) => {
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
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
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
                    {stockMovements.map((movement) => (
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

