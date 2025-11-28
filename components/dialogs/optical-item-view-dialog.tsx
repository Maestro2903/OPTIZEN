"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { OpticalItem } from "@/lib/services/api"
import { AlertTriangle, DollarSign, Building2, Hash, FileText, Eye, Package, History } from "lucide-react"
import { StockHistoryDialog } from "./stock-history-dialog"

interface OpticalItemViewDialogProps {
  item: OpticalItem
  children: React.ReactNode
}

export function OpticalItemViewDialog({ item, children }: OpticalItemViewDialogProps) {
  const isLowStock = item.stock_quantity <= item.reorder_level
  const isOutOfStock = item.stock_quantity === 0

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {item.name}
          </DialogTitle>
          <DialogDescription>
            Complete information about this optical item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Section */}
          {(isLowStock || isOutOfStock) && (
            <div className="space-y-2">
              {isOutOfStock && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Out of Stock</p>
                    <p className="text-xs text-red-700">
                      Current stock is 0. Please restock immediately.
                    </p>
                  </div>
                </div>
              )}
              {isLowStock && !isOutOfStock && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Low Stock Alert</p>
                    <p className="text-xs text-yellow-700">
                      Current stock ({item.stock_quantity}) is at or below reorder level ({item.reorder_level})
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Item Name</p>
                <p className="text-sm font-medium">{item.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Item Type</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {item.item_type}
                </Badge>
              </div>
              {item.brand && (
                <div>
                  <p className="text-xs text-muted-foreground">Brand</p>
                  <p className="text-sm font-medium">{item.brand}</p>
                </div>
              )}
              {item.model && (
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-sm font-medium">{item.model}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">SKU</p>
                <p className="text-sm font-mono font-medium">{item.sku}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {item.category}
                </Badge>
              </div>
              {item.sub_category && (
                <div>
                  <p className="text-xs text-muted-foreground">Sub Category</p>
                  <p className="text-sm font-medium">{item.sub_category}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Physical Attributes */}
          {(item.size || item.color || item.material || item.gender) && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Physical Attributes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {item.size && (
                    <div>
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="text-sm font-medium">{item.size}</p>
                    </div>
                  )}
                  {item.color && (
                    <div>
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="text-sm font-medium">{item.color}</p>
                    </div>
                  )}
                  {item.material && (
                    <div>
                      <p className="text-xs text-muted-foreground">Material</p>
                      <p className="text-sm font-medium">{item.material}</p>
                    </div>
                  )}
                  {item.gender && (
                    <div>
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {item.gender}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Stock Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Current Stock</p>
                <p className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                  {item.stock_quantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reorder Level</p>
                <p className="text-lg font-bold text-orange-600">{item.reorder_level}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={isOutOfStock ? "destructive" : isLowStock ? "destructive" : "secondary"} className="mt-1">
                  {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Purchase Price</p>
                <p className="text-sm font-medium">₹{item.purchase_price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Selling Price</p>
                <p className="text-sm font-medium">₹{item.selling_price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MRP</p>
                <p className="text-sm font-medium">₹{item.mrp.toFixed(2)}</p>
              </div>
            </div>
            {item.gst_percentage !== undefined && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">GST %</p>
                <p className="text-sm font-medium">{item.gst_percentage}%</p>
              </div>
            )}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Stock Value (Purchase Price)</span>
                <span className="text-lg font-bold">₹{(item.stock_quantity * item.purchase_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Total Stock Value (Selling Price)</span>
                <span className="text-lg font-bold">₹{(item.stock_quantity * item.selling_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Total Potential Revenue (MRP)</span>
                <span className="text-lg font-bold">₹{(item.stock_quantity * item.mrp).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Supplier & Additional Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Supplier & Additional Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {item.supplier && (
                <div>
                  <p className="text-xs text-muted-foreground">Supplier</p>
                  <p className="text-sm font-medium">{item.supplier}</p>
                </div>
              )}
              {item.warranty_months && (
                <div>
                  <p className="text-xs text-muted-foreground">Warranty</p>
                  <p className="text-sm font-medium">{item.warranty_months} months</p>
                </div>
              )}
              {item.hsn_code && (
                <div>
                  <p className="text-xs text-muted-foreground">HSN Code</p>
                  <p className="text-sm font-medium">{item.hsn_code}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <p className="text-sm">{item.description}</p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p>Created: {new Date(item.created_at).toLocaleString('en-GB')}</p>
            </div>
            <div>
              <p>Last Updated: {new Date(item.updated_at).toLocaleString('en-GB')}</p>
            </div>
          </div>

          {/* Stock History Button */}
          <Separator />
          <div className="flex justify-end">
            <StockHistoryDialog
              itemType="optical"
              itemId={item.id}
              itemName={item.name}
            >
              <Button variant="outline" className="gap-2">
                <History className="h-4 w-4" />
                View Stock History
              </Button>
            </StockHistoryDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

