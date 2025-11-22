"use client"

import * as React from "react"
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { InvoiceViewDialog } from "@/components/dialogs/invoice-view-dialog"
import { BillingPrint } from "@/components/print/billing-print"
import { ExpenseForm } from "@/components/forms/expense-form"
import { FinanceInvoiceDialog } from "@/components/dialogs/finance-invoice-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { 
  invoicesApi, 
  expensesApi, 
  financeApi,
  financeRevenueApi,
  type Invoice, 
  type Expense,
  type FinanceDashboard,
  type FinanceRevenue
} from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMasterData } from "@/hooks/use-master-data"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"

// Expense form schema
const expenseSchema = z.object({
  expense_date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  sub_category: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0, "Amount must be positive"),
  payment_method: z.string().optional(),
  vendor: z.string().optional(),
  bill_number: z.string().optional(),
  notes: z.string().optional(),
})

// Status colors
const invoiceStatusColors = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-orange-100 text-orange-700 border-orange-200",
}

const paymentStatusColors = {
  paid: "bg-green-100 text-green-700 border-green-200",
  partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
  unpaid: "bg-red-100 text-red-700 border-red-200",
}

const expenseCategoryColors: Record<string, string> = {
  salary: "bg-purple-100 text-purple-700 border-purple-200",
  salaries: "bg-purple-100 text-purple-700 border-purple-200",
  utilities: "bg-blue-100 text-blue-700 border-blue-200",
  supplies: "bg-green-100 text-green-700 border-green-200",
  "medical supplies": "bg-green-100 text-green-700 border-green-200",
  maintenance: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rent: "bg-red-100 text-red-700 border-red-200",
  marketing: "bg-pink-100 text-pink-700 border-pink-200",
  equipment: "bg-indigo-100 text-indigo-700 border-indigo-200",
  insurance: "bg-teal-100 text-teal-700 border-teal-200",
  "office supplies": "bg-cyan-100 text-cyan-700 border-cyan-200",
  travel: "bg-amber-100 text-amber-700 border-amber-200",
  "professional fees": "bg-violet-100 text-violet-700 border-violet-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function FinancePage() {
  const { toast } = useToast()
  const masterData = useMasterData()
  const expenseCategoryMap = React.useMemo(() => {
    return masterData.data.expenseCategories.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label
      return acc
    }, {})
  }, [masterData.data.expenseCategories])
  const [activeTab, setActiveTab] = React.useState("dashboard")
  
  // Dashboard state
  const [dashboardData, setDashboardData] = React.useState<FinanceDashboard | null>(null)
  const [dashboardLoading, setDashboardLoading] = React.useState(false)

  // Revenue state (replaces invoices)
  const [revenueSearchTerm, setRevenueSearchTerm] = React.useState("")
  const [revenuePage, setRevenuePage] = React.useState(1)
  const [revenuePageSize, setRevenuePageSize] = React.useState(10)
  const [revenueFilters, setRevenueFilters] = React.useState<string[]>([])
  const [revenueSort, setRevenueSort] = React.useState("entry_date")
  const [revenueSortDir, setRevenueSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [isRevenueDialogOpen, setIsRevenueDialogOpen] = React.useState(false)
  const [editingRevenue, setEditingRevenue] = React.useState<FinanceRevenue | null>(null)

  // Expenses state
  const [expenseSearchTerm, setExpenseSearchTerm] = React.useState("")
  const [expensePage, setExpensePage] = React.useState(1)
  const [expensePageSize, setExpensePageSize] = React.useState(10)
  const [expenseFilters, setExpenseFilters] = React.useState<string[]>([])
  const [expenseSort, setExpenseSort] = React.useState("expense_date")
  const [expenseSortDir, setExpenseSortDir] = React.useState<'asc' | 'desc'>('desc')
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null)
  const [viewingExpense, setViewingExpense] = React.useState<Expense | null>(null)

  // API hooks for revenue (replaces invoices)
  const {
    data: revenues,
    loading: revenuesLoading,
    pagination: revenuePagination,
    search: searchRevenues,
    sort: sortRevenues,
    filter: filterRevenues,
    changePage: changeRevenuePage,
    changePageSize: changeRevenuePageSize,
    addItem: addRevenue,
    updateItem: updateRevenueItem,
    removeItem: removeRevenue,
    refresh: refreshRevenues,
  } = useApiList<FinanceRevenue>(financeRevenueApi.list, {
    page: revenuePage,
    limit: revenuePageSize,
    sortBy: revenueSort,
    sortOrder: revenueSortDir,
  })

  // API hooks for expenses
  const {
    data: expenses,
    loading: expensesLoading,
    pagination: expensePagination,
    search: searchExpenses,
    sort: sortExpenses,
    filter: filterExpenses,
    changePage: changeExpensePage,
    changePageSize: changeExpensePageSize,
    addItem: addExpense,
    updateItem: updateExpenseItem,
    removeItem: removeExpense,
    refresh: refreshExpenses,
  } = useApiList<Expense>(expensesApi.list, {
    page: expensePage,
    limit: expensePageSize,
    sortBy: expenseSort,
    sortOrder: expenseSortDir,
  })

  const { submitForm: createExpense, loading: createExpenseLoading } = useApiForm<Expense>()
  const { submitForm: updateExpenseForm, loading: updateExpenseLoading } = useApiForm<Expense>()
  const { deleteItem: deleteExpense, loading: deleteExpenseLoading } = useApiDelete()

  // Expense form
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
      category: "other",
      description: "",
      amount: 0,
      payment_method: "",
      vendor: "",
      bill_number: "",
      notes: "",
    },
  })

  // Load dashboard data
  const loadDashboardData = React.useCallback(async () => {
    setDashboardLoading(true)
    try {
      const response = await financeApi.getDashboard()
      if (response.success && response.data) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error("Error loading dashboard:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      })
    } finally {
      setDashboardLoading(false)
    }
  }, [toast])

  // Load dashboard and master data when tab is active
  React.useEffect(() => {
    if (activeTab === "dashboard") {
      loadDashboardData()
    }
    // Load master data for finance forms
    masterData.fetchMultiple(['expenseCategories', 'paymentMethods'])
  }, [activeTab, loadDashboardData])

  // Revenue search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchRevenues(revenueSearchTerm.trim())
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [revenueSearchTerm, searchRevenues])

  // Expense search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchExpenses(expenseSearchTerm.trim())
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [expenseSearchTerm, searchExpenses])

  // Handle expense operations
  const handleAddExpense = async (values: z.infer<typeof expenseSchema>) => {
    try {
      const result = await createExpense(
        () => expensesApi.create(values),
        {
          successMessage: "Expense added successfully.",
          onSuccess: (newExpense) => {
            addExpense(newExpense)
          },
        }
      )
      if (result) {
        setIsExpenseDialogOpen(false)
        expenseForm.reset()
        loadDashboardData() // Refresh dashboard
      }
    } catch (error) {
      console.error("Error creating expense:", error)
    }
  }

  const handleUpdateExpense = async (expenseId: string, values: z.infer<typeof expenseSchema>) => {
    try {
      const result = await updateExpenseForm(
        () => expensesApi.update(expenseId, values),
        {
          successMessage: "Expense updated successfully.",
          onSuccess: (updatedExpense) => {
            updateExpenseItem(expenseId, updatedExpense)
          },
        }
      )
      if (result) {
        setIsExpenseDialogOpen(false)
        setEditingExpense(null)
        expenseForm.reset()
        loadDashboardData() // Refresh dashboard
      }
    } catch (error) {
      console.error("Error updating expense:", error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId)
    if (!expense) return

    const success = await deleteExpense(
      () => expensesApi.delete(expenseId),
      {
        successMessage: `Expense deleted successfully.`,
        onSuccess: () => {
          removeExpense(expenseId)
          loadDashboardData() // Refresh dashboard
        },
      }
    )
  }

  // Handle revenue operations
  const handleAddRevenue = async (values: any) => {
    try {
      const response = await financeRevenueApi.create(values)
      if (response.success && response.data) {
        addRevenue(response.data)
        toast({
          title: "Success",
          description: "Revenue entry added successfully.",
        })
        loadDashboardData() // Refresh dashboard
        return response.data
      }
    } catch (error) {
      console.error("Error creating revenue:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add revenue entry",
      })
    }
  }

  const handleUpdateRevenue = async (revenueId: string, values: any) => {
    try {
      const response = await financeRevenueApi.update(revenueId, values)
      if (response.success && response.data) {
        updateRevenueItem(revenueId, response.data)
        toast({
          title: "Success",
          description: "Revenue entry updated successfully.",
        })
        loadDashboardData() // Refresh dashboard
        setEditingRevenue(null)
        return response.data
      } else {
        throw new Error(response.error || "Failed to update revenue entry")
      }
    } catch (error) {
      console.error("Error updating revenue:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update revenue entry",
      })
      throw error
    }
  }

  const handleDeleteRevenue = async (revenueId: string) => {
    try {
      const response = await financeRevenueApi.delete(revenueId)
      if (response.success) {
        removeRevenue(revenueId)
        toast({
          title: "Success",
          description: "Revenue entry deleted successfully.",
        })
        loadDashboardData() // Refresh dashboard
      }
    } catch (error) {
      console.error("Error deleting revenue:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete revenue entry",
      })
    }
  }

  const handleEditRevenue = (revenue: FinanceRevenue) => {
    setEditingRevenue(revenue)
  }

  const [viewingRevenue, setViewingRevenue] = React.useState<FinanceRevenue | null>(null)

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    expenseForm.reset({
      expense_date: expense.expense_date,
      category: expense.category as any,
      sub_category: expense.sub_category || "",
      description: expense.description,
      amount: expense.amount,
      payment_method: expense.payment_method || "",
      vendor: expense.vendor || "",
      bill_number: expense.bill_number || "",
      notes: expense.notes || "",
    })
    setIsExpenseDialogOpen(true)
  }

  const onExpenseSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (editingExpense) {
      await handleUpdateExpense(editingExpense.id, values)
    } else {
      await handleAddExpense(values)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value > 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  const looksLikeUUID = (value: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)

  const formatExpenseCategoryLabel = React.useCallback((categoryKey?: string | null) => {
    if (!categoryKey) return "Uncategorized"
    const directMatch = expenseCategoryMap[categoryKey]
    if (directMatch) return directMatch

    // Try matching by label in case value already holds the label text
    const normalized = categoryKey.trim().toLowerCase()
    const labelMatch = masterData.data.expenseCategories.find(
      (option) => option.label.trim().toLowerCase() === normalized
    )
    if (labelMatch) return labelMatch.label

    if (looksLikeUUID(categoryKey)) return "Uncategorized"
    const cleaned = categoryKey.replace(/[_-]+/g, " ").toLowerCase()
    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase())
  }, [expenseCategoryMap, masterData.data.expenseCategories])

  const TrendBadge = ({ value, label = "vs last month" }: { value: number; label?: string }) => {
    const isPositive = value >= 0
    const icon = isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />
    return (
      <Badge
        variant="outline"
        className={cn(
          "flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
          isPositive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
        )}
      >
        {icon}
        <span>{formatPercentage(value)}</span>
        <span className="text-[11px] font-normal text-muted-foreground">{label}</span>
      </Badge>
    )
  }

  const humanizeLabel = (value?: string) => {
    if (!value) return "-"
    return value
      .replace(/[_-]+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const TypeBadge = ({ value }: { value?: string }) => (
    <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
      {humanizeLabel(value)}
    </span>
  )

  const MoneyValue = ({
    amount,
    bold,
    dashIfZero,
  }: {
    amount?: number | null
    bold?: boolean
    dashIfZero?: boolean
  }) => {
    const safeAmount = Number(amount || 0)
    if (dashIfZero && safeAmount === 0) {
      return <span className="font-mono tabular-nums text-sm text-gray-400">-</span>
    }
    return (
      <span
        className={cn(
          "font-mono tabular-nums text-sm",
          bold ? "font-bold text-gray-900" : "text-gray-700"
        )}
      >
        {formatCurrency(safeAmount)}
      </span>
    )
  }

  const financialHeaderClass = "text-xs font-semibold uppercase tracking-wider text-gray-500"

  const StatusBadge = ({ status }: { status: string }) => {
    const normalized = status?.toLowerCase()
    const statusConfigs: Record<
      string,
      { className: string; label: string }
    > = {
      pending: {
        className: "border-amber-100 bg-amber-50 text-amber-700",
        label: "Pending",
      },
      received: {
        className: "border-emerald-100 bg-emerald-50 text-emerald-700",
        label: "Paid",
      },
      paid: {
        className: "border-emerald-100 bg-emerald-50 text-emerald-700",
        label: "Paid",
      },
      cleared: {
        className: "border-emerald-100 bg-emerald-50 text-emerald-700",
        label: "Cleared",
      },
      cancelled: {
        className: "border border-dashed border-gray-200 bg-gray-100 text-gray-500 line-through",
        label: "Cancelled",
      },
      partial: {
        className: "border-amber-100 bg-amber-50 text-amber-700",
        label: "Partial",
      },
    }
    const config = statusConfigs[normalized] || {
      className: "border-slate-200 bg-slate-100 text-slate-600",
      label: status,
    }
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium",
          config.className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {config.label}
      </span>
    )
  }

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString))
  }

  const invoiceStatusBreakdown = React.useMemo(() => {
    if (!dashboardData) return []
    const total = dashboardData.invoiceStats.total || 0
    return [
      { key: "paid", label: "Paid", value: dashboardData.invoiceStats.paid, color: "bg-emerald-500" },
      { key: "unpaid", label: "Unpaid", value: dashboardData.invoiceStats.unpaid, color: "bg-rose-500" },
      { key: "partial", label: "Partial", value: dashboardData.invoiceStats.partial, color: "bg-amber-500" },
    ].map((item) => ({
      ...item,
      percentage: total ? Math.round((item.value / total) * 100) : 0,
    }))
  }, [dashboardData])

  const expenseCategoryEntries = React.useMemo(() => {
    if (!dashboardData) return []
    return Object.entries(dashboardData.expenseStats.byCategory)
      .sort(([, amountA], [, amountB]) => Number(amountB) - Number(amountA))
  }, [dashboardData])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">Finance & Revenue</h1>
          <p className="text-muted-foreground">
            Comprehensive financial management and analytics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1">
          <TabsTrigger
            value="dashboard"
            className="gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            <TrendingUp className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            <DollarSign className="h-4 w-4" />
            Expenses
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading dashboard...</div>
            </div>
          ) : dashboardData ? (
            <>
              {/* Metric Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-t-4 border-emerald-500 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-emerald-600/80">Revenue</p>
                      <CardTitle className="text-sm font-medium text-gray-900">Total Revenue</CardTitle>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                      {formatCurrency(dashboardData.summary.totalRevenue)}
                    </div>
                    <TrendBadge value={dashboardData.comparison.revenueChange} />
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-rose-500 bg-gradient-to-br from-rose-50 via-white to-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-rose-600/80">Expenses</p>
                      <CardTitle className="text-sm font-medium text-gray-900">Total Expenses</CardTitle>
                    </div>
                    <TrendingDown className="h-5 w-5 text-rose-500" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                      {formatCurrency(dashboardData.summary.totalExpenses)}
                    </div>
                    <TrendBadge value={dashboardData.comparison.expenseChange} />
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-blue-500 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-blue-600/80">Profit</p>
                      <CardTitle className="text-sm font-medium text-gray-900">Net Profit</CardTitle>
                    </div>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                      {formatCurrency(dashboardData.summary.netProfit)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TrendBadge value={dashboardData.comparison.profitChange} />
                      <Badge variant="secondary" className="rounded-full bg-white text-xs font-medium text-blue-600">
                        Margin {dashboardData.summary.profitMargin}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-slate-400 bg-gradient-to-br from-slate-50 via-white to-white shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Outstanding</p>
                      <CardTitle className="text-sm font-medium text-gray-900">Total Outstanding</CardTitle>
                    </div>
                    <Receipt className="h-5 w-5 text-slate-500" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold tracking-tight text-gray-900">
                      {formatCurrency(dashboardData.summary.totalOutstanding)}
                    </div>
                    <Badge variant="outline" className="w-fit rounded-full border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
                      {dashboardData.invoiceStats.unpaid} invoices due
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-2 auto-rows-fr">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle>Invoice Status</CardTitle>
                    <CardDescription>Track payment momentum at a glance</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {invoiceStatusBreakdown.length ? (
                      <div className="flex flex-col gap-4">
                        {invoiceStatusBreakdown.map((status) => (
                          <div key={status.key} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">{status.label}</p>
                                <p className="text-xs text-muted-foreground">{status.percentage}% of invoices</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full text-xs font-semibold",
                                  status.key === "paid" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                  status.key === "unpaid" && "border-rose-200 bg-rose-50 text-rose-700",
                                  status.key === "partial" && "border-amber-200 bg-amber-50 text-amber-700"
                                )}
                              >
                                {status.value}
                              </Badge>
                            </div>
                            <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                              <div
                                className={cn("h-2 rounded-full transition-all", status.color)}
                                style={{ width: `${status.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">No invoices for this range</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-4">
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Top spending categories</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {expenseCategoryEntries.length ? (
                      <div className="flex flex-col divide-y divide-border/70">
                        {expenseCategoryEntries.map(([categoryKey, amount]) => {
                          const label = formatExpenseCategoryLabel(categoryKey)
                          return (
                            <div key={categoryKey} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{label}</span>
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">Category</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount as number)}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">No expenses recorded yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest financial activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DATE</TableHead>
                          <TableHead>TYPE</TableHead>
                          <TableHead>AMOUNT</TableHead>
                          <TableHead>STATUS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.recentTransactions.length > 0 ? (
                          dashboardData.recentTransactions.map((transaction, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(transaction.date).toLocaleDateString('en-GB')}</TableCell>
                              <TableCell className="capitalize">{transaction.type}</TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={paymentStatusColors[transaction.status as keyof typeof paymentStatusColors] || paymentStatusColors.unpaid}>
                                  {transaction.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No recent transactions
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No dashboard data available</div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: REVENUE ENTRIES (Replaces Invoices) */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Management</CardTitle>
                  <CardDescription>Track all revenue entries for financial reporting</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search revenue..."
                      className="pl-8 w-[300px]"
                      value={revenueSearchTerm}
                      onChange={(e) => setRevenueSearchTerm(e.target.value)}
                      disabled={revenuesLoading}
                    />
                  </div>
                  <FinanceInvoiceDialog 
                    mode="add"
                    onSubmit={handleAddRevenue}
                  >
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Revenue
                    </Button>
                  </FinanceInvoiceDialog>
                  <FinanceInvoiceDialog
                    mode="edit"
                    revenueData={editingRevenue || undefined}
                    onSubmit={async (data) => {
                      if (editingRevenue) {
                        await handleUpdateRevenue(editingRevenue.id, data)
                        setEditingRevenue(null)
                      }
                    }}
                  >
                    <div style={{ display: 'none' }} />
                  </FinanceInvoiceDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={financialHeaderClass}>DATE</TableHead>
                      <TableHead className={financialHeaderClass}>TYPE</TableHead>
                      <TableHead className={financialHeaderClass}>DESCRIPTION</TableHead>
                      <TableHead className={cn(financialHeaderClass, "text-right")}>AMOUNT</TableHead>
                      <TableHead className={cn(financialHeaderClass, "text-right")}>PAID</TableHead>
                      <TableHead className={financialHeaderClass}>PAYMENT</TableHead>
                      <TableHead className={financialHeaderClass}>STATUS</TableHead>
                      <TableHead className={financialHeaderClass}>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenuesLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Loading revenue entries...
                        </TableCell>
                      </TableRow>
                    ) : revenues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No revenue entries found. Click &quot;Add Revenue&quot; to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      revenues.map((revenue) => (
                        <TableRow key={revenue.id}>
                          <TableCell className="text-sm text-gray-500">{formatDisplayDate(revenue.entry_date)}</TableCell>
                          <TableCell>
                            <TypeBadge value={revenue.revenue_type} />
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-gray-700">{revenue.description}</TableCell>
                          <TableCell className="text-right">
                            <MoneyValue amount={revenue.amount} bold />
                          </TableCell>
                          <TableCell className="text-right">
                            <MoneyValue amount={revenue.paid_amount} dashIfZero />
                          </TableCell>
                          <TableCell className="text-sm capitalize text-gray-500">
                            {humanizeLabel(revenue.payment_method)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={revenue.payment_status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-700"
                                onClick={() => setViewingRevenue(revenue)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-700"
                                onClick={() => handleEditRevenue(revenue)}
                                title="Edit revenue"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteConfirmDialog
                                title="Delete Revenue Entry"
                                description={`Are you sure you want to delete this revenue entry?`}
                                onConfirm={() => handleDeleteRevenue(revenue.id)}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                  title="Delete revenue"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DeleteConfirmDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {revenuePagination && revenuePagination.totalPages > 1 && (
                <Pagination
                  currentPage={revenuePagination.page}
                  totalPages={revenuePagination.totalPages}
                  pageSize={revenuePagination.limit}
                  totalItems={revenuePagination.total}
                  onPageChange={setRevenuePage}
                  onPageSizeChange={(newSize) => {
                    setRevenuePageSize(newSize)
                    setRevenuePage(1)
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: EXPENSES */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Management</CardTitle>
                  <CardDescription>Track and manage all expenses</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search expenses..."
                      className="pl-8 w-[300px]"
                      value={expenseSearchTerm}
                      onChange={(e) => setExpenseSearchTerm(e.target.value)}
                      disabled={expensesLoading}
                    />
                  </div>
                  <Dialog open={isExpenseDialogOpen} onOpenChange={(open) => {
                    setIsExpenseDialogOpen(open)
                    if (!open) {
                      setEditingExpense(null)
                      expenseForm.reset()
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                        <DialogDescription>
                          {editingExpense ? "Update expense information" : "Record a new expense"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...expenseForm}>
                        <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={expenseForm.control}
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
                              control={expenseForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category *</FormLabel>
                                  <FormControl>
                                    <SearchableSelect
                                      options={masterData.data.expenseCategories || []}
                                      value={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select category"
                                      searchPlaceholder="Search categories..."
                                      emptyText="No categories found."
                                      loading={masterData.loading.expenseCategories}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={expenseForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Brief description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={expenseForm.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={expenseForm.control}
                              name="payment_method"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Method</FormLabel>
                                  <FormControl>
                                    <SearchableSelect
                                      options={masterData.data.paymentMethods || []}
                                      value={field.value || ""}
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
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={expenseForm.control}
                              name="vendor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vendor</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Vendor name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={expenseForm.control}
                              name="bill_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bill Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Bill/Invoice #" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={expenseForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input placeholder="Additional notes..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => {
                              setIsExpenseDialogOpen(false)
                              setEditingExpense(null)
                              expenseForm.reset()
                            }}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createExpenseLoading || updateExpenseLoading}>
                              {createExpenseLoading || updateExpenseLoading ? "Processing..." : (editingExpense ? "Update" : "Add Expense")}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={financialHeaderClass}>DATE</TableHead>
                      <TableHead className={financialHeaderClass}>CATEGORY</TableHead>
                      <TableHead className={financialHeaderClass}>DESCRIPTION</TableHead>
                      <TableHead className={financialHeaderClass}>VENDOR</TableHead>
                      <TableHead className={cn(financialHeaderClass, "text-right")}>AMOUNT</TableHead>
                      <TableHead className={financialHeaderClass}>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading expenses...
                        </TableCell>
                      </TableRow>
                    ) : expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No expenses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="text-sm text-gray-500">{formatDisplayDate(expense.expense_date)}</TableCell>
                          <TableCell>
                            <span className="line-clamp-1 text-sm font-medium text-gray-900">
                              {formatExpenseCategoryLabel(expense.category)}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate text-sm text-gray-700">{expense.description}</TableCell>
                          <TableCell className="text-sm text-gray-500">{expense.vendor || '-'}</TableCell>
                          <TableCell className="text-right">
                            <MoneyValue amount={expense.amount} bold />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-700"
                                onClick={() => setViewingExpense(expense)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-700"
                                onClick={() => handleEditExpense(expense)}
                                title="Edit expense"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteConfirmDialog
                                title="Delete Expense"
                                description={`Are you sure you want to delete this expense?`}
                                onConfirm={() => handleDeleteExpense(expense.id)}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                  title="Delete expense"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DeleteConfirmDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {expensePagination && (
                <Pagination
                  currentPage={expensePagination.page}
                  totalPages={expensePagination.totalPages}
                  pageSize={expensePagination.limit}
                  totalItems={expensePagination.total}
                  onPageChange={setExpensePage}
                  onPageSizeChange={(newSize) => {
                    setExpensePageSize(newSize)
                    setExpensePage(1)
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revenue View Dialog */}
      <Dialog open={!!viewingRevenue} onOpenChange={(open) => !open && setViewingRevenue(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revenue Entry Details</DialogTitle>
            <DialogDescription>View complete information for this revenue entry</DialogDescription>
          </DialogHeader>
          {viewingRevenue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Entry Date</label>
                  <p className="text-sm text-gray-900">{formatDisplayDate(viewingRevenue.entry_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Revenue Type</label>
                  <p className="text-sm text-gray-900">
                    <TypeBadge value={viewingRevenue.revenue_type} />
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{viewingRevenue.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm font-semibold text-gray-900">
                    <MoneyValue amount={viewingRevenue.amount} bold />
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Paid Amount</label>
                  <p className="text-sm text-gray-900">
                    <MoneyValue amount={viewingRevenue.paid_amount} dashIfZero />
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {humanizeLabel(viewingRevenue.payment_method)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <p className="text-sm text-gray-900">
                    <StatusBadge status={viewingRevenue.payment_status} />
                  </p>
                </div>
              </div>
              {viewingRevenue.patient_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Patient</label>
                  <p className="text-sm text-gray-900">{viewingRevenue.patient_name}</p>
                </div>
              )}
              {viewingRevenue.invoice_reference && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Invoice Reference</label>
                  <p className="text-sm text-gray-900 font-mono">{viewingRevenue.invoice_reference}</p>
                </div>
              )}
              {viewingRevenue.category && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm text-gray-900">{viewingRevenue.category}</p>
                </div>
              )}
              {viewingRevenue.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingRevenue.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRevenue(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense View Dialog */}
      <Dialog open={!!viewingExpense} onOpenChange={(open) => !open && setViewingExpense(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>View complete information for this expense</DialogDescription>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Expense Date</label>
                  <p className="text-sm text-gray-900">{formatDisplayDate(viewingExpense.expense_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm text-gray-900">
                    {formatExpenseCategoryLabel(viewingExpense.category)}
                  </p>
                </div>
              </div>
              {viewingExpense.sub_category && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Sub Category</label>
                  <p className="text-sm text-gray-900">{viewingExpense.sub_category}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{viewingExpense.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm font-semibold text-gray-900">
                    <MoneyValue amount={viewingExpense.amount} bold />
                  </p>
                </div>
                {viewingExpense.vendor && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor</label>
                    <p className="text-sm text-gray-900">{viewingExpense.vendor}</p>
                  </div>
                )}
              </div>
              {viewingExpense.payment_method && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {humanizeLabel(viewingExpense.payment_method)}
                  </p>
                </div>
              )}
              {viewingExpense.bill_number && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bill Number</label>
                  <p className="text-sm text-gray-900 font-mono">{viewingExpense.bill_number}</p>
                </div>
              )}
              {viewingExpense.approved_by && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Approved By</label>
                  <p className="text-sm text-gray-900">{viewingExpense.approved_by}</p>
                </div>
              )}
              {viewingExpense.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingExpense.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingExpense(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
