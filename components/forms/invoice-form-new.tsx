"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, Package, Eye as EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi, casesApi, pharmacyApi, opticalPlanApi } from "@/lib/services/api"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Helper function to calculate invoice totals
function calculateInvoiceTotals(
  items: Array<{ quantity: string; rate: string }>,
  discountPercent: string = "0",
  taxPercent: string = "0"
) {
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + (qty * rate);
  }, 0);

  const discountAmount = (subtotal * parseFloat(discountPercent || "0")) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * parseFloat(taxPercent || "0")) / 100;
  const totalAmount = afterDiscount + taxAmount;

  return {
    subtotal,
    discountAmount,
    afterDiscount,
    taxAmount,
    totalAmount
  };
}

const invoiceItemSchema = z.object({
  service: z.string().min(1, "Service/Item is required"),
  description: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  rate: z.string().min(1, "Rate is required"),
  // Inventory item fields (optional)
  item_type: z.enum(['pharmacy', 'optical', 'service']).optional(),
  item_id: z.string().optional(),
  item_sku: z.string().optional(),
})

const invoiceFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  case_id: z.string().optional(),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["Draft", "Paid", "Pending"]),
  billing_type: z.enum(["consultation_operation", "medical", "optical"]).optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  discount_percent: z.string().optional(),
  tax_percent: z.string().optional(),
  amount_paid: z.string().optional(),
  payment_method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const { totalAmount } = calculateInvoiceTotals(
      data.items,
      data.discount_percent || "0",
      data.tax_percent || "0"
    );
    const amountPaid = parseFloat(data.amount_paid || "0");

    // Financial precision epsilon for comparison
    const epsilon = 0.001; // More precise value suitable for financial precision

    if (data.status === "Paid") {
      return Math.abs(amountPaid - totalAmount) <= epsilon;
    }
    return true;
  },
  {
    message: "Amount paid must match total when status is Paid",
    path: ["amount_paid"],
  }
).refine(
  (data) => {
    const { totalAmount } = calculateInvoiceTotals(
      data.items,
      data.discount_percent || "0",
      data.tax_percent || "0"
    );
    const amountPaid = parseFloat(data.amount_paid || "0");

    return amountPaid <= totalAmount;
  },
  {
    message: "Amount paid cannot exceed total amount",
    path: ["amount_paid"],
  }
).refine(
  (data) => {
    const amountPaid = parseFloat(data.amount_paid || "0");

    return amountPaid >= 0;
  },
  {
    message: "Amount paid cannot be negative",
    path: ["amount_paid"],
  }
);

interface InvoiceFormProps {
  children: React.ReactNode
  invoiceData?: any
  mode?: "add" | "edit"
  onFormSubmitAction?: (data: any) => void
  defaultBillingType?: "consultation_operation" | "medical" | "optical"
}

