"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintFooter } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"

interface BillingPrintProps {
  billing: {
    id: string
    invoice_no?: string
    patient_name: string
    patient_id?: string
    date: string
    items?: Array<{
      service?: string
      description?: string
      quantity: number
      rate: number
      amount: number
    }>
    subtotal?: number
    tax_amount?: number
    discount_amount?: number
    total_amount: number
    payment_method?: string
    payment_status: string
    due_date?: string
    notes?: string
    contact_number?: string
    address?: string
    gst_number?: string
  }
  children: React.ReactNode
}

export function BillingPrint({ billing, children }: BillingPrintProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getPaymentStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'paid': 'PAID',
      'pending': 'PENDING',
      'unpaid': 'UNPAID',
      'overdue': 'OVERDUE',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'partial': 'PARTIALLY PAID'
    }
    return statusMap[status.toLowerCase()] || status.toUpperCase()
  }

  const isPaid = billing.payment_status?.toLowerCase() === 'paid'

  // Process items - handle both service/description formats
  const invoiceItems = billing.items || []
  const calculatedSubtotal = billing.subtotal || invoiceItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = billing.tax_amount || 0
  const discountAmount = billing.discount_amount || 0
  const finalTotal = billing.total_amount || (calculatedSubtotal + taxAmount - discountAmount)

  const invoiceTitle = `Invoice_${billing.invoice_no || billing.id}`

  const modalContent = (
    <PrintModalShell
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={invoiceTitle}
    >
      {/* Header */}
      <PrintHeader />
      
      {/* Document Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide">TAX INVOICE</h1>
      </div>

      <div className="space-y-6">
        {/* Invoice Meta-Data (Top Right) */}
        <div className="flex justify-end mb-6">
          <div className="text-right space-y-2">
            <div className="text-2xl font-bold">
              Invoice #{billing.invoice_no || billing.id}
            </div>
            <div className="text-sm text-gray-700">
              Date: {formatDate(billing.date)}
            </div>
            {billing.due_date && (
              <div className="text-sm text-gray-700">
                Due Date: {formatDate(billing.due_date)}
              </div>
            )}
            {/* Status Stamp */}
            <div className="mt-3">
              <div
                className={`inline-block px-4 py-2 border-2 font-bold text-sm uppercase ${
                  isPaid
                    ? 'border-green-600 text-green-700 bg-green-50'
                    : 'border-red-600 text-red-700 bg-red-50'
                }`}
              >
                {getPaymentStatusDisplay(billing.payment_status)}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <PrintSection title="BILL TO">
          <div className="space-y-1">
            <div className="font-bold text-base uppercase">
              {billing.patient_name}
            </div>
            {billing.patient_id && (
              <div className="text-xs text-gray-600">
                Patient ID: {billing.patient_id}
              </div>
            )}
            {billing.address && (
              <div className="text-xs text-gray-600">
                {billing.address}
              </div>
            )}
            {billing.contact_number && (
              <div className="text-xs text-gray-600">
                Contact: {billing.contact_number}
              </div>
            )}
          </div>
        </PrintSection>

        {/* Line Items Table */}
        <div className="mt-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-black">
                <th className="py-2 px-3 text-left text-xs font-bold uppercase">Item Description</th>
                <th className="py-2 px-3 text-center text-xs font-bold uppercase w-16">Qty</th>
                <th className="py-2 px-3 text-right text-xs font-bold uppercase w-24">Rate</th>
                <th className="py-2 px-3 text-right text-xs font-bold uppercase w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.length > 0 ? (
                invoiceItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <div className="font-medium">
                        {item.service || item.description || 'Service'}
                      </div>
                      {item.service && item.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold tabular-nums">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 text-sm">
                    No items in this invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Stack (Bottom Right) */}
        <div className="flex justify-end mt-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-right tabular-nums font-medium">
                {formatCurrency(calculatedSubtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Discount:</span>
                <span className="text-right tabular-nums font-medium text-red-600">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Tax (GST):</span>
                <span className="text-right tabular-nums font-medium">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
            )}
            <div className="border-t-2 border-black pt-2 mt-2 bg-gray-50 -mx-2 px-2 py-2">
              <div className="flex justify-between">
                <span className="text-lg font-black">Total Due:</span>
                <span className="text-xl font-black text-right tabular-nums">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Terms */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Side: Payment Info / Bank Details / Terms */}
            <div className="space-y-3 text-xs text-gray-700">
              {billing.gst_number && (
                <div>
                  <strong>GST Number:</strong> {billing.gst_number}
                </div>
              )}
              <div>
                <strong>Payment Terms:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>
                    Payment is due within{' '}
                    {billing.due_date ? formatDate(billing.due_date) : '7 days'} of invoice date
                  </li>
                  <li>Late payments may incur additional charges</li>
                  <li>For payment inquiries, contact the billing department</li>
                </ul>
              </div>
              {billing.notes && (
                <div className="mt-2">
                  <strong>Notes:</strong>
                  <div className="mt-1 whitespace-pre-wrap">{billing.notes}</div>
                </div>
              )}
            </div>

            {/* Right Side: Authorized Signatory */}
            <div className="text-right">
              <div className="inline-block text-left">
                <div className="h-16 border-b border-black mb-2"></div>
                <div className="font-bold text-sm">Authorized Signatory</div>
                <div className="text-xs text-gray-600 mt-1">Billing Department</div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Footer with Timestamp */}
        <PrintFooter showTimestamp={true} />
      </div>
    </PrintModalShell>
  )

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}