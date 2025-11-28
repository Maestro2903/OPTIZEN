"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintFooter } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"
import type { ReactNode } from "react"

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
      {/* Main Container: Full Height Flex Layout */}
      <div className="flex flex-col min-h-[250mm] justify-between">
        {/* Header */}
        <PrintHeader />
        
        {/* Document Title */}
        <div className="text-center mb-2 -mt-4">
          <h1 className="text-xl font-bold uppercase tracking-wide">TAX INVOICE</h1>
        </div>

        <div className="space-y-3 flex-1">
        {/* Invoice Meta-Data (Top Right) - Compact */}
        <div className="flex justify-end mb-2">
          <div className="text-right space-y-0">
            <div className="text-base font-bold">
              Invoice #{billing.invoice_no || billing.id}
            </div>
            <div className="text-[11px] text-gray-700">
              Date: {formatDate(billing.date)}
            </div>
            {billing.due_date && (
              <div className="text-[11px] text-gray-700">
                Due Date: {formatDate(billing.due_date)}
              </div>
            )}
            {/* Status Stamp - Compact */}
            <div className="mt-1">
              <div
                className={`inline-block px-3 py-1 border-2 font-bold text-xs uppercase ${
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

        {/* Bill To Section - Compact */}
        <div className="my-8">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-1">Bill To</h3>
          <div className="space-y-0.5">
            <div className="font-bold text-sm uppercase">
              {billing.patient_name}
            </div>
            {billing.address && (
              <div className="text-[11px] text-gray-600">
                {billing.address}
              </div>
            )}
            {billing.contact_number && (
              <div className="text-[11px] text-gray-600">
                Contact: {billing.contact_number}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table - Increased Breathing Room */}
        <div className="my-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y border-black">
                <th className="py-3 px-2 text-left text-[11px] font-bold uppercase">Item Description</th>
                <th className="py-3 px-2 text-center text-[11px] font-bold uppercase w-12">Qty</th>
                <th className="py-3 px-2 text-right text-[11px] font-bold uppercase w-20">Rate</th>
                <th className="py-3 px-2 text-right text-[11px] font-bold uppercase w-20">Amount</th>
              </tr>
            </thead>
            <tbody className="min-h-[300px]">
              {invoiceItems.length > 0 ? (
                invoiceItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-5 px-2">
                      <div className="font-medium text-[11px]">
                        {item.service || item.description || 'Service'}
                      </div>
                      {item.service && item.description && (
                        <div className="text-[10px] text-gray-600">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-2 text-center tabular-nums text-[11px]">
                      {item.quantity}
                    </td>
                    <td className="py-5 px-2 text-right tabular-nums text-[11px]">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-5 px-2 text-right font-bold tabular-nums text-[11px]">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 text-[11px]">
                    No items in this invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Stack (Bottom Right) - Expanded Spacing */}
        <div className="flex justify-end my-8">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-right tabular-nums font-medium">
                {formatCurrency(calculatedSubtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-700">Discount:</span>
                <span className="text-right tabular-nums font-medium text-red-600">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-700">Tax (GST):</span>
                <span className="text-right tabular-nums font-medium">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
            )}
            <div className="border-t-2 border-black pt-4 mt-6 bg-gray-50 -mx-2 px-2 py-4">
              <div className="flex justify-between">
                <span className="text-lg font-black">Total Due:</span>
                <span className="text-2xl font-black text-right tabular-nums">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Terms - Anchored to Bottom with mt-auto */}
        <div className="mt-auto pt-2 border-t border-gray-200 flex justify-between items-end gap-4">
          {/* Left (60%): Payment Terms & Bank Details - Visually Distinct Box */}
          <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="space-y-2 text-[10px] text-gray-700">
              {billing.gst_number && (
                <div>
                  <strong>GST Number:</strong> {billing.gst_number}
                </div>
              )}
              <div>
                <strong>Payment Terms:</strong>
                <ul className="list-disc list-inside text-[10px] space-y-0.5 ml-2">
                  <li>Due within {billing.due_date ? formatDate(billing.due_date) : '7 days'}</li>
                  <li>Late payments incur charges</li>
                  <li>Contact billing for inquiries</li>
                </ul>
              </div>
              {billing.notes && (
                <div>
                  <strong>Notes:</strong>
                  <div className="text-[10px] whitespace-pre-wrap">{billing.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Right (30%): Authorized Signatory */}
          <div className="text-center flex-shrink-0">
            <div className="h-10 border-b border-black mb-1 w-28"></div>
            <div className="font-bold text-[10px]">Authorized Signatory</div>
            <div className="text-[9px] text-gray-600">Billing Dept</div>
          </div>
        </div>

        {/* Print Footer with Timestamp */}
        <PrintFooter showTimestamp={true} />
        </div>
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