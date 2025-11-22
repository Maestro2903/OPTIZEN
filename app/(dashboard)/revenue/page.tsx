"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2,
  Printer,
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
import { ExpenseForm } from "@/components/expense-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { RevenuePrint } from "@/components/revenue-print"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { financeRevenueApi, expensesApi, type FinanceRevenueMetrics, type ExpenseMetrics } from "@/lib/services/api"

interface Expense {
  id: string
  date: string
  category: string
  sub_category?: string
  description: string
  amount: number
  payment_method: string
  vendor: string
  bill_number?: string
}

// Sample data removed for production - should be fetched from API
const expenses: Expense[] = [
  // This should be populated from the revenue/expenses API
  // Example: const expenses = await fetchExpenses()
]

// Sample data removed for production - should be fetched from API
interface Transaction {
  id: string
  date: string
  patient: string
  type: string
  amount: number
  payment_method: string
  status: string
}

const recentTransactions: Transaction[] = [
  // This should be populated from the revenue/transactions API
  // Example: const transactions = await fetchTransactions()
]

const categoryColors = {
  salary: "bg-purple-100 text-purple-700 border-purple-200",
  utilities: "bg-blue-100 text-blue-700 border-blue-200",
  supplies: "bg-green-100 text-green-700 border-green-200",
  maintenance: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rent: "bg-red-100 text-red-700 border-red-200",
  marketing: "bg-pink-100 text-pink-700 border-pink-200",
  equipment: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function RevenuePage() {
  const [expensesList, setExpensesList] = React.useState<Expense[]>(expenses)
  const [transactionsList, setTransactionsList] = React.useState<Transaction[]>(recentTransactions)
  const [isLoading, setIsLoading] = React.useState(false)
  const [expensesSearchTerm, setExpensesSearchTerm] = React.useState("")
  const [transactionsSearchTerm, setTransactionsSearchTerm] = React.useState("")
  const [revenueMetrics, setRevenueMetrics] = React.useState<{
    this_month_revenue: number
    last_month_revenue: number
    revenue_change: number
  } | null>(null)
  const [expenseMetrics, setExpenseMetrics] = React.useState<{
    this_month_expenses: number
    last_month_expenses: number
    expenses_change: number
  } | null>(null)
  const [metricsLoading, setMetricsLoading] = React.useState(false)

  // Fetch metrics from server
  const fetchMetrics = React.useCallback(async () => {
    setMetricsLoading(true)
    try {
      // Fetch revenue metrics
      const revenueResponse = await financeRevenueApi.metrics()
      if (revenueResponse.success && revenueResponse.data) {
        setRevenueMetrics({
          this_month_revenue: revenueResponse.data.this_month_revenue,
          last_month_revenue: revenueResponse.data.last_month_revenue,
          revenue_change: revenueResponse.data.revenue_change
        })
      }

      // Fetch expense metrics
      const expenseResponse = await expensesApi.metrics()
      if (expenseResponse.success && expenseResponse.data) {
        setExpenseMetrics({
          this_month_expenses: expenseResponse.data.this_month_expenses,
          last_month_expenses: expenseResponse.data.last_month_expenses,
          expenses_change: expenseResponse.data.expenses_change
        })
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Function to handle expense deletion
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      // await fetch(`/api/revenue/expenses/${expenseId}`, { method: 'DELETE' })

      // For now, remove from local state
      setExpensesList(prev => prev.filter(e => e.id !== expenseId))
      fetchMetrics() // Refresh metrics after deleting expense
      console.log("Expense deleted:", expenseId)
    } catch (error) {
      console.error("Error deleting expense:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use server-provided aggregate metrics instead of hardcoded values
  const thisMonthRevenue = revenueMetrics?.this_month_revenue || 0
  const lastMonthRevenue = revenueMetrics?.last_month_revenue || 0
  const revenueChange = revenueMetrics?.revenue_change || 0

  const thisMonthExpenses = expenseMetrics?.this_month_expenses || 0
  const lastMonthExpenses = expenseMetrics?.last_month_expenses || 0
  const expensesChange = expenseMetrics?.expenses_change || 0

  // Calculate totals from current page data for display (not for metrics)
  const totalExpenses = expensesList.reduce((sum, exp) => sum + exp.amount, 0)

  const netProfit = thisMonthRevenue - thisMonthExpenses
  const profitMargin = thisMonthRevenue > 0 ? (netProfit / thisMonthRevenue) * 100 : 0

  const filteredExpenses = React.useMemo(() => {
    if (!expensesSearchTerm.trim()) return expensesList
    const q = expensesSearchTerm.trim().toLowerCase()
    return expensesList.filter(e =>
      e.date.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.sub_category || '').toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.vendor.toLowerCase().includes(q) ||
      e.payment_method.toLowerCase().includes(q) ||
      (e.bill_number || '').toLowerCase().includes(q)
    )
  }, [expensesSearchTerm, expensesList])

  const filteredTransactions = React.useMemo(() => {
    if (!transactionsSearchTerm.trim()) return transactionsList
    const q = transactionsSearchTerm.trim().toLowerCase()
    return transactionsList.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.date.toLowerCase().includes(q) ||
      t.patient.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.payment_method.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    )
  }, [transactionsSearchTerm, transactionsList])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">Revenue & Finance</h1>
          <p className="text-muted-foreground">
            Financial overview, revenue tracking, and expense management
          </p>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Expense Records</CardTitle>
                  <CardDescription>
                    Track and manage all business expenses
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search expenses..."
                      className="pl-8 w-[200px]"
                      value={expensesSearchTerm}
                      onChange={(e) => setExpensesSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <ExpenseForm>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Expense
                    </Button>
                  </ExpenseForm>
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
                      <TableHead>PAYMENT</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>BILL NO.</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm">{expense.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={categoryColors[expense.category as keyof typeof categoryColors]}
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{expense.description}</div>
                            <div className="text-xs text-muted-foreground">{expense.sub_category}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{expense.vendor}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{expense.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">₹{expense.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono">{expense.bill_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ViewEditDialog
                              title={`Expense - ${expense.description}`}
                              description={`Bill: ${expense.bill_number}`}
                              data={expense}
                              renderViewAction={(data?: Expense) => (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p>{data?.date}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Category</p>
                                    <Badge variant="outline" className={categoryColors[data?.category as keyof typeof categoryColors]}>
                                      {data?.category}
                                    </Badge>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Description</p>
                                    <p className="text-muted-foreground">{data?.description}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Vendor</p>
                                    <p>{data?.vendor}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Payment</p>
                                    <Badge variant="secondary">{data?.payment_method}</Badge>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-semibold">₹{Number(data?.amount || 0).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Bill No.</p>
                                    <p className="font-mono text-xs">{data?.bill_number}</p>
                                  </div>
                                </div>
                              )}
                              renderEditAction={(form: any) => (
                                <Form {...form}>
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name={"date"} render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Date</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={"category"} render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={"description"} render={({ field }) => (
                                      <FormItem className="col-span-2">
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={"vendor"} render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Vendor</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={"payment_method"} render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Payment</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                            <SelectItem value="UPI">UPI</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={"amount"} render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                          <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                    <FormField control={form.control} name={"bill_number"} render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Bill Number</FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}/>
                                  </div>
                                </Form>
                              )}
                              onSaveAction={async (values: any) => {
                                console.log("Update expense", values)
                              }}
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </ViewEditDialog>
                            <ExpenseForm expenseData={expense} mode="edit">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </ExpenseForm>
                            <DeleteConfirmDialog
                              title="Delete Expense"
                              description={`Are you sure you want to delete this expense? This action cannot be undone.`}
                              onConfirm={() => handleDeleteExpense(expense.id)}
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DeleteConfirmDialog>
                            <RevenuePrint
                              revenue={{
                                id: expense.id,
                                report_period: 'Expense Detail',
                                date_from: expense.date,
                                date_to: expense.date,
                                total_revenue: 0,
                                total_expenses: expense.amount,
                                net_profit: -expense.amount,
                                generated_by: 'Finance Department',
                                notes: `Expense: ${expense.description} | Vendor: ${expense.vendor} | Payment: ${expense.payment_method}`
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Print expense report"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </RevenuePrint>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Expense Summary */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Expenses (Showing {expensesList.length} records)</span>
                  <span className="text-lg font-bold">₹{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="mt-4 flex justify-end">
                  <RevenuePrint
                    revenue={{
                      id: 'RPT-' + new Date().getTime(),
                      report_period: 'Current Period',
                      date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                      date_to: new Date().toISOString(),
                      total_revenue: thisMonthRevenue,
                      total_expenses: thisMonthExpenses,
                      net_profit: netProfit,
                      generated_by: 'System Administrator',
                      notes: 'Current period financial summary based on recorded transactions and expenses.'
                    }}
                  >
                    <Button variant="outline" className="gap-2">
                      <Printer className="h-4 w-4" />
                      Print Revenue Report
                    </Button>
                  </RevenuePrint>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Latest revenue transactions from invoices
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="pl-8 w-[200px]"
                      value={transactionsSearchTerm}
                      onChange={(e) => setTransactionsSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>INVOICE NO.</TableHead>
                      <TableHead>DATE</TableHead>
                      <TableHead>PATIENT</TableHead>
                      <TableHead>TYPE</TableHead>
                      <TableHead>AMOUNT</TableHead>
                      <TableHead>PAYMENT METHOD</TableHead>
                      <TableHead>STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono font-medium">{transaction.id}</TableCell>
                        <TableCell className="text-sm">{transaction.date}</TableCell>
                        <TableCell className="font-medium">{transaction.patient}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">₹{transaction.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.payment_method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

