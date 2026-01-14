"use client"

import * as React from "react"
import { PrintLayout, PrintHeader, PrintFooter } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface CertificatePrintProps {
  certificate: {
    id: string
    certificate_number?: string
    date: string
    issue_date?: string
    patient_name: string
    type: string
    purpose?: string
    status: string
    exam_date?: string
    findings?: string
    diagnosis?: string
    treatment_period?: string
    recommendations?: string
    visual_acuity_right?: string
    visual_acuity_left?: string
    color_vision?: string
    driving_fitness?: string
    illness?: string
    leave_from?: string
    leave_to?: string
    title?: string
    content?: string
    hospital_name?: string
    hospital_address?: string
    doctor_name?: string
    doctor_qualification?: string
    doctor_registration_number?: string
  }
  children: React.ReactNode
}

export function CertificatePrint({ certificate, children }: CertificatePrintProps) {
  // Fix the 'Invalid Date' Bug - safely parse dates
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }

  // Get certificate number (support both certificate_number and id)
  const getCertNumber = () => {
    return certificate.certificate_number || certificate.id || 'N/A'
  }

  // Get issue date (support both issue_date and date)
  const getIssueDate = () => {
    return certificate.issue_date || certificate.date
  }

  // Get certificate title based on type
  const getCertificateTitle = () => {
    switch (certificate.type) {
      case 'Fitness Certificate':
        return 'FITNESS CERTIFICATE'
      case 'Medical Certificate':
        return 'MEDICAL CERTIFICATE'
      case 'Eye Test Certificate':
      case 'Eye Test':
        return 'EYE EXAMINATION CERTIFICATE'
      case 'Sick Leave':
        return 'SICK LEAVE NOTE'
      case 'Custom':
        return certificate.title?.toUpperCase() || 'MEDICAL CERTIFICATE'
      default:
        return 'MEDICAL CERTIFICATE'
    }
  }

  // Process certificate body content
  // - Replace [Patient Name] with actual patient name
  // - For Medical Certificate, prepend "TO WHOM IT MAY CONCERN" if not already there
  const getCertificateBody = () => {
    let bodyContent = certificate.content || ''

    // Replace [Patient Name] placeholder with actual patient name
    if (bodyContent && certificate.patient_name) {
      bodyContent = bodyContent.replace(/\[Patient Name\]/gi, certificate.patient_name)
    }

    // For Medical Certificate type, prepend "TO WHOM IT MAY CONCERN" if not already there
    if (certificate.type === 'Medical Certificate') {
      const concernText = 'TO WHOM IT MAY CONCERN'
      const upperContent = bodyContent.toUpperCase().trim()
      
      if (!upperContent.startsWith(concernText) && !upperContent.includes(concernText)) {
        bodyContent = `${concernText}\n\n${bodyContent}`
      }
    }

    return bodyContent
  }

  // Get doctor name with fallback
  const getDoctorName = () => {
    return certificate.doctor_name || 'Dr. [Doctor Name]'
  }

  // Get doctor qualification with fallback
  const getDoctorQualification = () => {
    return certificate.doctor_qualification || 'MBBS, MS (Ophthal)'
  }

  // Get doctor registration number with fallback
  const getDoctorRegNumber = () => {
    return certificate.doctor_registration_number || 'Reg: 12345'
  }

  const formattedDate = formatDate(getIssueDate())
  const certNumber = getCertNumber()
  const certificateTitle = getCertificateTitle()
  const certificateBody = getCertificateBody()

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Certificate"
          documentTitle={certificateTitle}
          showHeader={false}
          isDraft={certificate.status === 'Draft'}
        >
          {/* Header & Branding */}
          <PrintHeader 
            hospitalName={certificate.hospital_name}
            hospitalAddress={certificate.hospital_address}
          />

          {/* Reference Section (Top Right) */}
          <div className="flex justify-end mb-6">
            <div className="text-right space-y-1">
              <div className="text-sm font-mono text-gray-900">
                Ref/Cert No: {certNumber}
              </div>
              <div className="text-sm font-bold text-gray-900">
                Date: {formattedDate}
              </div>
            </div>
          </div>

          {/* Dynamic Title */}
          <div className="text-xl font-bold uppercase text-center underline decoration-2 underline-offset-4 mb-8 text-gray-900">
            {certificateTitle}
          </div>

          {/* Certificate Body (The Narrative) */}
          <div className="min-h-[300px] py-8 px-4">
            <div className="font-serif text-lg leading-loose text-gray-900 whitespace-pre-wrap text-justify">
              {certificateBody || 'Certificate content not available.'}
            </div>
          </div>

          {/* Footer & Signature (Two-Column) */}
          <div className="mt-12 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-8">
              {/* Left: Purpose */}
              <div className="text-sm italic text-gray-500">
                Issued for: {certificate.purpose || 'Medical purposes'}
              </div>

              {/* Right: Doctor's Signature Block */}
              <div className="text-right">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-gray-900">
                    {getDoctorName()}
                  </div>
                  <div className="text-xs text-gray-600">
                    ({getDoctorQualification()})
                  </div>
                  <div className="text-xs text-gray-600">
                    {getDoctorRegNumber()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Authorized Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}

