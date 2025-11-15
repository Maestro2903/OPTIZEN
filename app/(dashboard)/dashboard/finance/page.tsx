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
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { InvoiceViewDialog } from "@/components/invoice-view-dialog"
import { BillingPrint } from "@/components/billing-print"
import { ExpenseForm } from "@/components/expense-form"
import { FinanceInvoiceDialog } from "@/components/finance-invoice-dialog"
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance & Revenue</h1>
          <p className="text-muted-foreground">
            Comprehensive financial management and analytics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dashboardData.summary.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {dashboardData.comparison.revenueChange > 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">
                            {formatPercentage(dashboardData.comparison.revenueChange)}
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">
                            {formatPercentage(dashboardData.comparison.revenueChange)}
                          </span>
                        </>
                      )}
                      <span>from last month</span>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dashboardData.summary.totalExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {dashboardData.comparison.expenseChange > 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">
                            {formatPercentage(dashboardData.comparison.expenseChange)}
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">
                            {formatPercentage(dashboardData.comparison.expenseChange)}
                          </span>
                        </>
                      )}
                      <span>from last month</span>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dashboardData.summary.netProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Margin: {dashboardData.summary.profitMargin}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(dashboardData.summary.totalOutstanding)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.invoiceStats.unpaid} unpaid invoices
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Status</CardTitle>
                    <CardDescription>Breakdown of invoice statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Paid</span>
                        <Badge variant="secondary" className={paymentStatusColors.paid}>
                          {dashboardData.invoiceStats.paid}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Unpaid</span>
                        <Badge variant="secondary" className={paymentStatusColors.unpaid}>
                          {dashboardData.invoiceStats.unpaid}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Partial</span>
                        <Badge variant="secondary" className={paymentStatusColors.partial}>
                          {dashboardData.invoiceStats.partial}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-semibold">Total Invoices</span>
                        <span className="font-semibold">{dashboardData.invoiceStats.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Expenses by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(dashboardData.expenseStats.byCategory).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <Badge variant="secondary" className={expenseCategoryColors[category.toLowerCase()] || expenseCategoryColors.other}>
                            {category}
                          </Badge>
                          <span className="text-sm font-medium">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                      {Object.keys(dashboardData.expenseStats.byCategory).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No expenses recorded yet
                        </p>
                      )}
                    </div>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DATE</TableHead>
                      <TableHead>TYPE</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>PAID</TableHead>
                      <TableHead>PAYMENT</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>ACTIONS</TableHead>
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
                          <TableCell>{new Date(revenue.entry_date).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {revenue.revenue_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{revenue.description}</TableCell>
                          <TableCell>{formatCurrency(revenue.amount || 0)}</TableCell>
                          <TableCell>{formatCurrency(revenue.paid_amount || 0)}</TableCell>
                          <TableCell className="capitalize text-sm text-muted-foreground">
                            {revenue.payment_method?.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={
                                revenue.payment_status === 'received' ? 'bg-green-100 text-green-700' :
                                revenue.payment_status === 'pending' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }
                            >
                              {revenue.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => {
                                  toast({
                                    title: "Revenue Details",
                                    description: `${revenue.description} - ${formatCurrency(revenue.amount)}`,
                                  })
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DeleteConfirmDialog
                                title="Delete Revenue Entry"
                                description={`Are you sure you want to delete this revenue entry?`}
                                onConfirm={() => handleDeleteRevenue(revenue.id)}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
                      <TableHead>DATE</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>VENDOR</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>ACTIONS</TableHead>
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
                          <TableCell>{new Date(expense.expense_date).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={expenseCategoryColors[expense.category.toLowerCase()] || expenseCategoryColors.other}>
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                          <TableCell>{expense.vendor || '-'}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(expense)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteConfirmDialog
                                title="Delete Expense"
                                description={`Are you sure you want to delete this expense?`}
                                onConfirm={() => handleDeleteExpense(expense.id)}
                              >
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
    </div>
  )
}
