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

const pharmacyItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  generic_name: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  unit_price: z.string().min(1, "Unit price is required"),
  mrp: z.string().min(1, "MRP is required"),
  stock_quantity: z.string().min(1, "Stock quantity is required"),
  reorder_level: z.string().min(1, "Reorder level is required"),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  hsn_code: z.string().optional(),
  gst_percentage: z.string().optional(),
  prescription_required: z.boolean(),
  dosage_form: z.string().optional(),
  strength: z.string().optional(),
  storage_instructions: z.string().optional(),
  description: z.string().optional(),
})

interface PharmacyItemFormProps {
  children: React.ReactNode
  itemData?: any
  mode?: "create" | "edit"
  onSubmit?: (data: any) => Promise<void>
}

export function PharmacyItemForm({ children, itemData, mode = "create", onSubmit: onSubmitProp }: PharmacyItemFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [categories, setCategories] = React.useState<SearchableSelectOption[]>([])
  const [loadingCategories, setLoadingCategories] = React.useState(false)

  const form = useForm<z.infer<typeof pharmacyItemSchema>>({
    resolver: zodResolver(pharmacyItemSchema),
    defaultValues: {
      name: itemData?.name || "",
      generic_name: itemData?.generic_name || "",
      category: itemData?.category || "",
      manufacturer: itemData?.manufacturer || "",
      supplier: itemData?.supplier || "",
      unit_price: itemData?.unit_price?.toString() || "",
      mrp: itemData?.mrp?.toString() || "",
      stock_quantity: itemData?.stock_quantity?.toString() || "0",
      reorder_level: itemData?.reorder_level?.toString() || "10",
      batch_number: itemData?.batch_number || "",
      expiry_date: itemData?.expiry_date || "",
      hsn_code: itemData?.hsn_code || "",
      gst_percentage: itemData?.gst_percentage?.toString() || "12",
      prescription_required: itemData?.prescription_required || false,
      dosage_form: itemData?.dosage_form || "",
      strength: itemData?.strength || "",
      storage_instructions: itemData?.storage_instructions || "",
      description: itemData?.description || "",
    },
  })

  // Load categories from master data
  React.useEffect(() => {
    const loadCategories = async () => {
      if (!isOpen) return
      setLoadingCategories(true)
      try {
        const response = await masterDataApi.list({ category: 'medicine_categories', limit: 100 })
        if (response.success && response.data && response.data.length > 0) {
          setCategories(
            response.data.map((item) => ({
              value: item.name,
              label: item.name,
            }))
          )
        } else {
          // Fallback to default categories if not in master data
          setCategories([
            { value: "Analgesics", label: "Analgesics" },
            { value: "Antibiotics", label: "Antibiotics" },
            { value: "Eye Drops", label: "Eye Drops" },
            { value: "Eye Ointments", label: "Eye Ointments" },
            { value: "Antiseptics", label: "Antiseptics" },
            { value: "Vitamins", label: "Vitamins" },
            { value: "Anti-inflammatory", label: "Anti-inflammatory" },
            { value: "Other", label: "Other" },
          ])
        }
      } catch (error) {
        console.error("Error loading categories:", error)
        // Use fallback
        setCategories([
          { value: "Analgesics", label: "Analgesics" },
          { value: "Antibiotics", label: "Antibiotics" },
          { value: "Eye Drops", label: "Eye Drops" },
          { value: "Eye Ointments", label: "Eye Ointments" },
          { value: "Other", label: "Other" },
        ])
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [isOpen])

  async function onSubmit(values: z.infer<typeof pharmacyItemSchema>) {
    try {
      if (onSubmitProp) {
        await onSubmitProp(values)
      }
      setIsOpen(false)
      form.reset()
      toast({
        title: "Success",
        description: mode === "edit" ? "Medicine updated successfully." : "Medicine added successfully."
      })
    } catch (error) {
      console.error("Error submitting pharmacy item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save medicine. Please try again."
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Medicine" : "Add New Medicine"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update medicine information" : "Add a new medicine to pharmacy inventory"}
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
                    <FormLabel>Medicine Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Paracetamol" {...field} />
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
              <FormField
                control={form.control}
                name="dosage_form"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage Form</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tablet">Tablet</SelectItem>
                        <SelectItem value="Capsule">Capsule</SelectItem>
                        <SelectItem value="Drops">Drops</SelectItem>
                        <SelectItem value="Ointment">Ointment</SelectItem>
                        <SelectItem value="Syrup">Syrup</SelectItem>
                        <SelectItem value="Injection">Injection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strength</FormLabel>
                    <FormControl>
                      <Input placeholder="500mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Pharma Ltd." {...field} />
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
                      <Input placeholder="XYZ Distributors" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (₹) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="50.00" {...field} />
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
                      <Input type="number" step="0.01" placeholder="60.00" {...field} />
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
                      <Input type="number" step="0.01" placeholder="12" {...field} />
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
                      <Input type="number" placeholder="100" {...field} />
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
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="BT12345" {...field} />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN Code</FormLabel>
                    <FormControl>
                      <Input placeholder="30049099" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prescription_required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 pt-8">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Prescription Required</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storage_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Instructions</FormLabel>
                  <FormControl>
                    <Input placeholder="Store in a cool, dry place" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit">{mode === "edit" ? "Update Medicine" : "Add Medicine"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

