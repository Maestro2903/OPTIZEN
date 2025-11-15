"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { patientsApi, casesApi } from "@/lib/services/api"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const invoiceItemSchema = z.object({
  service: z.string().min(1, "Service is required"),
  description: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  rate: z.string().min(1, "Rate is required"),
})

const invoiceFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  case_id: z.string().optional(),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  discount_percent: z.string().optional(),
  tax_percent: z.string().optional(),
  amount_paid: z.string().optional(),
  payment_method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
})

interface InvoiceFormProps {
  children: React.ReactNode
  invoiceData?: any
  mode?: "add" | "edit"
  onSubmit?: (data: any) => void
}

export function InvoiceForm({ children, invoiceData, mode = "add", onSubmit: onSubmitCallback }: InvoiceFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [patients, setPatients] = React.useState<Array<{ value: string; label: string }>>([])
  const [patientCases, setPatientCases] = React.useState<Array<{ value: string; label: string }>>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingCases, setLoadingCases] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      patient_id: "",
      case_id: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [{ service: "", description: "", quantity: "1", rate: "" }],
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

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset()
      setPatients([])
      setPatientCases([])
    }
  }, [open])

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const rate = parseFloat(item.rate) || 0
    return sum + (qty * rate)
  }, 0)

  const discountAmount = (subtotal * parseFloat(discountPercent)) / 100
  const afterDiscount = subtotal - discountAmount
  const taxAmount = (afterDiscount * parseFloat(taxPercent)) / 100
  const totalAmount = afterDiscount + taxAmount

  const onSubmit = async (values: z.infer<typeof invoiceFormSchema>) => {
    setSubmitting(true)
    try {
      const invoiceData = {
        patient_id: values.patient_id,
        case_id: values.case_id || undefined,
        invoice_date: values.invoice_date,
        due_date: values.due_date,
        subtotal: subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: parseFloat(values.amount_paid || "0"),
        payment_method: values.payment_method,
        notes: values.notes,
        items: values.items.map(item => ({
          service: item.service,
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate),
        })),
      }

      if (onSubmitCallback) {
        await onSubmitCallback(invoiceData)
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update invoice details" : "Fill in the details to create a new invoice"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient and Case Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
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

              <FormField
                control={form.control}
                name="case_id"
                render={({ field }) => (
                  <FormItem>
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
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Invoice Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ service: "", description: "", quantity: "1", rate: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Service</TableHead>
                      <TableHead className="w-[250px]">Description</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[120px]">Rate</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const qty = parseFloat(form.watch(`items.${index}.quantity`)) || 0
                      const rate = parseFloat(form.watch(`items.${index}.rate`)) || 0
                      const amount = qty * rate

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.service`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Service name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Description" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" min="1" step="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.rate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">₹{amount.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Calculations */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="discount_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="text-red-600">-₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({taxPercent}%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount_paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : mode === "edit" ? "Update Invoice" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
