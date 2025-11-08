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
          documentTitle="Patient Information Record"
        >
          {/* Patient Basic Information */}
          <PrintSection title="Patient Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Patient ID" value={patient.patient_id} uppercase />
                <PrintField label="Full Name" value={patient.full_name} uppercase />
                <PrintField label="Gender" value={patient.gender} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField
                  label="Date of Birth"
                  value={patient.date_of_birth ? formatDate(patient.date_of_birth) : undefined}
                />
                <PrintField
                  label="Age"
                  value={calculateAge(patient.date_of_birth)}
                  center
                />
                <PrintField label="Registration Date" value={formatDate(patient.created_at)} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Contact Information */}
          <PrintSection title="Contact Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Mobile Number" value={patient.mobile} />
                <PrintField label="Email Address" value={patient.email} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Emergency Contact" value={patient.emergency_contact} />
                <PrintField label="Emergency Phone" value={patient.emergency_phone} />
              </PrintCol>
            </PrintRow>
            <PrintRow>
              <PrintCol>
                <PrintField label="Country" value={patient.country} />
                <PrintField label="State/Province" value={patient.state} />
              </PrintCol>
              <PrintCol>
                <PrintField label="City" value={patient.city} />
                <PrintField label="Postal Code" value={patient.postal_code} />
              </PrintCol>
            </PrintRow>
            {patient.address && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Address" value={patient.address} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Medical Information */}
          <PrintSection title="Medical Information">
            {patient.medical_history && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Medical History" value={patient.medical_history} />
                </PrintCol>
              </PrintRow>
            )}
            {patient.current_medications && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Current Medications" value={patient.current_medications} />
                </PrintCol>
              </PrintRow>
            )}
            {patient.allergies && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Allergies" value={patient.allergies} />
                </PrintCol>
              </PrintRow>
            )}
            {!patient.medical_history && !patient.current_medications && !patient.allergies && (
              <div className="print-field">
                <div style={{ fontStyle: 'italic', color: '#666', textAlign: 'center', padding: '20px' }}>
                  No medical information recorded
                </div>
              </div>
            )}
          </PrintSection>

          {/* Insurance Information */}
          <PrintSection title="Insurance Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Insurance Provider" value={patient.insurance_provider} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Insurance Number" value={patient.insurance_number} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Status and Notes */}
          <PrintSection title="Account Status">
            <PrintRow>
              <PrintCol>
                <PrintField label="Status" value={patient.status} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="Last Updated" value={formatDate(patient.created_at)} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Visit History Placeholder */}
          <PrintSection title="Recent Visits" className="print-spacing-lg">
            <div style={{ textAlign: 'center', fontStyle: 'italic', padding: '20px', color: '#666' }}>
              Visit history will be populated from case records
            </div>
          </PrintSection>

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