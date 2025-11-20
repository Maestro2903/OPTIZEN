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
  Printer,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvoiceForm } from "@/components/invoice-form-new"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { BillingPrint } from "@/components/billing-print"
import { InvoiceViewDialog } from "@/components/invoice-view-dialog"
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

const paymentStatusStyles: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  partial: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  unpaid: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  overdue: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const formatInvoiceDate = (dateString?: string | null) => {
  if (!dateString) return "-"
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? "-" : dateFormatter.format(date)
}

const getPatientInitials = (name?: string | null) => {
  if (!name) return "PT"
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
  return initials || "PT"
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

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Create a simple HTML invoice for download
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .patient-info { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .text-right { text-align: right; }
    .summary { margin-left: auto; width: 300px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <h2>${invoice.invoice_number}</h2>
  </div>
  
  <div class="invoice-details">
    <div>
      <strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-GB')}<br>
      ${invoice.due_date ? `<strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-GB')}<br>` : ''}
      <strong>Status:</strong> ${invoice.status.toUpperCase()}<br>
      <strong>Payment Status:</strong> ${invoice.payment_status.toUpperCase()}
    </div>
  </div>
  
  <div class="patient-info">
    <h3>Bill To:</h3>
    <strong>${invoice.patients?.full_name || 'Unknown Patient'}</strong><br>
    ${invoice.patients?.patient_id ? `Patient ID: ${invoice.patients.patient_id}<br>` : ''}
    ${invoice.patients?.mobile ? `Phone: ${invoice.patients.mobile}<br>` : ''}
    ${invoice.patients?.email ? `Email: ${invoice.patients.email}<br>` : ''}
  </div>
  
  ${invoice.items && invoice.items.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Service</th>
        <th>Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.service}</td>
          <td>${item.description || '-'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">₹${item.rate.toLocaleString()}</td>
          <td class="text-right">₹${item.amount.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  <div class="summary">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>₹${invoice.subtotal.toLocaleString()}</span>
    </div>
    ${invoice.discount_amount > 0 ? `
    <div class="summary-row">
      <span>Discount:</span>
      <span>-₹${invoice.discount_amount.toLocaleString()}</span>
    </div>
    ` : ''}
    ${invoice.tax_amount > 0 ? `
    <div class="summary-row">
      <span>Tax (GST):</span>
      <span>₹${invoice.tax_amount.toLocaleString()}</span>
    </div>
    ` : ''}
    <div class="summary-row total">
      <span>Total Amount:</span>
      <span>₹${invoice.total_amount.toLocaleString()}</span>
    </div>
    ${invoice.amount_paid > 0 ? `
    <div class="summary-row">
      <span>Amount Paid:</span>
      <span>₹${invoice.amount_paid.toLocaleString()}</span>
    </div>
    <div class="summary-row">
      <span>Balance Due:</span>
      <span>₹${invoice.balance_due.toLocaleString()}</span>
    </div>
    ` : ''}
  </div>
  
  ${invoice.payment_method ? `
  <div style="margin-top: 30px;">
    <strong>Payment Method:</strong> ${invoice.payment_method}
  </div>
  ` : ''}
  
  ${invoice.notes ? `
  <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 3px solid #333;">
    <strong>Notes:</strong><br>
    ${invoice.notes}
  </div>
  ` : ''}
</body>
</html>
    `

    // Create a blob and download it
    const blob = new Blob([invoiceHtml], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoice_number}.html`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast({
      title: "Invoice Downloaded",
      description: `${invoice.invoice_number} has been downloaded as HTML.`
    })
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
    showExport: false,
    showSettings: true,
  }

  // TODO: CRITICAL - Replace with server-provided aggregate metrics from dedicated API endpoint
  // Current metrics only calculate from current page data (limited to pageSize invoices)
  // This is misleading as it doesn't represent actual total revenue/amounts
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const paidAmount = invoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0)
  const pendingAmount = invoices.reduce((sum, invoice) => sum + invoice.balance_due, 0)

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Billing & Invoices</h1>
            <p className="text-muted-foreground">
              Manage patient billing and invoice records
            </p>
          </div>
          <InvoiceForm onSubmit={handleAddInvoice}>
            <Button className="gap-2 rounded-lg bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700">
              <Receipt className="h-4 w-4" />
              Create Invoice
            </Button>
          </InvoiceForm>
        </div>

        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
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
                <TableRow className="bg-gray-50">
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice No.</TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Patient</TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Paid</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Balance</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Status</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</TableHead>
                  <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs text-gray-700">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={invoice.patients?.avatar_url || undefined} alt={invoice.patients?.full_name || "Patient"} />
                            <AvatarFallback>{getPatientInitials(invoice.patients?.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.patients?.full_name || "Unknown Patient"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {invoice.patients?.patient_id || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatInvoiceDate(invoice.invoice_date)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-sm font-semibold text-gray-900">
                        ₹{invoice.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono tabular-nums text-sm font-medium ${
                          invoice.amount_paid > 0 ? "text-emerald-600" : "text-gray-400"
                        }`}
                      >
                        ₹{invoice.amount_paid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.balance_due > 0 ? (
                          <span className="font-mono tabular-nums text-sm font-medium text-red-600">
                            ₹{invoice.balance_due.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-end gap-1 font-mono text-sm text-gray-400">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Paid
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {invoice.status && invoice.status !== "active" ? (
                          invoice.status === "cancelled" ? (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600 line-through">
                              {invoice.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600">
                              {invoice.status}
                            </span>
                          )
                        ) : null}
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const paymentStyle =
                            paymentStatusStyles[invoice.payment_status] || {
                              bg: "bg-slate-100",
                              text: "text-slate-700",
                              dot: "bg-slate-400",
                            }
                          return (
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentStyle.bg} ${paymentStyle.text}`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${paymentStyle.dot}`}
                              />
                              {invoice.payment_status}
                            </span>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <InvoiceViewDialog invoice={invoice}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              title="View invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </InvoiceViewDialog>
                          <BillingPrint
                            billing={{
                              id: invoice.id,
                              invoice_no: invoice.invoice_number,
                              patient_name: invoice.patients?.full_name || "Unknown Patient",
                              patient_id: invoice.patient_id,
                              date: invoice.invoice_date,
                              total_amount: invoice.total_amount,
                              payment_status: invoice.payment_status,
                              subtotal: invoice.subtotal,
                              tax_amount: invoice.tax_amount,
                              discount_amount: invoice.discount_amount,
                              payment_method: invoice.payment_method,
                              due_date: invoice.due_date,
                              notes: invoice.notes,
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                              title="Print invoice"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </BillingPrint>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                title="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-lg border border-gray-100 shadow-lg">
                              <DropdownMenuLabel className="text-xs uppercase text-gray-400">Invoice Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <InvoiceForm
                                mode="edit"
                                invoiceData={invoice}
                                onSubmit={(data) => handleUpdateInvoice(invoice.id, data)}
                              >
                                <DropdownMenuItem className="cursor-pointer text-gray-700">
                                  <Edit className="h-4 w-4" />
                                  Edit invoice
                                </DropdownMenuItem>
                              </InvoiceForm>
                              <DropdownMenuItem
                                className="cursor-pointer text-gray-700"
                                onSelect={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="h-4 w-4" />
                                Download HTML
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-emerald-600 focus:text-emerald-700"
                                onSelect={() =>
                                  handleUpdateInvoice(invoice.id, { payment_status: "paid", status: "paid" })
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark as paid
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DeleteConfirmDialog
                                title="Delete Invoice"
                                description={`Are you sure you want to delete invoice ${invoice.invoice_number}? This action cannot be undone.`}
                                onConfirm={() => handleDeleteInvoice(invoice.id)}
                              >
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                  Delete invoice
                                </DropdownMenuItem>
                              </DeleteConfirmDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  )
}