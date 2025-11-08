"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Printer,
  DollarSign,
  TrendingUp,
  Clock,
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
import { InvoiceForm } from "@/components/invoice-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import * as z from "zod"

interface Invoice {
  id: string
  date: string
  patient_name: string
  items: string
  total: string
  paid: string
  balance: string
  status: "Paid" | "Partial" | "Unpaid"
}

const initialInvoices: Invoice[] = [
  {
    id: "INV001",
    date: "15/11/2025",
    patient_name: "AARAV MEHTA",
    items: "Consultation, Eye Drops",
    total: "₹1,250",
    paid: "₹1,250",
    balance: "₹0",
    status: "Paid",
  },
  {
    id: "INV002",
    date: "14/11/2025",
    patient_name: "NISHANT KAREKAR",
    items: "LASIK Surgery",
    total: "₹45,000",
    paid: "₹30,000",
    balance: "₹15,000",
    status: "Partial",
  },
  {
    id: "INV003",
    date: "13/11/2025",
    patient_name: "PRIYA NAIR",
    items: "Cataract Surgery, IOL",
    total: "₹35,000",
    paid: "₹0",
    balance: "₹35,000",
    status: "Unpaid",
  },
]

const statusColors = {
  Paid: "bg-green-100 text-green-700 border-green-200",
  Partial: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Unpaid: "bg-red-100 text-red-700 border-red-200",
}

export default function BillingPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = React.useState<Invoice[]>(initialInvoices)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Helper function to get next invoice ID with NaN protection
  const getNextInvoiceId = (invoices: Invoice[]) => {
    const maxId = invoices.reduce((max, inv) => {
      const num = parseInt(inv.id.replace('INV', ''), 10)
      return !isNaN(num) && num > max ? num : max
    }, 0)
    return `INV${String(maxId + 1).padStart(3, '0')}`
  }

  const handleAddInvoice = (invoiceData: any) => {
    const newInvoice: Invoice = {
      id: getNextInvoiceId(invoices),
      date: new Date().toLocaleDateString('en-GB'),
      ...invoiceData,
    }
    setInvoices(prev => [newInvoice, ...prev])
    toast({
      title: "Invoice Created",
      description: "New invoice has been created successfully.",
    })
  }

  const handleUpdateInvoice = (invoiceId: string, values: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, ...values } : inv
    ))
    toast({
      title: "Invoice Updated",
      description: "Invoice has been updated successfully.",
    })
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (!invoice) {
      toast({
        title: "Error",
        description: "Invoice not found.",
        variant: "destructive",
      })
      return
    }
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
    toast({
      title: "Invoice Deleted",
      description: `Invoice ${invoice.id} has been deleted successfully.`,
      variant: "destructive",
    })
  }

  const filteredInvoices = React.useMemo(() => {
    if (!searchTerm.trim()) return invoices
    const q = searchTerm.trim().toLowerCase()
    return invoices.filter(inv =>
      inv.id.toLowerCase().includes(q) ||
      inv.date.toLowerCase().includes(q) ||
      inv.patient_name.toLowerCase().includes(q) ||
      inv.items.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q)
    )
  }, [invoices, searchTerm])

  const paginatedInvoices = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredInvoices.slice(startIndex, endIndex)
  }, [filteredInvoices, currentPage, pageSize])

  const totalPages = Math.ceil(filteredInvoices.length / pageSize)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices and payment tracking
          </p>
        </div>
        <InvoiceForm onSubmit={handleAddInvoice}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </InvoiceForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹12,45,000</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹2,15,000</div>
            <p className="text-xs text-muted-foreground">pending payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">143</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82.7%</div>
            <p className="text-xs text-muted-foreground">collection rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>
                View and manage all billing invoices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search invoices..."
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableHead>SR. NO.</TableHead>
                  <TableHead>INVOICE NO.</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>ITEMS</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead>PAID</TableHead>
                  <TableHead>BALANCE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice, index) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="font-medium uppercase">{invoice.patient_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{invoice.items}</TableCell>
                    <TableCell className="font-semibold">{invoice.total}</TableCell>
                    <TableCell className="font-semibold">{invoice.paid}</TableCell>
                    <TableCell className="font-semibold">{invoice.balance}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[invoice.status as keyof typeof statusColors]}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Invoice - ${invoice.id}`}
                          description={`Patient: ${invoice.patient_name}`}
                          data={invoice as any}
                          renderViewAction={(data: any) => (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Date</p>
                                <p className="font-medium">{data.date}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Patient</p>
                                <p className="font-medium uppercase">{data.patient_name}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Items</p>
                                <p className="text-muted-foreground">{data.items}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-semibold">{data.total}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant="outline" className={statusColors[data.status as keyof typeof statusColors]}>
                                  {data.status}
                                </Badge>
                              </div>
                            </div>
                          )}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={"date"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Date</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"status"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Paid">Paid</SelectItem>
                                          <SelectItem value="Partial">Partial</SelectItem>
                                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </Form>
                          )}
                          schema={z.object({
                            date: z.string().min(1),
                            status: z.string().min(1),
                          })}
                          onSaveAction={async (values: any) => {
                            handleUpdateInvoice(invoice.id, values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <InvoiceForm invoiceData={invoice} mode="edit">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </InvoiceForm>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.print()}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Delete Invoice"
                          description={`Are you sure you want to delete invoice ${invoice.id}? This action cannot be undone.`}
                          onConfirm={() => handleDeleteInvoice(invoice.id)}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredInvoices.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
