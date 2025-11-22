"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { useMasterData } from "@/hooks/use-master-data"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const financeInvoiceSchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  revenue_type: z.string().min(1, "Revenue type is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  payment_status: z.string().min(1, "Payment status is required"),
  paid_amount: z.string().optional(),
  patient_id: z.string().optional(),
  patient_name: z.string().optional(),
  invoice_reference: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
})

interface FinanceInvoiceDialogProps {
  children: React.ReactNode
  revenueData?: any
  mode?: "add" | "edit"
  onSubmit?: (data: any) => void
}

interface PatientOption {
  value: string
  label: string
}

export function FinanceInvoiceDialog({ 
  children, 
  revenueData, 
  mode = "add", 
  onSubmit: onSubmitCallback 
}: FinanceInvoiceDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [patients, setPatients] = React.useState<PatientOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const masterData = useMasterData()

  const form = useForm<z.infer<typeof financeInvoiceSchema>>({
    resolver: zodResolver(financeInvoiceSchema),
    defaultValues: {
      entry_date: new Date().toISOString().split("T")[0],
      revenue_type: "consultation",
      description: "",
      amount: "",
      payment_method: "cash",
      payment_status: "received",
      paid_amount: "",
      patient_id: "",
      patient_name: "",
      invoice_reference: "",
      category: "",
      notes: "",
    },
  })

  // Populate form when revenueData is provided (edit mode)
  React.useEffect(() => {
    if (open && revenueData && mode === "edit") {
      form.reset({
        entry_date: revenueData.entry_date 
          ? new Date(revenueData.entry_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        revenue_type: revenueData.revenue_type || "consultation",
        description: revenueData.description || "",
        amount: (revenueData.amount || 0).toString(),
        payment_method: revenueData.payment_method || "cash",
        payment_status: revenueData.payment_status || "received",
        paid_amount: (revenueData.paid_amount || 0).toString(),
        patient_id: revenueData.patient_id || "",
        patient_name: revenueData.patient_name || "",
        invoice_reference: revenueData.invoice_reference || "",
        category: revenueData.category || "",
        notes: revenueData.notes || "",
      })
    }
  }, [open, revenueData, mode, form])

  // Load patients and master data
  React.useEffect(() => {
    if (open) {
      loadPatients()
      masterData.fetchMultiple(['revenueTypes', 'paymentMethods', 'paymentStatuses'])
    }
  }, [open])

  const loadPatients = async () => {
    setLoadingPatients(true)
    try {
      const response = await patientsApi.list({ limit: 1000, status: 'active' })
      if (response.success && response.data) {
        const patientOptions: PatientOption[] = response.data.map((patient: any) => ({
          value: patient.id,
          label: `${patient.full_name} (${patient.patient_id || 'N/A'})`
        }))
        setPatients(patientOptions)
      }
    } catch (error) {
      console.error("Error loading patients:", error)
    } finally {
      setLoadingPatients(false)
    }
  }

  // Watch payment status and amount to auto-calculate paid_amount
  const paymentStatus = form.watch("payment_status")
  const amount = form.watch("amount")

  React.useEffect(() => {
    if (paymentStatus === "received" && amount) {
      form.setValue("paid_amount", amount)
    } else if (paymentStatus === "pending") {
      form.setValue("paid_amount", "0")
    }
  }, [paymentStatus, amount, form])

  const onSubmit = async (values: z.infer<typeof financeInvoiceSchema>) => {
    try {
      // Convert string amounts to numbers
      const submitData = {
        ...values,
        amount: parseFloat(values.amount),
        paid_amount: values.paid_amount ? parseFloat(values.paid_amount) : 0,
      }

      // Get patient name if patient_id is provided
      if (submitData.patient_id && !submitData.patient_name) {
        const selectedPatient = patients.find(p => p.value === submitData.patient_id)
        if (selectedPatient) {
          submitData.patient_name = selectedPatient.label.split(' (')[0]
        }
      }

      if (onSubmitCallback) {
        await onSubmitCallback(submitData)
        setOpen(false)
        form.reset()
        // Reset form to default values
        if (mode === "edit") {
          // Form will be reset by parent component
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Failed to save revenue entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && mode === "edit") {
      // When edit dialog closes, reset form
      form.reset()
    }
  }

  // Reset form when dialog closes in add mode
  React.useEffect(() => {
    if (!open && mode === "add") {
      form.reset({
        entry_date: new Date().toISOString().split("T")[0],
        revenue_type: "consultation",
        description: "",
        amount: "",
        payment_method: "cash",
        payment_status: "received",
        paid_amount: "",
        patient_id: "",
        patient_name: "",
        invoice_reference: "",
        category: "",
        notes: "",
      })
    }
  }, [open, mode, form])

  // Auto-open dialog when revenueData is provided in edit mode
  React.useEffect(() => {
    if (revenueData && mode === "edit") {
      setOpen(true)
    } else if (!revenueData && mode === "edit") {
      setOpen(false)
    }
  }, [revenueData, mode])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {mode === "add" && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Revenue Entry" : "Edit Revenue Entry"}</DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Record a new revenue entry for financial tracking" 
              : "Update revenue entry details"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Date and Revenue Type */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entry_date"
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

              <FormField
                control={form.control}
                name="revenue_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue Type *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={masterData.data.revenueTypes || []}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select revenue type"
                        searchPlaceholder="Search revenue types..."
                        emptyText="No revenue types found."
                        loading={masterData.loading.revenueTypes}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Eye consultation for patient" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount and Payment Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={masterData.data.paymentStatuses || []}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select payment status"
                        searchPlaceholder="Search statuses..."
                        emptyText="No payment statuses found."
                        loading={masterData.loading.paymentStatuses}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Method and Paid Amount */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={masterData.data.paymentMethods || []}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select payment method"
                        searchPlaceholder="Search methods..."
                        emptyText="No payment methods found."
                        loading={masterData.loading.paymentMethods}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentStatus === "partial" && (
                <FormField
                  control={form.control}
                  name="paid_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Patient (Optional) */}
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient (Optional)</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={patients}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search patient..."
                      emptyText="No patients found"
                      disabled={loadingPatients}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Invoice Reference and Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Reference (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-001" {...field} />
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
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Sub-category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : mode === "add" ? "Add Revenue" : "Update Revenue"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
