"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface PharmacyPrintProps {
  pharmacy: {
    id: string
    prescription_no?: string
    patient_name: string
    patient_id?: string
    doctor_name?: string
    date: string
    items?: Array<{
      medicine_name: string
      dosage: string
      quantity: number
      instructions: string
      price?: number
    }>
    total_amount?: number
    payment_status?: string
    payment_method?: string
    notes?: string
    pharmacy_location?: string
    pharmacist_name?: string
    contact_number?: string
  }
  children: React.ReactNode
}

export function PharmacyPrint({ pharmacy, children }: PharmacyPrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'TBD'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  // Sample items if none provided
  const defaultItems = [
    { medicine_name: 'Ciprofloxacin Eye Drops', dosage: '0.3%', quantity: 1, instructions: '2 drops twice daily', price: 85 },
    { medicine_name: 'Lubricating Eye Drops', dosage: '10ml', quantity: 2, instructions: 'As needed for dryness', price: 120 },
    { medicine_name: 'Anti-inflammatory Drops', dosage: '5ml', quantity: 1, instructions: '1 drop three times daily', price: 150 }
  ]

  const prescriptionItems = pharmacy.items || defaultItems
  const totalAmount = pharmacy.total_amount || prescriptionItems.reduce((sum, item) => sum + (item.price || 0), 0)

  const getPaymentStatusDisplay = (status?: string) => {
    if (!status) return 'PENDING'
    const statusMap: { [key: string]: string } = {
      'paid': 'PAID',
      'pending': 'PENDING',
      'partial': 'PARTIALLY PAID',
      'refunded': 'REFUNDED'
    }
    return statusMap[status] || status.toUpperCase()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Prescription"
          documentTitle="Pharmacy Prescription Receipt"
        >
          {/* Prescription Header */}
          <PrintSection title="Prescription Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Prescription No." value={pharmacy.prescription_no || pharmacy.id} uppercase />
                <PrintField label="Date Issued" value={formatDate(pharmacy.date)} />
                <PrintField label="Payment Status" value={getPaymentStatusDisplay(pharmacy.payment_status)} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="Pharmacy Location" value={pharmacy.pharmacy_location || 'Main Pharmacy'} />
                <PrintField label="Pharmacist" value={pharmacy.pharmacist_name || 'Registered Pharmacist'} />
                <PrintField label="Contact" value={pharmacy.contact_number || '+91 98765 43210'} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Patient & Doctor Information */}
          <PrintSection title="Patient & Prescriber Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Patient Name" value={pharmacy.patient_name} uppercase />
                <PrintField label="Patient ID" value={pharmacy.patient_id} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Prescribing Doctor" value={pharmacy.doctor_name || 'Dr. [Doctor Name]'} />
                <PrintField label="Prescription Date" value={formatDate(pharmacy.date)} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Prescription Details */}
          <PrintSection title="Prescribed Medications" className="print-prescription">
            <div className="print-rx-header">℞ PRESCRIPTION DETAILS</div>

            <table className="print-table" style={{ width: '100%', marginTop: '10pt' }}>
              <thead>
                <tr>
                  <th style={{ width: '5%', textAlign: 'center' }}>S.No</th>
                  <th style={{ width: '30%' }}>Medicine Name</th>
                  <th style={{ width: '15%' }}>Dosage/Strength</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '25%' }}>Instructions</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {prescriptionItems.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td><strong>{item.medicine_name}</strong></td>
                    <td>{item.dosage}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ fontSize: '10pt' }}>{item.instructions}</td>
                    <td style={{ textAlign: 'right' }}>{item.price ? item.price.toFixed(2) : '-'}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #000', fontWeight: 'bold' }}>
                  <td colSpan={5} style={{ textAlign: 'right', padding: '10pt' }}>
                    <strong>TOTAL AMOUNT:</strong>
                  </td>
                  <td style={{ textAlign: 'right', padding: '10pt', fontSize: '14pt' }}>
                    <strong>{formatCurrency(totalAmount)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </PrintSection>

          {/* Payment Information */}
          <PrintSection title="Payment Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Total Amount" value={formatCurrency(totalAmount)} />
                <PrintField label="Payment Method" value={pharmacy.payment_method || 'Cash'} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Payment Status" value={getPaymentStatusDisplay(pharmacy.payment_status)} uppercase />
                <PrintField label="Transaction Date" value={formatDate(pharmacy.date)} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Important Instructions */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              IMPORTANT MEDICATION INSTRUCTIONS
            </h4>
            <ul style={{ fontSize: '11pt', lineHeight: '1.4', paddingLeft: '20pt' }}>
              <li><strong>Take medications exactly as prescribed by your doctor</strong></li>
              <li>Complete the full course even if you feel better</li>
              <li>Store medications in a cool, dry place away from direct sunlight</li>
              <li>Keep medications out of reach of children</li>
              <li>Do not share medications with others</li>
              <li>Check expiry dates before use</li>
              <li>Report any allergic reactions or side effects to your doctor immediately</li>
              <li>Do not stop medications abruptly without consulting your doctor</li>
            </ul>
          </div>

          {/* Special Notes */}
          {pharmacy.notes && (
            <PrintSection title="Special Instructions">
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Pharmacist Notes" value={pharmacy.notes} />
                </PrintCol>
              </PrintRow>
            </PrintSection>
          )}

          {/* Drug Interaction Warning */}
          <div style={{ marginTop: '20pt', padding: '15pt', border: '2px solid #ff8c00', backgroundColor: '#fff8dc' }}>
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt', color: '#ff8c00', textAlign: 'center' }}>
              ⚠️ DRUG INTERACTION ADVISORY
            </h4>
            <div style={{ fontSize: '11pt', lineHeight: '1.3', textAlign: 'center' }}>
              <strong>Always inform your healthcare providers about:</strong><br />
              • All medications you are currently taking<br />
              • Any allergies to medications<br />
              • Any supplements or herbal remedies<br />
              <strong>Contact pharmacy immediately if you experience unusual symptoms</strong>
            </div>
          </div>

          {/* Contact for Queries */}
          <div style={{ marginTop: '15pt', padding: '10pt', border: '1px solid #000', backgroundColor: '#f0f8ff' }}>
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt', textAlign: 'center' }}>
              PHARMACY CONTACT INFORMATION
            </h4>
            <div style={{ fontSize: '11pt', lineHeight: '1.3', textAlign: 'center' }}>
              <strong>Pharmacy Direct:</strong> {pharmacy.contact_number || '+91 98765 43210'}<br />
              <strong>Emergency Line:</strong> +91 98765 43211 (24/7)<br />
              <strong>Location:</strong> {pharmacy.pharmacy_location || 'Main Pharmacy, Ground Floor'}<br />
              <strong>Operating Hours:</strong> 8:00 AM - 10:00 PM (Mon-Sun)
            </div>
          </div>

          {/* Pharmacist Signature */}
          <div className="print-signature-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40pt' }}>
              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>{pharmacy.pharmacist_name || 'Registered Pharmacist'}</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>B.Pharm, Registered Pharmacist</div>
                <div style={{ fontSize: '10pt' }}>License: PH/12345/2020</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(pharmacy.date)}</div>
              </div>

              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>Quality Assurance</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>Pharmacy Department</div>
                <div style={{ fontSize: '10pt' }}>Verified & Dispensed</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(pharmacy.date)}</div>
              </div>
            </div>
          </div>

          {/* Prescription Footer */}
          <div style={{ marginTop: '40pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>PRESCRIPTION RECEIPT</strong><br />
              Prescription No: {pharmacy.prescription_no || pharmacy.id} | Date: {formatDate(pharmacy.date)} | Amount: {formatCurrency(totalAmount)}<br />
              Keep this receipt for warranty claims and medication queries. Valid for 30 days from issue date.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}