"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { masterDataApi } from "@/lib/services/api"
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
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const opticalItemSchema = z.object({
  item_type: z.enum(['medicine', 'frames', 'lenses', 'accessories', 'equipment', 'consumables']),
  name: z.string().min(2, "Name must be at least 2 characters"),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  sub_category: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  gender: z.string().optional(),
  purchase_price: z.number().min(0, "Purchase price must be non-negative"),
  selling_price: z.number().min(0, "Selling price must be non-negative"),
  mrp: z.number().min(0, "MRP must be non-negative"),
  stock_quantity: z.number().min(0, "Stock quantity must be non-negative"),
  reorder_level: z.number().min(0, "Reorder level must be non-negative"),
  supplier: z.string().optional(),
  image_url: z.string().optional(),
  warranty_months: z.number().optional(),
  hsn_code: z.string().optional(),
  gst_percentage: z.number().optional(),
  description: z.string().optional(),
})

interface OpticalItemFormProps {
  children: React.ReactNode
  itemData?: any
  mode?: "create" | "edit"
  onSubmit?: (data: any) => Promise<void>
}

export function OpticalItemForm({ children, itemData, mode = "create", onSubmit: onSubmitProp }: OpticalItemFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [categories, setCategories] = React.useState<SearchableSelectOption[]>([])
  const [loadingCategories, setLoadingCategories] = React.useState(false)

  const form = useForm<z.infer<typeof opticalItemSchema>>({
    resolver: zodResolver(opticalItemSchema),
    defaultValues: {
      item_type: itemData?.item_type || 'frames',
      name: itemData?.name || "",
      brand: itemData?.brand || "",
      model: itemData?.model || "",
      sku: itemData?.sku || "",
      category: itemData?.category || "",
      sub_category: itemData?.sub_category || "",
      size: itemData?.size || "",
      color: itemData?.color || "",
      material: itemData?.material || "",
      gender: itemData?.gender || "",
      purchase_price: itemData?.purchase_price || 0,
      selling_price: itemData?.selling_price || 0,
      mrp: itemData?.mrp || 0,
      stock_quantity: itemData?.stock_quantity || 0,
      reorder_level: itemData?.reorder_level || 5,
      supplier: itemData?.supplier || "",
      image_url: itemData?.image_url || "",
      warranty_months: itemData?.warranty_months || 0,
      hsn_code: itemData?.hsn_code || "",
      gst_percentage: itemData?.gst_percentage || 18,
      description: itemData?.description || "",
    },
  })

  // Load categories from master data
  React.useEffect(() => {
    const abortController = new AbortController()
    let cancelled = false

    const FALLBACK_CATEGORIES = [
      { value: "Eyeglasses", label: "Eyeglasses" },
      { value: "Contact Lenses", label: "Contact Lenses" },
      { value: "Sunglasses", label: "Sunglasses" },
      { value: "Frames", label: "Frames" },
      { value: "Lenses", label: "Lenses" },
      { value: "Accessories", label: "Accessories" },
      { value: "Other", label: "Other" },
    ]

    const loadCategories = async () => {
      if (!isOpen) return
      setLoadingCategories(true)
      try {
        const response = await masterDataApi.list({ category: 'pharmacy_categories', limit: 100 })
        if (cancelled) return

        if (response.success && response.data && response.data.length > 0) {
          if (!cancelled) {
            setCategories(
              response.data.map((item) => ({
                value: item.name,
                label: item.name,
              }))
            )
          }
        } else {
          if (!cancelled) {
            setCategories(FALLBACK_CATEGORIES)
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Error loading categories:", error)
          setCategories(FALLBACK_CATEGORIES)
          if (error?.name !== 'AbortError') {
            toast({
              title: "Failed to load categories",
              description: "Using default categories. " + (error?.message ?? ""),
              variant: "destructive",
            })
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false)
        }
      }
    }
    
    loadCategories()

    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [isOpen, toast])

  async function onSubmit(values: z.infer<typeof opticalItemSchema>) {
    try {
      if (!onSubmitProp) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No submit handler provided. Please contact support."
        })
        return
      }

      await onSubmitProp(values)
      
      setIsOpen(false)
      form.reset()
      toast({
        title: "Success",
        description: mode === "edit" ? "Optical item updated successfully." : "Optical item added successfully."
      })
    } catch (error) {
      console.error("Error submitting optical item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save optical item. Please try again."
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onCloseButtonClickOnly={true}>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Optical Item" : "Add New Optical Item"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update optical item information" : "Add a new optical item to inventory"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="item_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Type *</FormLabel>
                    <Combobox value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <ComboboxTrigger>
                          <ComboboxValue placeholder="Select type" />
                        </ComboboxTrigger>
                      </FormControl>
                      <ComboboxContent>
                        <ComboboxItem value="frames">Frames</ComboboxItem>
                        <ComboboxItem value="lenses">Lenses</ComboboxItem>
                        <ComboboxItem value="accessories">Accessories</ComboboxItem>
                        <ComboboxItem value="equipment">Equipment</ComboboxItem>
                        <ComboboxItem value="consumables">Consumables</ComboboxItem>
                        <ComboboxItem value="medicine">Medicine</ComboboxItem>
                      </ComboboxContent>
                    </Combobox>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ray-Ban Aviator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="RB-AV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="Ray-Ban" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Aviator Classic" {...field} />
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
                    <FormControl>
                      <SearchableSelect
                        options={categories}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select category"
                        searchPlaceholder="Search categories..."
                        loading={loadingCategories}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="sub_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Frame" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input placeholder="58-14-140" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="Black" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Combobox value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <ComboboxTrigger>
                          <ComboboxValue placeholder="Select" />
                        </ComboboxTrigger>
                      </FormControl>
                      <ComboboxContent>
                        <ComboboxItem value="unisex">Unisex</ComboboxItem>
                        <ComboboxItem value="male">Male</ComboboxItem>
                        <ComboboxItem value="female">Female</ComboboxItem>
                        <ComboboxItem value="kids">Kids</ComboboxItem>
                      </ComboboxContent>
                    </Combobox>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <Input placeholder="Acetate, Metal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Suppliers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="500.00" 
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
                    <FormLabel>Selling Price (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="800.00" 
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
                    <FormLabel>MRP (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="1000.00" 
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
                name="gst_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="18" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50" 
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
                        placeholder="5" 
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
                name="warranty_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty (Months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="12" 
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
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN Code</FormLabel>
                    <FormControl>
                      <Input placeholder="90041000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
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
                    <Textarea placeholder="Additional information..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === "edit" ? "Update Item" : "Add Item"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

