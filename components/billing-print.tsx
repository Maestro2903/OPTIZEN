"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface BillingPrintProps {
  billing: {
    id: string
    invoice_no?: string
    patient_name: string
    patient_id?: string
    date: string
    items?: Array<{
      description: string
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
      'overdue': 'OVERDUE',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'partial': 'PARTIALLY PAID'
    }
    return statusMap[status] || status.toUpperCase()
  }

  // Sample items if none provided
  const defaultItems = [
    { description: 'Consultation Fee', quantity: 1, rate: 500, amount: 500 },
    { description: 'Eye Examination', quantity: 1, rate: 300, amount: 300 },
    { description: 'Prescription Glasses', quantity: 1, rate: 2000, amount: 2000 }
  ]

  const invoiceItems = billing.items || defaultItems
  const calculatedSubtotal = billing.subtotal || invoiceItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = billing.tax_amount || (calculatedSubtotal * 0.18) // 18% GST
  const discountAmount = billing.discount_amount || 0
  const finalTotal = billing.total_amount || (calculatedSubtotal + taxAmount - discountAmount)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Invoice"
          documentTitle="Medical Services Invoice"
        >
          <div className="print-invoice">
            {/* Invoice Header - Professional Format */}
            <div className="print-invoice-header">
              <div>
                <div className="print-invoice-number-large">
                  INVOICE #{billing.invoice_no || billing.id}
                </div>
                <div style={{ fontSize: '10pt', marginTop: '4pt' }}>
                  Date: {formatDate(billing.date)}
                </div>
                {billing.due_date && (
                  <div style={{ fontSize: '10pt', marginTop: '2pt' }}>
                    Due Date: {formatDate(billing.due_date)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '4pt' }}>
                  Payment Status
                </div>
                <div style={{ 
                  fontSize: '12pt', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase',
                  padding: '4pt 12pt',
                  border: '2px solid #000',
                  display: 'inline-block'
                }}>
                  {getPaymentStatusDisplay(billing.payment_status)}
                </div>
              </div>
            </div>

            {/* Bill-to Section */}
            <div className="print-bill-to">
              <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6pt', textTransform: 'uppercase' }}>Bill To:</div>
              <div style={{ fontSize: '11pt', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4pt' }}>{billing.patient_name}</div>
                {billing.patient_id && <div>Patient ID: {billing.patient_id}</div>}
                {billing.contact_number && <div>Contact: {billing.contact_number}</div>}
                {billing.address && <div>{billing.address}</div>}
              </div>
            </div>

            {/* Service Details - Itemized Table */}
            <PrintSection title="Service Details">
              <table className="print-invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>S.No</th>
                    <th style={{ width: '50%' }}>Description</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ width: '20%', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={index}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>{item.description}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PrintSection>

            {/* Billing Summary - Prominent Totals */}
            <div className="print-invoice-summary">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6pt', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                      <strong>Subtotal:</strong>
                    </td>
                    <td style={{ padding: '6pt', textAlign: 'right', borderBottom: '1px solid #ccc', width: '40%' }}>
                      {formatCurrency(calculatedSubtotal)}
                    </td>
                  </tr>
                  {discountAmount > 0 && (
                    <tr>
                      <td style={{ padding: '6pt', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                        <strong>Discount:</strong>
                      </td>
                      <td style={{ padding: '6pt', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                        -{formatCurrency(discountAmount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '6pt', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                      <strong>GST (18%):</strong>
                    </td>
                    <td style={{ padding: '6pt', textAlign: 'right', borderBottom: '1px solid #ccc' }}>
                      {formatCurrency(taxAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="print-invoice-total" style={{ padding: '10pt', textAlign: 'right' }}>
                      <strong>TOTAL AMOUNT:</strong>
                    </td>
                    <td className="print-invoice-total" style={{ padding: '10pt', textAlign: 'right' }}>
                      <strong style={{ fontSize: '16pt' }}>{formatCurrency(finalTotal)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Information */}
            <PrintSection title="Payment Information">
              <PrintRow>
                <PrintCol>
                  <PrintField label="Payment Method" value={billing.payment_method || 'Cash'} />
                  <PrintField label="Payment Status" value={getPaymentStatusDisplay(billing.payment_status)} uppercase />
                </PrintCol>
                <PrintCol>
                  <PrintField label="Transaction Date" value={formatDate(billing.date)} />
                  {billing.payment_status === 'pending' && billing.due_date && (
                    <PrintField label="Due Date" value={formatDate(billing.due_date)} />
                  )}
                </PrintCol>
              </PrintRow>
            </PrintSection>

            {/* Payment Terms */}
            <div className="print-payment-terms">
              <div style={{ fontWeight: 'bold', marginBottom: '4pt' }}>Payment Terms:</div>
              <div style={{ marginBottom: '4pt' }}>
                • Payment is due within {billing.due_date ? formatDate(billing.due_date) : '7 days'} of invoice date
              </div>
              <div style={{ marginBottom: '4pt' }}>
                • Late payments may incur additional charges
              </div>
              <div>
                • For payment inquiries, contact the billing department
              </div>
            </div>

            {/* Footer - GST Number and Signature */}
            <div style={{ marginTop: '20pt', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '9pt' }}>
                <div><strong>GST Number:</strong> {billing.gst_number || 'GSTIN123456789'}</div>
                <div style={{ marginTop: '4pt' }}>This is a computer-generated invoice</div>
              </div>
              <PrintSignature 
                doctorName="Authorized Signatory"
                qualification="Billing Department"
                registrationNumber=""
                date={formatDate(billing.date)}
              />
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}