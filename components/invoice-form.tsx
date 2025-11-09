"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi, casesApi } from "@/lib/services/api"
import { useMasterData } from "@/hooks/use-master-data"
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

interface PatientOption {
  value: string
  label: string
}

interface CaseOption {
  value: string
  label: string
}

export function InvoiceForm({ children, invoiceData, mode = "add", onSubmit: onSubmitCallback }: InvoiceFormProps) {
  const { toast } = useToast()
  const masterData = useMasterData()
  const [open, setOpen] = React.useState(false)
  const [patients, setPatients] = React.useState<PatientOption[]>([])
  const [patientCases, setPatientCases] = React.useState<CaseOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingCases, setLoadingCases] = React.useState(false)

  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: invoiceData || {
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

  // Load patients
  React.useEffect(() => {
    const abortController = new AbortController()
    let cancelled = false

    const loadPatients = async () => {
      if (!open) return
      setLoadingPatients(true)
      try {
        const response = await patientsApi.list({ limit: 1000, status: 'active' })
        if (cancelled) return

        if (response.success && response.data) {
          if (!cancelled) {
            setPatients(
              response.data.map((patient) => ({
              value: patient.id,
              label: `${patient.full_name} (${patient.patient_id})`,
            }))
            )
          }
        } else {
          if (!cancelled) {
            toast({
              title: "Failed to load patients",
              description: "Unable to fetch patient list. Please try again.",
              variant: "destructive",
            })
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Error loading patients:", error)
          toast({
            title: "Failed to load patients",
            description: error?.message ?? "An unexpected error occurred",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingPatients(false)
        }
      }
    }
    
    loadPatients()

    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [open, toast])

  // Load payment methods
  React.useEffect(() => {
    if (open) {
      masterData.fetchCategory('paymentMethods')
    }
  }, [open, masterData])

  // Watch patient selection
  const selectedPatientId = form.watch("patient_id")

  // Auto-load cases when patient selected
  React.useEffect(() => {
    const abortController = new AbortController()
    let cancelled = false

    const loadPatientCases = async () => {
      if (!selectedPatientId) {
        setPatientCases([])
        return
      }
      
      setLoadingCases(true)
      try {
        const response = await casesApi.list({ patient_id: selectedPatientId })
        if (cancelled) return

        if (response.success && response.data && response.data.length > 0) {
          const safeCases = response.data
            .filter((caseItem) => caseItem?.id && caseItem?.case_no)
            .map((caseItem) => ({
              value: caseItem.id,
              label: `${caseItem.case_no} - ${caseItem.diagnosis || 'No diagnosis'}`,
            }))
          
          if (!cancelled) {
            setPatientCases(safeCases)
          }
        } else {
          if (!cancelled) {
            setPatientCases([])
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Error loading cases:", error)
          setPatientCases([])
          toast({
            title: "Failed to load cases",
            description: error?.message ?? "An unexpected error occurred",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingCases(false)
        }
      }
    }
    
    if (selectedPatientId) {
      loadPatientCases()
    }

    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [selectedPatientId, toast])

  const watchItems = form.watch("items")
  const watchDiscount = form.watch("discount_percent")
  const watchTax = form.watch("tax_percent")
  const watchAmountPaid = form.watch("amount_paid")

  // Calculate totals
  const subtotal = React.useMemo(() => {
    if (!watchItems || !Array.isArray(watchItems)) return 0
    return watchItems.reduce((sum, item) => {
      const qty = parseFloat(item?.quantity || "0")
      const rate = parseFloat(item?.rate || "0")
      return sum + (qty * rate)
    }, 0)
  }, [watchItems])

  const discount = React.useMemo(() => {
    const discountPercent = parseFloat(watchDiscount || "0")
    return (subtotal * discountPercent) / 100
  }, [subtotal, watchDiscount])

  const tax = React.useMemo(() => {
    const taxPercent = parseFloat(watchTax || "0")
    return ((subtotal - discount) * taxPercent) / 100
  }, [subtotal, discount, watchTax])

  const total = React.useMemo(() => {
    return subtotal - discount + tax
  }, [subtotal, discount, tax])

  const balance = React.useMemo(() => {
    const paid = parseFloat(watchAmountPaid || "0")
    return total - paid
  }, [total, watchAmountPaid])

  function onSubmit(values: z.infer<typeof invoiceFormSchema>) {
    const paidAmount = parseFloat(values.amount_paid || "0")
    const invoiceData = {
      ...values,
      patient_name: values.patient_id,
      items: values.items.map(i => i.description || i.service).join(', '),
      total: `₹${total.toLocaleString()}`,
      paid: `₹${paidAmount.toLocaleString()}`,
      balance: `₹${balance.toLocaleString()}`,
      status: balance === 0 ? "Paid" as const : balance === total ? "Unpaid" as const : "Partial" as const,
    }
    if (onSubmitCallback) {
      onSubmitCallback(invoiceData)
    }
    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update invoice details" : "Generate itemized invoice with payment tracking"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingPatients}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Select patient"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingPatients ? (
                          <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                        ) : patients.length === 0 ? (
                          <SelectItem value="none" disabled>No patients available</SelectItem>
                        ) : (
                          patients.map((patient) => (
                            <SelectItem key={patient.value} value={patient.value}>
                              {patient.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCases || !selectedPatientId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedPatientId 
                              ? "Select a patient first" 
                              : loadingCases 
                              ? "Loading cases..." 
                              : "Select case"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingCases ? (
                          <SelectItem value="loading" disabled>Loading cases...</SelectItem>
                        ) : patientCases.length === 0 ? (
                          <SelectItem value="none" disabled>No cases available</SelectItem>
                        ) : (
                          patientCases.map((caseItem) => (
                            <SelectItem key={caseItem.value} value={caseItem.value}>
                              {caseItem.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {/* Itemized Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Invoice Items *</FormLabel>
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
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Service/Item</TableHead>
                      <TableHead className="w-[250px]">Description</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[120px]">Rate (₹)</TableHead>
                      <TableHead className="w-[120px]">Amount (₹)</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const qty = parseFloat(watchItems[index]?.quantity || "0")
                      const rate = parseFloat(watchItems[index]?.rate || "0")
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
                                    <Input type="number" min="1" {...field} />
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
                                    <Input placeholder="0.00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
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

            {/* Summary Section */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
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
                          searchPlaceholder="Search payment methods..."
                          emptyText="No payment methods found."
                          loading={masterData.loading.paymentMethods}
                        />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>Discount:</span>
                    <FormField
                      control={form.control}
                      name="discount_percent"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          className="w-16 h-7 text-xs"
                          {...field}
                        />
                      )}
                    />
                    <span>%</span>
                  </div>
                  <span className="font-medium text-red-600">-₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span>Tax:</span>
                    <FormField
                      control={form.control}
                      name="tax_percent"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          className="w-16 h-7 text-xs"
                          {...field}
                        />
                      )}
                    />
                    <span>%</span>
                  </div>
                  <span className="font-medium text-green-600">+₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-semibold">
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Amount Paid:</span>
                  <div className="flex items-center gap-1">
                    <span>₹</span>
                    <FormField
                      control={form.control}
                      name="amount_paid"
                      render={({ field }) => (
                        <Input
                          placeholder="0.00"
                          className="w-24 h-7 text-xs"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Balance:</span>
                  <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === "edit" ? "Update Invoice" : "Create Invoice"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

