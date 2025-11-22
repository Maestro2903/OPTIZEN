"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Receipt, Calendar, User, Phone, Mail, CreditCard } from "lucide-react"

interface InvoiceViewDialogProps {
  invoice: {
    id: string
    invoice_number: string
    invoice_date: string
    due_date?: string
    patient_id: string
    patients?: {
      full_name: string
      email?: string
      mobile?: string
      patient_id?: string
    }
    items?: Array<{
      service: string
      description?: string
      quantity: number
      rate: number
      amount: number
    }>
    subtotal: number
    tax_amount: number
    discount_amount: number
    total_amount: number
    amount_paid: number
    balance_due: number
    status: string
    payment_status: string
    payment_method?: string
    notes?: string
  }
  children: React.ReactNode
}

export function InvoiceViewDialog({ invoice, children }: InvoiceViewDialogProps) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>
            View complete invoice information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <div>
              <h3 className="text-2xl font-bold mb-1">{invoice.invoice_number}</h3>
              <div className="flex gap-2 mb-3">
                <Badge 
                  variant="secondary" 
                  className={`capitalize ${statusColors[invoice.status as keyof typeof statusColors] || ''}`}
                >
                  {invoice.status}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`capitalize ${paymentStatusColors[invoice.payment_status as keyof typeof paymentStatusColors] || ''}`}
                >
                  {invoice.payment_status}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Invoice Date: {formatDate(invoice.invoice_date)}</span>
                </div>
                {invoice.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due Date: {formatDate(invoice.due_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</div>
              </div>
              {invoice.amount_paid > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Amount Paid</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(invoice.amount_paid)}</div>
                </div>
              )}
              {invoice.balance_due > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Balance Due</div>
                  <div className="text-lg font-semibold text-red-600">{formatCurrency(invoice.balance_due)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information */}
          {invoice.patients && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Patient Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{invoice.patients.full_name}</div>
                    <div className="text-xs text-muted-foreground">{invoice.patients.patient_id || 'N/A'}</div>
                  </div>
                </div>
                {invoice.patients.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{invoice.patients.mobile}</span>
                  </div>
                )}
                {invoice.patients.email && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{invoice.patients.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Invoice Items */}
          {invoice.items && invoice.items.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">Invoice Items</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.service}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No items in this invoice
            </div>
          )}

          <Separator />

          {/* Amount Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-green-600">- {formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (GST)</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total Amount</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Payment Information */}
          {invoice.payment_method && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Payment Information</h4>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Payment Method:</span>
                  <span>{invoice.payment_method}</span>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
