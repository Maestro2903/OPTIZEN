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
          documentTitle="Medical Prescription"
        >
          <div className="print-prescription">
            {/* Prescription Header with Large Rx Symbol */}
            <div className="print-prescription-header">
              <div className="print-rx-symbol">℞</div>
              <div>
                <div className="print-prescription-number">
                  Prescription #{pharmacy.prescription_no || pharmacy.id}
                </div>
                <div style={{ fontSize: '10pt', marginTop: '4pt' }}>
                  Date: {formatDate(pharmacy.date)}
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div style={{ marginBottom: '12pt', fontSize: '11pt' }}>
              <div style={{ marginBottom: '6pt' }}>
                <div className="print-label" style={{ fontSize: '9pt' }}>Patient Name</div>
                <div style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {pharmacy.patient_name}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Patient ID</div>
                  <div style={{ fontSize: '11pt' }}>{pharmacy.patient_id || '-'}</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Prescribing Doctor</div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                    {pharmacy.doctor_name || 'Dr. [Doctor Name]'}
                  </div>
                </div>
              </div>
            </div>

            {/* Medications - Traditional Prescription Format */}
            <PrintSection title="Prescribed Medications">
              {prescriptionItems.map((item, index) => (
                <div key={index} className="print-medication-item">
                  <div className="print-medication-name">
                    {index + 1}. {item.medicine_name}
                  </div>
                  <div className="print-medication-details">
                    <div style={{ marginBottom: '2pt' }}>
                      <strong>Dosage/Strength:</strong> {item.dosage}
                    </div>
                    <div style={{ marginBottom: '2pt' }}>
                      <strong>Quantity:</strong> {item.quantity}
                    </div>
                    <div className="print-sig">
                      <strong>Sig:</strong> {item.instructions}
                    </div>
                    {item.price && (
                      <div style={{ marginTop: '4pt', textAlign: 'right', fontSize: '10pt' }}>
                        Price: {formatCurrency(item.price)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </PrintSection>

            {/* Total Amount */}
            <div style={{ 
              marginTop: '15pt', 
              padding: '10pt', 
              borderTop: '2px solid #000',
              textAlign: 'right',
              fontSize: '14pt',
              fontWeight: 'bold'
            }}>
              Total Amount: {formatCurrency(totalAmount)}
            </div>

            {/* Payment Information */}
            <PrintSection title="Payment Information">
              <PrintRow>
                <PrintCol>
                  <PrintField label="Payment Method" value={pharmacy.payment_method || 'Cash'} />
                  <PrintField label="Payment Status" value={getPaymentStatusDisplay(pharmacy.payment_status)} uppercase />
                </PrintCol>
                <PrintCol>
                  <PrintField label="Transaction Date" value={formatDate(pharmacy.date)} />
                  <PrintField label="Pharmacy Location" value={pharmacy.pharmacy_location || 'Main Pharmacy'} />
                </PrintCol>
              </PrintRow>
            </PrintSection>

            {/* Special Instructions */}
            {pharmacy.notes && (
              <PrintSection title="Special Instructions">
                <div style={{ fontSize: '11pt', lineHeight: '1.5' }}>{pharmacy.notes}</div>
              </PrintSection>
            )}

            {/* Pharmacist Stamp */}
            <div className="print-pharmacist-stamp">
              <div style={{ marginBottom: '8pt', fontSize: '11pt', fontWeight: 'bold' }}>
                Dispensed By:
              </div>
              <div style={{ fontSize: '11pt', marginBottom: '4pt' }}>
                {pharmacy.pharmacist_name || 'Registered Pharmacist'}
              </div>
              <div style={{ fontSize: '9pt', marginBottom: '4pt' }}>
                B.Pharm, Registered Pharmacist
              </div>
              <div style={{ fontSize: '9pt', marginBottom: '4pt' }}>
                License: PH/12345/2020
              </div>
              <div style={{ fontSize: '9pt', marginTop: '8pt' }}>
                Date: {formatDate(pharmacy.date)}
              </div>
            </div>

            {/* Doctor Signature */}
            <PrintSignature 
              doctorName={pharmacy.doctor_name || 'Prescribing Doctor'}
              qualification="MBBS, MS (Ophthalmology)"
              registrationNumber="REG/12345/2020"
              date={formatDate(pharmacy.date)}
            />
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}