export function InvoiceForm({ children, invoiceData, mode = "add", onFormSubmitAction: onSubmitCallback, defaultBillingType }: InvoiceFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [patients, setPatients] = React.useState<Array<{ value: string; label: string }>>([])
  const [patientCases, setPatientCases] = React.useState<Array<{ value: string; label: string }>>([])
  const [pharmacyItems, setPharmacyItems] = React.useState<SearchableSelectOption[]>([])
  const [opticalItems, setOpticalItems] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingCases, setLoadingCases] = React.useState(false)
  const [loadingInventory, setLoadingInventory] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      patient_id: "",
      case_id: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Draft",
      billing_type: defaultBillingType || (invoiceData?.billing_type || "consultation_operation"),
      items: [{ service: "", description: "", quantity: "1", rate: "", item_type: undefined, item_id: undefined, item_sku: undefined }],
      discount_percent: "0",
      tax_percent: "0",
      amount_paid: "0",
      payment_method: "Cash",
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Watch form values for calculations
  const items = form.watch("items")
  const discountPercent = form.watch("discount_percent") || "0"
  const taxPercent = form.watch("tax_percent") || "0"
  const selectedPatientId = form.watch("patient_id")
  const status = form.watch("status")

  // Ref to track previous status for detecting transitions
  const prevStatusRef = React.useRef<"Draft" | "Paid" | "Pending" | undefined>(undefined);
  React.useEffect(() => {
    prevStatusRef.current = status;
  }, [status]);

  // Calculate totals using helper function
  const { subtotal, discountAmount, afterDiscount, taxAmount, totalAmount } = React.useMemo(() => {
    return calculateInvoiceTotals(
      items,
      discountPercent,
      taxPercent
    );
  }, [items, discountPercent, taxPercent]);

  // Load patients only when dialog opens
  React.useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoadingPatients(true)

    patientsApi.list({ limit: 1000, status: 'active' })
      .then(response => {
        if (cancelled) return
        if (response.success && response.data) {
          setPatients(
            response.data.map(patient => ({
              value: patient.id,
              label: `${patient.patient_id} - ${patient.full_name}`,
            }))
          )
        }
      })
      .catch(error => {
        if (cancelled) return
        console.error("Error loading patients:", error)
        toast({
          title: "Failed to load patients",
          description: "Please try again",
          variant: "destructive",
        })
      })
      .finally(() => {
        if (!cancelled) setLoadingPatients(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, toast])

  // Load inventory items when dialog opens
  React.useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoadingInventory(true)

    Promise.all([
      pharmacyApi.list({ limit: 1000 }),
      opticalPlanApi.list({ limit: 1000 })
    ])
      .then(([pharmacyResponse, opticalResponse]) => {
        if (cancelled) return

        if (pharmacyResponse.success && pharmacyResponse.data) {
          setPharmacyItems(
            pharmacyResponse.data.map(item => ({
              value: item.id,
              label: `${item.name} (Stock: ${item.stock_quantity}) - ₹${item.mrp.toFixed(2)}`,
              data: item
            }))
          )
        }

        if (opticalResponse.success && opticalResponse.data) {
          setOpticalItems(
            opticalResponse.data.map(item => ({
              value: item.id,
              label: `${item.name} (Stock: ${item.stock_quantity}) - ₹${item.mrp.toFixed(2)}`,
              data: item
            }))
          )
        }
      })
      .catch(error => {
        if (cancelled) return
        console.error("Error loading inventory items:", error)
      })
      .finally(() => {
        if (!cancelled) setLoadingInventory(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  // Load cases when patient is selected
  React.useEffect(() => {
    if (!selectedPatientId) {
      setPatientCases([])
      return
    }

    let cancelled = false
    setLoadingCases(true)

    casesApi.list({ patient_id: selectedPatientId })
      .then(response => {
        if (cancelled) return
        if (response.success && response.data && response.data.length > 0) {
          const safeCases = response.data
            .filter(caseItem => caseItem?.id && caseItem?.case_no)
            .map(caseItem => ({
              value: caseItem.id,
              label: `${caseItem.case_no} - ${caseItem.diagnosis || 'No diagnosis'}`,
            }))
          setPatientCases(safeCases)
        } else {
          setPatientCases([])
        }
      })
      .catch(error => {
        if (cancelled) return
        console.error("Error loading cases:", error)
        setPatientCases([])
      })
      .finally(() => {
        if (!cancelled) setLoadingCases(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedPatientId])

  // Auto-update amount_paid when status transitions to "Paid" and amount_paid is empty or zero
  React.useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const currentAmountPaid = parseFloat(form.getValues("amount_paid") || "0");

    // Only auto-fill when status changes to "Paid" and amount_paid is empty or zero
    if (status === "Paid" && prevStatus !== "Paid" && (isNaN(currentAmountPaid) || currentAmountPaid === 0)) {
      form.setValue("amount_paid", totalAmount.toString());
    }
  }, [status, form, totalAmount]); // Include totalAmount in dependencies to use latest value when status changes to "Paid"

  // Populate form when invoiceData is provided (edit mode)
  React.useEffect(() => {
    if (open && invoiceData && mode === "edit") {
      // Map invoice data to form structure
      const items = invoiceData.items || []
      const formItems = items.length > 0 
        ? items.map((item: any) => ({
            service: item.service || item.item_description || "",
            description: item.description || "",
            quantity: (item.quantity || 1).toString(),
            rate: (item.rate || item.unit_price || 0).toString(),
          }))
        : [{ service: "", description: "", quantity: "1", rate: "" }]

      // Calculate discount and tax percentages
      const subtotal = invoiceData.subtotal || 0
      const discountAmount = invoiceData.discount_amount || 0
      const taxAmount = invoiceData.tax_amount || 0
      
      const discountPercent = subtotal > 0 
        ? ((discountAmount / subtotal) * 100).toFixed(2)
        : "0"
      
      const afterDiscount = subtotal - discountAmount
      const taxPercent = afterDiscount > 0
        ? ((taxAmount / afterDiscount) * 100).toFixed(2)
        : "0"

      // Map API status to form status
      const statusMapping: Record<string, "Draft" | "Paid" | "Pending"> = {
        'draft': 'Draft',
        'paid': 'Paid',
        'sent': 'Pending',
        'overdue': 'Pending',
        'cancelled': 'Draft'
      }
      const formStatus = invoiceData.status 
        ? (statusMapping[invoiceData.status.toLowerCase()] || 'Draft')
        : "Draft"

      form.reset({
        patient_id: invoiceData.patient_id || "",
        case_id: invoiceData.case_id || "",
        invoice_date: invoiceData.invoice_date 
          ? new Date(invoiceData.invoice_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        due_date: invoiceData.due_date
          ? new Date(invoiceData.due_date).toISOString().split("T")[0]
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: formStatus,
        billing_type: invoiceData.billing_type || defaultBillingType || "consultation_operation",
        items: formItems,
        discount_percent: discountPercent,
        tax_percent: taxPercent,
        amount_paid: (invoiceData.amount_paid || 0).toString(),
        payment_method: invoiceData.payment_method || "Cash",
        notes: invoiceData.notes || "",
      })
    }
  }, [open, invoiceData, mode, form])

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset()
      setPatients([])
      setPatientCases([])
    }
  }, [open, form])

  const onSubmit = async (values: z.infer<typeof invoiceFormSchema>) => {
    setSubmitting(true)
    try {
      // Calculate final values to ensure consistency
      const calculatedAmountPaid = parseFloat(values.amount_paid || "0");

      const invoiceData = {
        patient_id: values.patient_id,
        case_id: values.case_id || undefined,
        invoice_date: values.invoice_date,
        due_date: values.due_date,
        status: values.status,
        billing_type: values.billing_type || defaultBillingType || "consultation_operation",
        subtotal: subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: calculatedAmountPaid,
        payment_method: values.payment_method,
        notes: values.notes,
        items: values.items.map(item => ({
          service: item.service,
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate),
          // Include inventory item fields if present
          item_type: item.item_type,
          item_id: item.item_id,
          item_sku: item.item_sku,
        })),
      }

      if (onSubmitCallback) {
        await onSubmitCallback(invoiceData)
      }

      toast({
        title: "Success",
        description: mode === "edit" ? "Invoice updated successfully" : "Invoice created successfully",
      })

      setOpen(false)
      form.reset()
    } catch (error: any) {
      console.error("Error submitting invoice:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to create invoice",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{mode === "edit" ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update invoice details" : "Fill in the details to create a new invoice"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
              {/* Section 1: Invoice Meta-Data */}
              <div className="grid grid-cols-12 gap-5 p-1">
                {/* Patient */}
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel>Patient *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={patients}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={loadingPatients ? "Loading patients..." : "Select patient"}
                          searchPlaceholder="Search patients..."
                          disabled={loadingPatients}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Case */}
                <FormField
                  control={form.control}
                  name="case_id"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel>Case (Optional)</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={patientCases}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder={loadingCases ? "Loading cases..." : "Select case"}
                          searchPlaceholder="Search cases..."
                          disabled={!selectedPatientId || loadingCases}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invoice Date */}
                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Invoice Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Status</FormLabel>
                      <Combobox value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <ComboboxTrigger>
                            <ComboboxValue placeholder="Select status" />
                          </ComboboxTrigger>
                        </FormControl>
                        <ComboboxContent>
                          <ComboboxItem value="Draft">Draft</ComboboxItem>
                          <ComboboxItem value="Paid">Paid</ComboboxItem>
                          <ComboboxItem value="Pending">Pending</ComboboxItem>
                        </ComboboxContent>
                      </Combobox>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Billing Type */}
                <FormField
                  control={form.control}
                  name="billing_type"
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Billing Type</FormLabel>
                      <Combobox value={field.value || defaultBillingType || "consultation_operation"} onValueChange={field.onChange}>
                        <FormControl>
                          <ComboboxTrigger>
                            <ComboboxValue placeholder="Select billing type" />
                          </ComboboxTrigger>
                        </FormControl>
                        <ComboboxContent>
                          <ComboboxItem value="consultation_operation">Consultation & Operation</ComboboxItem>
                          <ComboboxItem value="medical">Medical</ComboboxItem>
                          <ComboboxItem value="optical">Optical</ComboboxItem>
                        </ComboboxContent>
                      </Combobox>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: Line Items (Spreadsheet Look) */}
              <div className="space-y-0">
                {/* Header Row */}
                <div className="bg-gray-50 border-y border-gray-200 py-2 px-4 flex gap-4 text-xs font-bold text-gray-500 uppercase">
                  <div className="flex-1">Item</div>
                  <div className="w-20 text-right">Qty</div>
                  <div className="w-32 text-right">Rate</div>
                  <div className="w-32 text-right">Amount</div>
                  <div className="w-10"></div>
                </div>

                {/* Item Rows */}
                {fields.map((field, index) => {
                  const qty = parseFloat(form.watch(`items.${index}.quantity`)) || 0
                  const rate = parseFloat(form.watch(`items.${index}.rate`)) || 0
                  const amount = qty * rate
                  const itemType = form.watch(`items.${index}.item_type`)
                  const itemId = form.watch(`items.${index}.item_id`)
                  
                  // Get selected item details
                  const selectedPharmacyItem = itemType === 'pharmacy' && itemId
                    ? pharmacyItems.find(i => i.value === itemId)?.data
                    : null
                  const selectedOpticalItem = itemType === 'optical' && itemId
                    ? opticalItems.find(i => i.value === itemId)?.data
                    : null
                  const selectedItem = selectedPharmacyItem || selectedOpticalItem
                  const availableStock = selectedItem?.stock_quantity || 0
                  const isLowStock = selectedItem && availableStock <= (selectedItem.reorder_level || 0)

                  return (
                    <div key={field.id} className="border-b border-gray-100 flex gap-4 items-center px-4 hover:bg-gray-50/50">
                      <div className="flex-1 py-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.item_type`}
                            render={({ field: typeField }) => (
                              <FormItem className="w-24">
                                <FormControl>
                                  <Combobox
                                    value={typeField.value || 'service'}
                                    onValueChange={(value) => {
                                      typeField.onChange(value === 'service' ? undefined : value)
                                      // Reset item selection when type changes
                                      form.setValue(`items.${index}.item_id`, undefined)
                                      form.setValue(`items.${index}.item_sku`, undefined)
                                      form.setValue(`items.${index}.service`, '')
                                      form.setValue(`items.${index}.rate`, '')
                                    }}
                                  >
                                    <ComboboxTrigger className="h-8 text-xs">
                                      <ComboboxValue />
                                    </ComboboxTrigger>
                                    <ComboboxContent>
                                      <ComboboxItem value="service">Service</ComboboxItem>
                                      <ComboboxItem value="pharmacy">Pharmacy</ComboboxItem>
                                      <ComboboxItem value="optical">Optical</ComboboxItem>
                                    </ComboboxContent>
                                  </Combobox>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          {itemType && itemType !== 'service' ? (
                            <FormField
                              control={form.control}
                              name={`items.${index}.item_id`}
                              render={({ field: itemField }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <SearchableSelect
                                      options={itemType === 'pharmacy' ? pharmacyItems : opticalItems}
                                      value={itemField.value || ''}
                                      onValueChange={(value) => {
                                        itemField.onChange(value)
                                        const selected = (itemType === 'pharmacy' ? pharmacyItems : opticalItems)
                                          .find(i => i.value === value)
                                        if (selected?.data) {
                                          form.setValue(`items.${index}.service`, selected.data.name)
                                          form.setValue(`items.${index}.item_sku`, selected.data.sku || selected.data.batch_number || undefined)
                                          // Auto-populate rate from selling_price or mrp
                                          const price = selected.data.selling_price || selected.data.mrp || selected.data.unit_price || 0
                                          form.setValue(`items.${index}.rate`, price.toString())
                                        }
                                      }}
                                      placeholder={loadingInventory ? "Loading..." : `Search ${itemType} items...`}
                                      searchPlaceholder={`Search ${itemType} items...`}
                                      disabled={loadingInventory}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          ) : (
                            <FormField
                              control={form.control}
                              name={`items.${index}.service`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder="Service name"
                                      className="border-transparent focus:border-indigo-500 focus:ring-0 bg-transparent h-8 text-sm px-0"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        {selectedItem && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant={isLowStock ? "destructive" : "secondary"} className="text-xs">
                              Stock: {availableStock}
                            </Badge>
                            {itemType === 'pharmacy' && selectedPharmacyItem?.batch_number && (
                              <span className="text-gray-500">Batch: {selectedPharmacyItem.batch_number}</span>
                            )}
                            {itemType === 'optical' && selectedOpticalItem?.sku && (
                              <span className="text-gray-500">SKU: {selectedOpticalItem.sku}</span>
                            )}
                            {qty > availableStock && (
                              <Badge variant="destructive" className="text-xs">
                                Insufficient Stock
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="w-20 py-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  className="border-transparent focus:border-indigo-500 focus:ring-0 bg-transparent h-10 text-sm text-right font-mono"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="w-32 py-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="border-transparent focus:border-indigo-500 focus:ring-0 bg-transparent h-10 text-sm text-right font-mono"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="w-32 py-2">
                        <Input
                          readOnly
                          value={`₹${amount.toFixed(2)}`}
                          className="bg-gray-50 text-gray-700 text-right pr-4 border-transparent focus:ring-0 h-10 text-sm font-mono"
                        />
                      </div>
                      <div className="w-10 py-2 flex items-center justify-center">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-gray-400 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Add Item Button */}
                <button
                  type="button"
                  onClick={() => append({ service: "", description: "", quantity: "1", rate: "" })}
                  className="text-indigo-600 font-bold text-xs hover:bg-indigo-50 px-4 py-2 rounded inline-flex items-center gap-2 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {/* Section 3: Footer Balance (Split Layout) */}
              <div className="grid grid-cols-3 gap-6 pt-4">
                {/* Left Column: Notes & Terms */}
                <div className="col-span-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes..."
                            rows={4}
                            className="w-full border-gray-200 rounded-lg text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Combobox value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <ComboboxTrigger>
                              <ComboboxValue placeholder="Select payment method" />
                            </ComboboxTrigger>
                          </FormControl>
                          <ComboboxContent>
                            <ComboboxItem value="Cash">Cash</ComboboxItem>
                            <ComboboxItem value="Card">Card</ComboboxItem>
                            <ComboboxItem value="UPI">UPI</ComboboxItem>
                            <ComboboxItem value="Bank Transfer">Bank Transfer</ComboboxItem>
                            <ComboboxItem value="Cheque">Cheque</ComboboxItem>
                          </ComboboxContent>
                        </Combobox>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column: Math Stack */}
                <div className="col-span-1 space-y-3 text-right">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Discount */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Discount</span>
                      <FormField
                        control={form.control}
                        name="discount_percent"
                        render={({ field }) => (
                          <FormItem className="flex-shrink-0">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-16 h-7 text-xs text-right font-mono border-gray-200"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <span className="text-gray-600 text-xs">%</span>
                    </div>
                    <span className="font-mono text-red-600">-₹{discountAmount.toFixed(2)}</span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Tax</span>
                      <FormField
                        control={form.control}
                        name="tax_percent"
                        render={({ field }) => (
                          <FormItem className="flex-shrink-0">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-16 h-7 text-xs text-right font-mono border-gray-200"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <span className="text-gray-600 text-xs">%</span>
                    </div>
                    <span className="font-mono text-green-600">+₹{taxAmount.toFixed(2)}</span>
                  </div>

                  {/* Amount Paid */}
                  <FormField
                    control={form.control}
                    name="amount_paid"
                    render={({ field }) => (
                      <FormItem className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Amount Paid</span>
                        <div className="flex flex-col items-end">
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-24 h-7 text-right font-mono border-gray-200 text-sm"
                              value={field.value ?? "0"}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Total Due or Total Amount */}
                  <div className="border-t border-gray-300 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      {status === "Paid" ? (
                        <span className="text-2xl font-bold text-gray-900">Total Amount</span>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">Total Due</span>
                      )}
                      {status === "Paid" ? (
                        <span className="text-2xl font-bold text-gray-900 font-mono">₹{totalAmount.toFixed(2)}</span>
                      ) : (
                        (() => {
                          const amountPaid = parseFloat(form.watch("amount_paid") || "0");
                          const safeAmountPaid = Math.max(0, amountPaid); // Clamp to 0 if negative
                          const remainingBalance = Math.max(0, totalAmount - safeAmountPaid); // Ensure non-negative balance
                          return (
                            <span className="text-2xl font-bold text-gray-900 font-mono">₹{remainingBalance.toFixed(2)}</span>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <DialogFooter className="px-6 py-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                {submitting ? "Creating..." : mode === "edit" ? "Update Invoice" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
