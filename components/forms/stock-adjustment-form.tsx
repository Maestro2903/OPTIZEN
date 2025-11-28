"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { pharmacyApi, opticalPlanApi, stockMovementsApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

const stockAdjustmentSchema = z.object({
  item_type: z.enum(['pharmacy', 'optical']),
  item_id: z.string().min(1, "Item is required"),
  movement_type: z.enum(['purchase', 'adjustment', 'return', 'expired', 'damaged']),
  movement_date: z.string().min(1, "Date is required"),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "Quantity cannot be zero"
  }),
  unit_price: z.number().min(0).optional(),
  reference_number: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
})

interface StockAdjustmentFormProps {
  children: React.ReactNode
  itemType?: 'pharmacy' | 'optical'
  itemId?: string
  itemName?: string
  currentStock?: number
  onSuccess?: () => void
}

export function StockAdjustmentForm({ 
  children, 
  itemType, 
  itemId, 
  itemName,
  currentStock,
  onSuccess 
}: StockAdjustmentFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [pharmacyItems, setPharmacyItems] = React.useState<SearchableSelectOption[]>([])
  const [opticalItems, setOpticalItems] = React.useState<SearchableSelectOption[]>([])
  const [loadingItems, setLoadingItems] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<any>(null)
  const [previewStock, setPreviewStock] = React.useState<number | null>(null)

  const form = useForm<z.infer<typeof stockAdjustmentSchema>>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      item_type: itemType || 'pharmacy',
      item_id: itemId || '',
      movement_type: 'purchase',
      movement_date: new Date().toISOString().split('T')[0],
      quantity: 0,
      unit_price: undefined,
      reference_number: '',
      supplier: '',
      notes: '',
    },
  })

  const watchedItemType = form.watch('item_type')
  const watchedItemId = form.watch('item_id')
  const watchedQuantity = form.watch('quantity')
  const watchedMovementType = form.watch('movement_type')

  // Load items when dialog opens
  React.useEffect(() => {
    if (!isOpen) return

    const loadItems = async () => {
      setLoadingItems(true)
      try {
        // Load pharmacy items
        const pharmacyResponse = await pharmacyApi.list({ limit: 1000 })
        if (pharmacyResponse.success && pharmacyResponse.data) {
          setPharmacyItems(
            pharmacyResponse.data.map((item) => ({
              value: item.id,
              label: `${item.name} (Stock: ${item.stock_quantity})`,
              data: item
            }))
          )
        }

        // Load optical items
        const opticalResponse = await opticalPlanApi.list({ limit: 1000 })
        if (opticalResponse.success && opticalResponse.data) {
          setOpticalItems(
            opticalResponse.data.map((item) => ({
              value: item.id,
              label: `${item.name} (Stock: ${item.stock_quantity})`,
              data: item
            }))
          )
        }
      } catch (error) {
        console.error('Error loading items:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load items. Please try again."
        })
      } finally {
        setLoadingItems(false)
      }
    }

    loadItems()
  }, [isOpen, toast])

  // Set initial values if provided
  React.useEffect(() => {
    if (itemType) {
      form.setValue('item_type', itemType)
    }
    if (itemId) {
      form.setValue('item_id', itemId)
    }
    if (itemName) {
      // Find and set the item
      const items = itemType === 'pharmacy' ? pharmacyItems : opticalItems
      const found = items.find(i => i.value === itemId)
      if (found) {
        setSelectedItem(found.data)
      }
    }
  }, [itemType, itemId, itemName, pharmacyItems, opticalItems, form])

  // Update selected item when item_id changes
  React.useEffect(() => {
    if (!watchedItemId) {
      setSelectedItem(null)
      setPreviewStock(null)
      return
    }

    const items = watchedItemType === 'pharmacy' ? pharmacyItems : opticalItems
    const found = items.find(i => i.value === watchedItemId)
    if (found && found.data) {
      setSelectedItem(found.data)
      const currentStock = found.data.stock_quantity || 0
      setPreviewStock(currentStock)
    } else {
      setSelectedItem(null)
      setPreviewStock(null)
    }
  }, [watchedItemId, watchedItemType, pharmacyItems, opticalItems])

  // Calculate preview stock
  React.useEffect(() => {
    if (!selectedItem || previewStock === null || !watchedQuantity) {
      return
    }

    const currentStock = selectedItem.stock_quantity || 0
    let newStock = currentStock

    if (watchedMovementType === 'purchase' || watchedMovementType === 'return') {
      newStock = currentStock + watchedQuantity
    } else if (watchedMovementType === 'adjustment') {
      // Adjustment can be positive or negative
      newStock = currentStock + watchedQuantity
    } else if (watchedMovementType === 'expired' || watchedMovementType === 'damaged') {
      newStock = currentStock - Math.abs(watchedQuantity)
    }

    setPreviewStock(newStock)
  }, [watchedQuantity, watchedMovementType, selectedItem, previewStock])

  async function onSubmit(values: z.infer<typeof stockAdjustmentSchema>) {
    try {
      setLoading(true)

      // Get item name
      const items = values.item_type === 'pharmacy' ? pharmacyItems : opticalItems
      const found = items.find(i => i.value === values.item_id)
      const itemName = found?.data?.name || 'Item'

      // Create stock movement
      const response = await stockMovementsApi.create({
        movement_date: values.movement_date,
        movement_type: values.movement_type,
        item_type: values.item_type,
        item_id: values.item_id,
        item_name: itemName,
        quantity: values.quantity,
        unit_price: values.unit_price || null,
        total_value: values.unit_price ? values.unit_price * Math.abs(values.quantity) : null,
        batch_number: null,
        reference_number: values.reference_number || null,
        supplier: values.supplier || null,
        customer_name: null,
        invoice_id: null,
        user_id: null,
        notes: values.notes || null,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Stock adjustment recorded successfully."
        })
        setIsOpen(false)
        form.reset()
        setSelectedItem(null)
        setPreviewStock(null)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(response.error || 'Failed to create stock movement')
      }
    } catch (error: any) {
      console.error('Error creating stock movement:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to record stock adjustment. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  const currentItems = watchedItemType === 'pharmacy' ? pharmacyItems : opticalItems
  const currentStockValue = selectedItem?.stock_quantity || currentStock || 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          <DialogDescription>
            Record a stock movement (purchase, adjustment, return, expired, or damaged items)
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue('item_id', '') // Reset item selection
                        setSelectedItem(null)
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="optical">Optical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={currentItems}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search and select item..."
                        searchPlaceholder="Search items..."
                        loading={loadingItems}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedItem && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Current stock: <strong>{currentStockValue}</strong> units
                  {previewStock !== null && previewStock !== currentStockValue && (
                    <span className="ml-2">
                      → New stock: <strong>{previewStock}</strong> units
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movement Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase (Add Stock)</SelectItem>
                        <SelectItem value="adjustment">Adjustment (+/-)</SelectItem>
                        <SelectItem value="return">Return (Add Stock)</SelectItem>
                        <SelectItem value="expired">Expired (Remove Stock)</SelectItem>
                        <SelectItem value="damaged">Damaged (Remove Stock)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="movement_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity * 
                      {(watchedMovementType === 'purchase' || watchedMovementType === 'return') && ' (Positive)'}
                      {(watchedMovementType === 'expired' || watchedMovementType === 'damaged') && ' (Positive)'}
                      {watchedMovementType === 'adjustment' && ' (+/-)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={
                          watchedMovementType === 'adjustment' 
                            ? "Enter positive or negative number"
                            : "Enter quantity"
                        }
                        {...field}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          field.onChange(val)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(watchedMovementType === 'purchase' || watchedMovementType === 'adjustment') && (
                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || undefined
                            field.onChange(val)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PO-12345, GRN-001, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchedMovementType === 'purchase' && (
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this stock movement..." 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsOpen(false)
                form.reset()
                setSelectedItem(null)
                setPreviewStock(null)
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Record Movement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