// Quick print function for certificates (kept for backward compatibility)
export function QuickCertificatePrint({ certificate }: { certificate: any }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const formatDate = (dateString: string) => {
      if (!dateString) return new Date().toLocaleDateString('en-GB')
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return new Date().toLocaleDateString('en-GB')
        return date.toLocaleDateString('en-GB')
      } catch {
        return new Date().toLocaleDateString('en-GB')
      }
    }

    const certNumber = certificate.certificate_number || certificate.id || 'N/A'
    const issueDate = certificate.issue_date || certificate.date

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${certNumber}</title>
        <style>
          @media print {
            @page { size: A4; margin: 1in 0.75in; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; margin: 0; padding: 0; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15pt; margin-bottom: 20pt; }
            .clinic-name { font-size: 20pt; font-weight: bold; margin-bottom: 5pt; }
            .clinic-details { font-size: 10pt; margin-bottom: 8pt; }
            .cert-title { font-size: 18pt; font-weight: bold; margin-bottom: 20pt; text-decoration: underline; }
            .certificate-body { padding: 20pt; margin: 20pt 0; font-size: 14pt; line-height: 2; text-align: justify; }
            .signature-section { margin-top: 40pt; }
            .signature-box { float: right; width: 200pt; text-align: center; border-top: 1px solid #000; padding-top: 5pt; margin-top: 30pt; }
            .footer { margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #ccc; font-size: 10pt; text-align: center; clear: both; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${certificate.hospital_name || 'Sri Ramana Maharishi Eye Hospital'}</div>
          <div class="clinic-details">${certificate.hospital_address || '51-C, Somavarakula Street, Tiruvannamalai – 606 603'}<br>Phone: 229461</div>
          <div class="cert-title">${certificate.type?.toUpperCase() || 'MEDICAL CERTIFICATE'}</div>
        </div>

        <div class="certificate-body">
          ${certificate.content || 'Certificate content not available.'}
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div style="height: 30pt;"></div>
            <div><strong>${certificate.doctor_name || 'Dr. [Doctor Name]'}</strong></div>
            <div style="font-size: 10pt;">${certificate.doctor_qualification || 'MBBS, MS (Ophthalmology)'}</div>
            <div style="font-size: 10pt;">Reg. No: ${certificate.doctor_registration_number || 'REG/12345/2020'}</div>
            <div style="font-size: 10pt; margin-top: 5pt;">Date: ${formatDate(issueDate)}</div>
          </div>
        </div>

        <div class="footer">
          <div>Certificate No: ${certNumber} | Date: ${formatDate(issueDate)}</div>
          <div style="margin-top: 5pt;">For verification, please contact the clinic with this certificate number.</div>
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
