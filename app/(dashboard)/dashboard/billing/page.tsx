"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Receipt,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
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
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { invoicesApi, type Invoice, type InvoiceFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

const statusColors = {
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

export default function BillingPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("invoice_date")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

  // API hooks
  const {
    data: invoices,
    loading,
    error,
    pagination,
    search,
    sort,
    filter,
    changePage,
    changePageSize,
    addItem,
    updateItem,
    removeItem,
    refresh
  } = useApiList<Invoice>(invoicesApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createInvoice, loading: createLoading } = useApiForm<Invoice>()
  const { submitForm: updateInvoice, loading: updateLoading } = useApiForm<Invoice>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim())
      } else {
        search("")
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  // Handle page changes
  React.useEffect(() => {
    changePage(currentPage)
  }, [currentPage, changePage])

  React.useEffect(() => {
    changePageSize(pageSize)
  }, [pageSize, changePageSize])

  const handleAddInvoice = async (invoiceData: any) => {
    try {
      // Generate collision-resistant invoice number using timestamp + random suffix
      const invoiceNumber = `INV-${crypto.randomUUID().split('-')[0].toUpperCase()}`

      const result = await createInvoice(
        () => invoicesApi.create({
          invoice_number: invoiceNumber,
          patient_id: invoiceData.patient_id,
          invoice_date: invoiceData.invoice_date || new Date().toISOString().split('T')[0],
          due_date: invoiceData.due_date,
          subtotal: invoiceData.subtotal,
          discount_amount: invoiceData.discount_amount || 0,
          tax_amount: invoiceData.tax_amount || 0,
          total_amount: invoiceData.total_amount,
          amount_paid: invoiceData.amount_paid || 0,
          payment_method: invoiceData.payment_method,
          notes: invoiceData.notes,
          status: 'draft',
          items: invoiceData.items || []
        }),
        {
          successMessage: `Invoice ${invoiceNumber} created successfully.`,
          onSuccess: (newInvoice) => {
            addItem(newInvoice)
          }
        }
      )
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create invoice. Please try again."
      })
    }
  }

  const handleUpdateInvoice = async (invoiceId: string, values: any) => {
    try {
      const result = await updateInvoice(
        () => invoicesApi.update(invoiceId, values),
        {
          successMessage: "Invoice updated successfully.",
          onSuccess: (updatedInvoice) => {
            updateItem(invoiceId, updatedInvoice)
          }
        }
      )
    } catch (error) {
      console.error('Error updating invoice:', error)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId)
    if (!invoice) return

    const success = await deleteItem(
      () => invoicesApi.delete(invoiceId),
      {
        successMessage: `Invoice ${invoice.invoice_number} has been deleted successfully.`,
        onSuccess: () => {
          removeItem(invoiceId)
        }
      }
    )
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: InvoiceFilters = {}

    // Collect all status/payment_status filters
    const statusFilters = filters.filter(f => 
      ["paid", "unpaid", "partial", "overdue"].includes(f)
    )
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "paid", label: "Paid", count: invoices.filter(i => i.payment_status === "paid").length },
      { id: "unpaid", label: "Unpaid", count: invoices.filter(i => i.payment_status === "unpaid").length },
      { id: "partial", label: "Partial", count: invoices.filter(i => i.payment_status === "partial").length },
      { id: "overdue", label: "Overdue", count: invoices.filter(i => i.status === "overdue").length },
    ],
    sortOptions: [
      { id: "invoice_date", label: "Invoice Date" },
      { id: "total_amount", label: "Amount" },
      { id: "status", label: "Status" },
      { id: "due_date", label: "Due Date" },
    ],
    showExport: true,
    showSettings: true,
  }

  // TODO: CRITICAL - Replace with server-provided aggregate metrics from dedicated API endpoint
  // Current metrics only calculate from current page data (limited to pageSize invoices)
  // This is misleading as it doesn't represent actual total revenue/amounts
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const paidAmount = invoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0)
  const pendingAmount = invoices.reduce((sum, invoice) => sum + invoice.balance_due, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">
            Manage patient billing and invoice records
          </p>
        </div>
        <InvoiceForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
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
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">current page only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">current page only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">current page only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">generated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice Records</CardTitle>
              <CardDescription>
                View and manage all patient invoices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search invoices..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>
              <ViewOptions
                config={viewOptionsConfig}
                currentView="list"
                appliedFilters={appliedFilters}
                currentSort={currentSort}
                sortDirection={sortDirection}
                onViewChange={() => {}}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onExport={() => {
                  toast({
                    title: "Export feature",
                    description: "Invoice export functionality coming soon."
                  })
                }}
                onSettings={() => {
                  toast({
                    title: "Settings",
                    description: "Billing settings functionality coming soon."
                  })
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>INVOICE NO.</TableHead>
                  <TableHead>PATIENT</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>PAID</TableHead>
                  <TableHead>BALANCE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>PAYMENT</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell className="font-medium uppercase">{invoice.patients?.full_name || '-'}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>₹{invoice.total_amount.toLocaleString()}</TableCell>
                      <TableCell>₹{invoice.amount_paid.toLocaleString()}</TableCell>
                      <TableCell>₹{invoice.balance_due.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${statusColors[invoice.status as keyof typeof statusColors] || ''}`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${paymentStatusColors[invoice.payment_status as keyof typeof paymentStatusColors] || ''}`}>
                          {invoice.payment_status}
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
                                title: "View Invoice",
                                description: "Invoice detail view coming soon."
                              })
                            }}
                            title="View invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <InvoiceForm>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit invoice">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </InvoiceForm>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              toast({
                                title: "Download Invoice",
                                description: "Invoice download coming soon."
                              })
                            }}
                            title="Download invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (window.confirm(`Mark invoice ${invoice.invoice_number} as paid?`)) {
                                handleUpdateInvoice(invoice.id, { payment_status: 'paid', status: 'paid' })
                              }
                            }}
                            title="Mark as paid"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Delete Invoice"
                            description={`Are you sure you want to delete invoice ${invoice.invoice_number}? This action cannot be undone.`}
                            onConfirm={() => handleDeleteInvoice(invoice.id)}
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
          <Pagination
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 0}
            pageSize={pagination?.limit || 10}
            totalItems={pagination?.total || 0}
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