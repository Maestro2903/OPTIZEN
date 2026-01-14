"use client"

import * as React from "react"
import { Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { useMasterData } from "@/hooks/use-master-data"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const expenseSchema = z.object({
  expense_date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  sub_category: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  payment_method: z.string().optional(),
  vendor: z.string().optional(),
  bill_number: z.string().optional(),
  notes: z.string().optional(),
})

interface ExpenseFormProps {
  children: React.ReactNode
  expenseData?: any
  mode?: "create" | "edit"
}

export function ExpenseForm({ children, expenseData, mode = "create" }: ExpenseFormProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const masterData = useMasterData()

  // Load master data when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      masterData.fetchMultiple(['expenseCategories', 'paymentMethods'])
    }
  }, [isOpen, masterData])

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: expenseData?.expense_date || new Date().toISOString().split("T")[0],
      category: expenseData?.category || "other",
      sub_category: expenseData?.sub_category || "",
      description: expenseData?.description || "",
      amount: expenseData?.amount?.toString() || "",
      payment_method: expenseData?.payment_method || "",
      vendor: expenseData?.vendor || "",
      bill_number: expenseData?.bill_number || "",
      notes: expenseData?.notes || "",
    },
  })

  function onSubmit(values: z.infer<typeof expenseSchema>) {
    console.log(mode === "edit" ? "Update:" : "Create:", values)
    setIsOpen(false)
    form.reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="bg-gray-900/50 backdrop-blur-sm" />
        <DialogContent
          className="max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden"
          onCloseButtonClickOnly={true}
        >
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{mode === "edit" ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update expense details" : "Record a new expense transaction"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 min-h-0 bg-gradient-to-b from-gray-50/60 to-white">
              {/* Section 1: The 'Money Hero' */}
              <div className="w-full rounded-2xl border border-gray-200/80 bg-white/90 px-6 py-5 shadow-sm">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
                        Total Amount
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-end gap-4 border-b-2 border-gray-200 pb-2">
                          <span className="text-3xl font-semibold text-gray-400">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="h-16 w-full border-0 bg-transparent px-0 text-4xl font-mono font-bold tabular-nums tracking-tight text-gray-900 placeholder:text-gray-300 focus-visible:ring-0 focus-visible:border-gray-900"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: Transaction Details */}
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Date *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-11 bg-white text-gray-900 border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-80 [&::-webkit-calendar-picker-indicator]:invert-[0.6]"
                          {...field}
                        />
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
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Category *
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={masterData?.data?.expenseCategories || []}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select category"
                          searchPlaceholder="Search categories..."
                          emptyText="No categories found."
                          loading={masterData?.loading?.expenseCategories || false}
                          className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200"
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
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Payment Method
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={masterData?.data?.paymentMethods || []}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select payment method"
                          searchPlaceholder="Search methods..."
                          emptyText="No payment methods found."
                          loading={masterData?.loading?.paymentMethods || false}
                          className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bill_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Reference / Bill #
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="BILL-2025-001"
                          className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Description *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief description of the expense"
                          className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sub_category"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Sub Category
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional category detail (e.g., Electricity, Water)"
                          className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 3: Vendor Context */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-5 space-y-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Vendor Details (Optional)
                </p>

                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Vendor Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Vendor / Supplier name"
                          className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200"
                          {...field}
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
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional context for this transaction"
                          className="resize-none bg-white border-gray-200 rounded-lg text-sm focus:border-gray-600 focus:ring-gray-200"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <DialogFooter className="px-6 py-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-semibold shadow-md"
              >
                <Receipt className="h-4 w-4 mr-2" />
                {mode === "edit" ? "Update Expense" : "Record Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </DialogPortal>
  </Dialog>
  )
}

