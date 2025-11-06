"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  payment_method: z.enum(["Cash", "Card", "UPI", "Insurance", "Online"]),
  notes: z.string().optional(),
})

interface InvoiceFormProps {
  children: React.ReactNode
  invoiceData?: any
  mode?: "add" | "edit"
}

export function InvoiceForm({ children, invoiceData, mode = "add" }: InvoiceFormProps) {
  const [open, setOpen] = React.useState(false)

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
    const invoiceData = {
      ...values,
      subtotal,
      discount,
      tax,
      total,
      balance,
    }
    console.log(mode === "edit" ? "Update invoice:" : "Create invoice:", invoiceData)
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PAT001">AARAV MEHTA</SelectItem>
                        <SelectItem value="PAT002">NISHANT KAREKAR</SelectItem>
                        <SelectItem value="PAT003">PRIYA NAIR</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select case" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASE001">OPT250001</SelectItem>
                        <SelectItem value="CASE002">OPT250002</SelectItem>
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
                          <SelectItem value="Insurance">Insurance</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                        </SelectContent>
                      </Select>
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

