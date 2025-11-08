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
          {/* Invoice Header */}
          <PrintSection title="Invoice Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Invoice No." value={billing.invoice_no || billing.id} uppercase />
                <PrintField label="Invoice Date" value={formatDate(billing.date)} />
                <PrintField label="Payment Status" value={getPaymentStatusDisplay(billing.payment_status)} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="Due Date" value={billing.due_date ? formatDate(billing.due_date) : 'Immediate'} />
                <PrintField label="Payment Method" value={billing.payment_method || 'Cash'} />
                <PrintField label="GST Number" value={billing.gst_number || 'GSTIN123456789'} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Patient/Bill-to Information */}
          <PrintSection title="Bill To">
            <PrintRow>
              <PrintCol>
                <PrintField label="Patient Name" value={billing.patient_name} uppercase />
                <PrintField label="Patient ID" value={billing.patient_id} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Contact Number" value={billing.contact_number} />
                <PrintField label="Address" value={billing.address} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Invoice Items Table */}
          <PrintSection title="Service Details">
            <table className="print-table" style={{ width: '100%', marginBottom: '15pt' }}>
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
                    <td style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintSection>

          {/* Billing Summary */}
          <PrintSection title="Billing Summary">
            <div style={{ float: 'right', width: '300pt', border: '1px solid #000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8pt', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                      <strong>Subtotal:</strong>
                    </td>
                    <td style={{ padding: '8pt', borderBottom: '1px solid #ccc', textAlign: 'right' }}>
                      {formatCurrency(calculatedSubtotal)}
                    </td>
                  </tr>
                  {discountAmount > 0 && (
                    <tr>
                      <td style={{ padding: '8pt', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                        <strong>Discount:</strong>
                      </td>
                      <td style={{ padding: '8pt', borderBottom: '1px solid #ccc', textAlign: 'right' }}>
                        -{formatCurrency(discountAmount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '8pt', borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                      <strong>GST (18%):</strong>
                    </td>
                    <td style={{ padding: '8pt', borderBottom: '1px solid #ccc', textAlign: 'right' }}>
                      {formatCurrency(taxAmount)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', fontSize: '14pt' }}>
                    <td style={{ padding: '12pt', textAlign: 'left' }}>
                      <strong>TOTAL AMOUNT:</strong>
                    </td>
                    <td style={{ padding: '12pt', textAlign: 'right' }}>
                      {formatCurrency(finalTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ clear: 'both' }}></div>
          </PrintSection>

          {/* Amount in Words */}
          <div style={{ margin: '20pt 0', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <strong>Amount in Words:</strong><br />
            <em>Rupees {finalTotal.toFixed(0)} Only</em>
          </div>

          {/* Payment Information */}
          {billing.payment_method && (
            <PrintSection title="Payment Information">
              <PrintRow>
                <PrintCol>
                  <PrintField label="Payment Method" value={billing.payment_method} />
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
          )}

          {/* Terms and Conditions */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              TERMS AND CONDITIONS
            </h4>
            <ul style={{ fontSize: '10pt', lineHeight: '1.3', paddingLeft: '20pt' }}>
              <li>Payment is due within 30 days of invoice date unless otherwise specified</li>
              <li>Late payment charges may apply after due date</li>
              <li>All services are subject to applicable taxes</li>
              <li>Please quote invoice number in all correspondence</li>
              <li>For any queries, contact our billing department</li>
              <li>Thank you for choosing our medical services</li>
            </ul>
          </div>

          {/* Bank Details for Payment */}
          <div style={{ marginTop: '20pt', padding: '10pt', border: '1px solid #000', backgroundColor: '#f0f8ff' }}>
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt' }}>
              BANK DETAILS FOR PAYMENT
            </h4>
            <div style={{ fontSize: '10pt', lineHeight: '1.3' }}>
              <strong>Account Name:</strong> EyeCare Medical Center<br />
              <strong>Bank Name:</strong> State Bank of India<br />
              <strong>Account Number:</strong> 1234567890<br />
              <strong>IFSC Code:</strong> SBIN0001234<br />
              <strong>UPI ID:</strong> eyecare@sbi
            </div>
          </div>

          {/* Authorized Signature */}
          <div className="print-signature-section">
            <div style={{ float: 'right', width: '200pt', textAlign: 'center', marginTop: '30pt' }}>
              <div style={{ height: '30pt' }}></div>
              <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                <strong>Authorized Signature</strong>
              </div>
              <div style={{ fontSize: '10pt' }}>EyeCare Medical Center</div>
              <div style={{ fontSize: '10pt' }}>Date: {formatDate(billing.date)}</div>
            </div>
            <div style={{ clear: 'both' }}></div>
          </div>

          {/* Invoice Footer */}
          <div style={{ marginTop: '40pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>INVOICE VERIFICATION</strong><br />
              Invoice No: {billing.invoice_no || billing.id} | Date: {formatDate(billing.date)} | Amount: {formatCurrency(finalTotal)}<br />
              This is a computer-generated invoice. For payment queries, contact our billing department.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}