"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2,
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
import {
  RevenueVsExpenseChart,
  RevenueByPaymentMethod,
  RevenueByServiceType,
} from "@/components/revenue-charts"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock expenses data
const expenses = [
  {
    id: "1",
    date: "05/11/2025",
    category: "utilities",
    sub_category: "Electricity",
    description: "Monthly electricity bill",
    amount: 28500,
    payment_method: "Bank Transfer",
    vendor: "State Electricity Board",
    bill_number: "EB-2025-11-001",
  },
  {
    id: "2",
    date: "04/11/2025",
    category: "supplies",
    sub_category: "Medical Supplies",
    description: "Surgical instruments and consumables",
    amount: 45000,
    payment_method: "Bank Transfer",
    vendor: "MedEquip Supplies",
    bill_number: "MS-2025-345",
  },
  {
    id: "3",
    date: "03/11/2025",
    category: "salary",
    sub_category: "Staff Salary",
    description: "Monthly salary - November 2025",
    amount: 385000,
    payment_method: "Bank Transfer",
    vendor: "Staff Payroll",
    bill_number: "SAL-NOV-2025",
  },
  {
    id: "4",
    date: "01/11/2025",
    category: "rent",
    sub_category: "Office Rent",
    description: "Monthly clinic rent",
    amount: 125000,
    payment_method: "Bank Transfer",
    vendor: "Property Owner",
    bill_number: "RENT-NOV-2025",
  },
  {
    id: "5",
    date: "30/10/2025",
    category: "maintenance",
    sub_category: "Equipment",
    description: "OCT machine servicing",
    amount: 15000,
    payment_method: "Cash",
    vendor: "Optical Systems Ltd",
    bill_number: "SVC-2025-089",
  },
]

// Mock recent transactions (invoices)
const recentTransactions = [
  {
    id: "INV-089",
    date: "06/11/2025",
    patient: "AARAV MEHTA",
    type: "Surgery",
    amount: 45000,
    payment_method: "Card",
    status: "paid",
  },
  {
    id: "INV-088",
    date: "06/11/2025",
    patient: "PRIYA NAIR",
    type: "Consultation",
    amount: 1500,
    payment_method: "Cash",
    status: "paid",
  },
  {
    id: "INV-087",
    date: "05/11/2025",
    patient: "NISHANT KAREKAR",
    type: "Optical",
    amount: 8500,
    payment_method: "UPI",
    status: "paid",
  },
  {
    id: "INV-086",
    date: "05/11/2025",
    patient: "AISHABEN THAKIR",
    type: "Pharmacy",
    amount: 2300,
    payment_method: "Cash",
    status: "paid",
  },
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
  // Financial calculations
  const thisMonthRevenue = 1245000
  const lastMonthRevenue = 1082000
  const revenueChange = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

  const thisMonthExpenses = 758500
  const lastMonthExpenses = 725000
  const expensesChange = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100

  const netProfit = thisMonthRevenue - thisMonthExpenses
  const profitMargin = (netProfit / thisMonthRevenue) * 100

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const [expensesSearchTerm, setExpensesSearchTerm] = React.useState("")
  const [transactionsSearchTerm, setTransactionsSearchTerm] = React.useState("")

  const filteredExpenses = React.useMemo(() => {
    if (!expensesSearchTerm.trim()) return expenses
    const q = expensesSearchTerm.trim().toLowerCase()
    return expenses.filter(e =>
      e.date.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.sub_category || '').toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.vendor.toLowerCase().includes(q) ||
      e.payment_method.toLowerCase().includes(q) ||
      (e.bill_number || '').toLowerCase().includes(q)
    )
  }, [expensesSearchTerm])

  const filteredTransactions = React.useMemo(() => {
    if (!transactionsSearchTerm.trim()) return recentTransactions
    const q = transactionsSearchTerm.trim().toLowerCase()
    return recentTransactions.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.date.toLowerCase().includes(q) ||
      t.patient.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.payment_method.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    )
  }, [transactionsSearchTerm])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue & Finance</h1>
          <p className="text-muted-foreground">
            Financial overview, revenue tracking, and expense management
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(thisMonthRevenue / 100000).toFixed(2)}L</div>
            <div className="flex items-center gap-1 text-xs">
              {revenueChange >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{revenueChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{revenueChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(thisMonthExpenses / 100000).toFixed(2)}L</div>
            <div className="flex items-center gap-1 text-xs">
              {expensesChange >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">+{expensesChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{expensesChange.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(netProfit / 100000).toFixed(2)}L</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">profit margin</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <RevenueVsExpenseChart />
            <RevenueByPaymentMethod />
          </div>
          <RevenueByServiceType />
        </TabsContent>

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
                              data={expense as any}
                              renderViewAction={(data: any) => (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p>{data.date}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Category</p>
                                    <Badge variant="outline" className={categoryColors[data.category as keyof typeof categoryColors]}>
                                      {data.category}
                                    </Badge>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Description</p>
                                    <p className="text-muted-foreground">{data.description}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Vendor</p>
                                    <p>{data.vendor}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Payment</p>
                                    <Badge variant="secondary">{data.payment_method}</Badge>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-semibold">₹{Number(data.amount).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Bill No.</p>
                                    <p className="font-mono text-xs">{data.bill_number}</p>
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
                              onConfirm={() => console.log("Delete:", expense.id)}
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DeleteConfirmDialog>
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
                  <span className="text-sm font-medium">Total Expenses (Showing {expenses.length} records)</span>
                  <span className="text-lg font-bold">₹{totalExpenses.toLocaleString()}</span>
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

