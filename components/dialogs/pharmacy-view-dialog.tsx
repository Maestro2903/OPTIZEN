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
import { PharmacyItem } from "@/lib/services/api"
import { Package, Calendar, AlertTriangle, DollarSign, Building2, Hash, FileText, Pill } from "lucide-react"

interface PharmacyViewDialogProps {
  item: PharmacyItem
  children: React.ReactNode
}

export function PharmacyViewDialog({ item, children }: PharmacyViewDialogProps) {
  const isLowStock = item.stock_quantity <= item.reorder_level
  const isExpiringSoon = item.expiry_date && 
    new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item.name}
          </DialogTitle>
          <DialogDescription>
            Complete information about this pharmacy item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Section */}
          {(isLowStock || isExpiringSoon) && (
            <div className="space-y-2">
              {isLowStock && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Low Stock Alert</p>
                    <p className="text-xs text-red-700">
                      Current stock ({item.stock_quantity}) is at or below reorder level ({item.reorder_level})
                    </p>
                  </div>
                </div>
              )}
              {isExpiringSoon && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Expiring Soon</p>
                    <p className="text-xs text-yellow-700">
                      Expires on {new Date(item.expiry_date!).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Medicine Name</p>
                <p className="text-sm font-medium">{item.name}</p>
              </div>
              {item.generic_name && (
                <div>
                  <p className="text-xs text-muted-foreground">Generic Name</p>
                  <p className="text-sm font-medium">{item.generic_name}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {item.category}
                </Badge>
              </div>
              {item.dosage_form && (
                <div>
                  <p className="text-xs text-muted-foreground">Dosage Form</p>
                  <p className="text-sm font-medium">{item.dosage_form}</p>
                </div>
              )}
              {item.strength && (
                <div>
                  <p className="text-xs text-muted-foreground">Strength</p>
                  <p className="text-sm font-medium">{item.strength}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Prescription Required</p>
                <Badge variant={item.prescription_required ? "destructive" : "secondary"} className="mt-1">
                  {item.prescription_required ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

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
                <Badge variant={isLowStock ? "destructive" : "secondary"} className="mt-1">
                  {isLowStock ? "Low Stock" : "In Stock"}
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
                <p className="text-xs text-muted-foreground">Unit Price</p>
                <p className="text-sm font-medium">₹{item.unit_price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">MRP</p>
                <p className="text-sm font-medium">₹{item.mrp.toFixed(2)}</p>
              </div>
              {item.gst_percentage !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">GST %</p>
                  <p className="text-sm font-medium">{item.gst_percentage}%</p>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Stock Value (Unit Price)</span>
                <span className="text-lg font-bold">₹{(item.stock_quantity * item.unit_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Total Stock Value (MRP)</span>
                <span className="text-lg font-bold">₹{(item.stock_quantity * item.mrp).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Batch & Supplier Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Batch & Supplier Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {item.batch_number && (
                <div>
                  <p className="text-xs text-muted-foreground">Batch Number</p>
                  <p className="text-sm font-medium">{item.batch_number}</p>
                </div>
              )}
              {item.expiry_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className={`text-sm font-medium ${isExpiringSoon ? 'text-yellow-600' : ''}`}>
                    {new Date(item.expiry_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
              )}
              {item.manufacturer && (
                <div>
                  <p className="text-xs text-muted-foreground">Manufacturer</p>
                  <p className="text-sm font-medium">{item.manufacturer}</p>
                </div>
              )}
              {item.supplier && (
                <div>
                  <p className="text-xs text-muted-foreground">Supplier</p>
                  <p className="text-sm font-medium">{item.supplier}</p>
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

          {/* Storage & Additional Information */}
          {(item.storage_instructions || item.description) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {item.storage_instructions && (
                    <div>
                      <p className="text-xs text-muted-foreground">Storage Instructions</p>
                      <p className="text-sm">{item.storage_instructions}</p>
                    </div>
                  )}
                  {item.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm">{item.description}</p>
                    </div>
                  )}
                </div>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
