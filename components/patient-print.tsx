"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface PatientPrintProps {
  patient: {
    id: string
    patient_id: string
    full_name: string
    date_of_birth?: string
    email?: string
    mobile: string
    gender: string
    country?: string
    state?: string
    address?: string
    city?: string
    postal_code?: string
    emergency_contact?: string
    emergency_phone?: string
    medical_history?: string
    current_medications?: string
    allergies?: string
    insurance_provider?: string
    insurance_number?: string
    status: string
    created_at: string
  }
  children: React.ReactNode
}

export function PatientPrint({ patient, children }: PatientPrintProps) {
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birth = new Date(dateOfBirth)
    if (isNaN(birth.getTime())) return null
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Patient Record"
          documentTitle="Medical Record Card"
        >
          {/* Medical Record Card Container */}
          <div className="print-medical-card">
            {/* Photo Placeholder and Header */}
            <div style={{ overflow: 'hidden', marginBottom: '10pt' }}>
              <div className="print-photo-placeholder">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10pt', marginBottom: '4pt' }}>PHOTO</div>
                  <div style={{ fontSize: '8pt', color: '#999' }}>80x100pt</div>
                </div>
              </div>
              <div style={{ marginLeft: '92pt' }}>
                <div className="print-patient-id-large">
                  PATIENT ID: {patient.patient_id}
                </div>
                <div style={{ fontSize: '10pt', marginBottom: '6pt' }}>
                  Registration Date: {formatDate(patient.created_at)}
                </div>
              </div>
            </div>

            {/* Demographics - Compact Grid */}
            <div className="print-compact-grid" style={{ clear: 'both', marginTop: '8pt' }}>
              <div>
                <div className="print-label">Full Name</div>
                <div className="print-value uppercase" style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                  {patient.full_name}
                </div>
              </div>
              <div>
                <div className="print-label">Gender</div>
                <div className="print-value uppercase">{patient.gender}</div>
              </div>
              <div>
                <div className="print-label">Date of Birth</div>
                <div className="print-value">
                  {patient.date_of_birth ? formatDate(patient.date_of_birth) : '-'}
                </div>
              </div>
              <div>
                <div className="print-label">Age</div>
                <div className="print-value">
                  {calculateAge(patient.date_of_birth) ? `${calculateAge(patient.date_of_birth)} years` : '-'}
                </div>
              </div>
            </div>

            {/* Contact Information - Single Row */}
            <div style={{ marginTop: '10pt', borderTop: '1px solid #ddd', paddingTop: '8pt' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8pt', fontSize: '9pt' }}>
                <div>
                  <div className="print-label">Mobile</div>
                  <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto' }}>{patient.mobile}</div>
                </div>
                <div>
                  <div className="print-label">Email</div>
                  <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto' }}>{patient.email || '-'}</div>
                </div>
                <div>
                  <div className="print-label">Status</div>
                  <div className="print-value uppercase" style={{ borderBottom: 'none', minHeight: 'auto', fontWeight: 'bold' }}>
                    {patient.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            {patient.address && (
              <div style={{ marginTop: '8pt', fontSize: '9pt' }}>
                <div className="print-label">Address</div>
                <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto' }}>
                  {patient.address}
                  {patient.city && `, ${patient.city}`}
                  {patient.state && `, ${patient.state}`}
                  {patient.postal_code && ` - ${patient.postal_code}`}
                  {patient.country && `, ${patient.country}`}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {(patient.emergency_contact || patient.emergency_phone) && (
              <div style={{ marginTop: '8pt', fontSize: '9pt' }}>
                <div className="print-label">Emergency Contact</div>
                <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto' }}>
                  {patient.emergency_contact || '-'}
                  {patient.emergency_phone && ` (${patient.emergency_phone})`}
                </div>
              </div>
            )}

            {/* Medical Information - Condensed */}
            {(patient.medical_history || patient.current_medications || patient.allergies) && (
              <div style={{ marginTop: '10pt', borderTop: '1px solid #ddd', paddingTop: '8pt' }}>
                {patient.medical_history && (
                  <div style={{ marginBottom: '6pt', fontSize: '9pt' }}>
                    <div className="print-label">Medical History</div>
                    <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto', fontSize: '9pt' }}>
                      {patient.medical_history}
                    </div>
                  </div>
                )}
                {patient.current_medications && (
                  <div style={{ marginBottom: '6pt', fontSize: '9pt' }}>
                    <div className="print-label">Current Medications</div>
                    <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto', fontSize: '9pt' }}>
                      {patient.current_medications}
                    </div>
                  </div>
                )}
                {patient.allergies && (
                  <div style={{ marginBottom: '6pt', fontSize: '9pt' }}>
                    <div className="print-label">Allergies</div>
                    <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto', fontSize: '9pt', fontWeight: 'bold', color: '#cc0000' }}>
                      {patient.allergies}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Insurance Information - Bottom Section */}
            {(patient.insurance_provider || patient.insurance_number) && (
              <div style={{ marginTop: '10pt', borderTop: '1px solid #ddd', paddingTop: '8pt', fontSize: '9pt' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
                  <div>
                    <div className="print-label">Insurance Provider</div>
                    <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto' }}>
                      {patient.insurance_provider || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="print-label">Insurance Number</div>
                    <div className="print-value" style={{ borderBottom: 'none', minHeight: 'auto' }}>
                      {patient.insurance_number || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Signature */}
          <PrintSignature date={formatDate(new Date().toISOString())} />
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}

// Quick print component for inline use
export function QuickPatientPrint({ patient }: { patient: any }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const calculateAge = (dateOfBirth: string | undefined): number | null => {
      if (!dateOfBirth) return null
      const today = new Date()
      const birth = new Date(dateOfBirth)
      if (isNaN(birth.getTime())) return null
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age >= 0 ? age : null
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-GB')
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Record - ${patient.full_name}</title>
        <style>
          @media print {
            @page { size: A4; margin: 1in 0.75in; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; margin: 0; padding: 0; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15pt; margin-bottom: 20pt; }
            .clinic-name { font-size: 20pt; font-weight: bold; margin-bottom: 5pt; }
            .clinic-details { font-size: 10pt; margin-bottom: 8pt; }
            .document-title { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-top: 10pt; }
            .section { margin-bottom: 20pt; border: 1px solid #ccc; padding: 10pt; page-break-inside: avoid; }
            .section-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 5pt; margin-bottom: 10pt; }
            .row { display: flex; margin-bottom: 8pt; page-break-inside: avoid; }
            .col { flex: 1; padding-right: 15pt; }
            .col:last-child { padding-right: 0; }
            .field { margin-bottom: 8pt; }
            .label { font-weight: bold; font-size: 10pt; color: #444; margin-bottom: 2pt; text-transform: uppercase; }
            .value { font-size: 12pt; color: #000; padding: 2pt 5pt; border-bottom: 1px solid #ccc; min-height: 16pt; }
            .value.uppercase { text-transform: uppercase; font-weight: bold; }
            .signature-section { margin-top: 40pt; }
            .signature-box { float: right; width: 200pt; text-align: center; border-top: 1px solid #000; padding-top: 5pt; margin-top: 30pt; }
            .footer { margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #ccc; font-size: 10pt; text-align: center; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">EyeCare Medical Center</div>
          <div class="clinic-details">123 Medical Plaza, Healthcare District, City - 123456<br>Phone: +91 98765 43210</div>
          <div class="document-title">Patient Information Record</div>
        </div>

        <div class="section">
          <div class="section-title">Patient Details</div>
          <div class="row">
            <div class="col">
              <div class="field">
                <div class="label">Patient ID</div>
                <div class="value uppercase">${patient.patient_id || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Full Name</div>
                <div class="value uppercase">${patient.full_name || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Gender</div>
                <div class="value uppercase">${patient.gender || '-'}</div>
              </div>
            </div>
            <div class="col">
              <div class="field">
                <div class="label">Date of Birth</div>
                <div class="value">${patient.date_of_birth ? formatDate(patient.date_of_birth) : '-'}</div>
              </div>
              <div class="field">
                <div class="label">Age</div>
                <div class="value">${calculateAge(patient.date_of_birth) || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Registration Date</div>
                <div class="value">${formatDate(patient.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contact Information</div>
          <div class="row">
            <div class="col">
              <div class="field">
                <div class="label">Mobile Number</div>
                <div class="value">${patient.mobile || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Email Address</div>
                <div class="value">${patient.email || '-'}</div>
              </div>
            </div>
            <div class="col">
              <div class="field">
                <div class="label">Emergency Contact</div>
                <div class="value">${patient.emergency_contact || '-'}</div>
              </div>
              <div class="field">
                <div class="label">Emergency Phone</div>
                <div class="value">${patient.emergency_phone || '-'}</div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="field">
                <div class="label">State/Province</div>
                <div class="value">${patient.state || '-'}</div>
              </div>
            </div>
            <div class="col">
              <div class="field">
                <div class="label">City</div>
                <div class="value">${patient.city || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div style="height: 30pt;"></div>
            <div><strong>Dr. [Doctor Name]</strong></div>
            <div style="font-size: 10pt;">MBBS, MS (Ophthalmology)</div>
            <div style="font-size: 10pt;">Registration: REG/12345/2020</div>
            <div style="font-size: 10pt; margin-top: 5pt;">Date: ${formatDate(new Date().toISOString())}</div>
          </div>
        </div>

        <div class="footer">
          <div>Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          <div style="font-size: 8pt; margin-top: 5pt;">This is a computer-generated document. For verification, please contact the clinic.</div>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return { handlePrint }
}