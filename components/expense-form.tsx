"use client"

import * as React from "react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const expenseSchema = z.object({
  expense_date: z.string().min(1, "Date is required"),
  category: z.enum(["salary", "utilities", "supplies", "maintenance", "rent", "marketing", "equipment", "other"]),
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

  const CATEGORY_OPTIONS = [
    "salary","utilities","supplies","maintenance","rent","marketing","equipment","other"
  ]
  const PAYMENT_OPTIONS = ["Cash","Bank Transfer","Card","UPI","Cheque"]

  function SimpleCombobox({
    options,
    value,
    onChange,
    placeholder,
    className,
  }: {
    options: string[]
    value?: string
    onChange: (v: string) => void
    placeholder?: string
    className?: string
  }) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value || "")
    const [isTyping, setIsTyping] = React.useState(false)
    
    React.useEffect(() => {
      if (!isTyping) {
        setInputValue(value || "")
      }
    }, [value, isTyping])

    const [debounced, setDebounced] = React.useState(inputValue)
    React.useEffect(() => {
      const t = setTimeout(() => setDebounced(inputValue), 150)
      return () => clearTimeout(t)
    }, [inputValue])

    const filtered = React.useMemo(() => {
      if (!isTyping && open) return options
      const q = (debounced || "").trim().toLowerCase()
      if (!q) return options
      return options.filter((o) => o.toLowerCase().includes(q))
    }, [options, debounced, isTyping, open])

    const [active, setActive] = React.useState(0)
    React.useEffect(() => setActive(0), [debounced, open])

    const handleSelect = (opt: string) => {
      onChange(opt)
      setInputValue(opt)
      setIsTyping(false)
      setOpen(false)
    }

    const handleClear = () => {
      onChange("")
      setInputValue("")
      setIsTyping(false)
      setOpen(false)
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={`w-full justify-between border-gray-300 text-left font-normal ${!value && 'text-muted-foreground'} ${className || ''}`}
          >
            <span className="truncate">{value || placeholder || "Select option"}</span>
            <span className="ml-2">▼</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] z-[100]" align="start" sideOffset={4}>
          <div className="p-2 border-b">
            <Input
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setIsTyping(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((p) => Math.min(p + 1, Math.max(filtered.length - 1, 0))) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((p) => Math.max(p - 1, 0)) }
                else if (e.key === 'Enter') { if (filtered[active]) { e.preventDefault(); handleSelect(filtered[active]) } }
                else if (e.key === 'Escape') { setOpen(false) }
              }}
              className="h-8 border-gray-300 focus-visible:ring-gray-300 bg-white text-foreground"
              autoComplete="off"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-60 bg-white">
            {value && !isTyping ? (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-gray-100 border-b"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
              >
                ✕ Clear selection
              </button>
            ) : null}
            {filtered.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No results</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  type="button"
                  key={opt}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${opt === value || idx === active ? 'bg-gray-100' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </button>
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    )
  }

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update expense details" : "Record a new expense transaction"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expense_date"
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <SimpleCombobox
                      options={CATEGORY_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search category"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sub_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Electricity, Water" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1000.00" {...field} />
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
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the expense" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor/Supplier name" {...field} />
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
                    <FormLabel>Payment Method</FormLabel>
                    <SimpleCombobox
                      options={PAYMENT_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search method"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bill_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bill/Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="BILL-2025-001" {...field} />
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
              <Button type="submit">{mode === "edit" ? "Update Expense" : "Add Expense"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

