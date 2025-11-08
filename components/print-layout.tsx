"use client"

import * as React from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PrintLayoutProps {
  documentType: string
  documentTitle: string
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
  children: React.ReactNode
  showPrintButton?: boolean
  isDraft?: boolean
  onPrint?: () => void
}

export function PrintLayout({
  documentType,
  documentTitle,
  clinicName = "EyeCare Medical Center",
  clinicAddress = "123 Medical Plaza, Healthcare District, City - 123456",
  clinicPhone = "+91 98765 43210",
  children,
  showPrintButton = true,
  isDraft = false,
  onPrint
}: PrintLayoutProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <>
      {/* Print Button - Hidden in print */}
      {showPrintButton && (
        <div className="flex justify-end mb-4 print:hidden">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print {documentType}
          </Button>
        </div>
      )}

      {/* Print Container */}
      <div className={`print-container ${isDraft ? 'print-draft-watermark' : ''}`} data-document-type={documentType}>
        {/* Clinic Header */}
        <div className="print-header">
          <div className="print-clinic-name">{clinicName}</div>
          <div className="print-clinic-details">
            {clinicAddress}
            <br />
            Phone: {clinicPhone}
          </div>
          <div className="print-document-title">{documentTitle}</div>
        </div>

        {/* Main Content */}
        <div className="print-content">
          {children}
        </div>

        {/* Footer */}
        <div className="print-footer">
          <div>Generated on: {new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
          <div style={{ fontSize: '8pt', marginTop: '5pt' }}>
            This is a computer-generated document. For verification, please contact the clinic.
          </div>
        </div>
      </div>

      {/* Load print styles */}
      <link href="/styles/print.css" rel="stylesheet" media="print" />
    </>
  )
}

interface PrintFieldProps {
  label: string
  value?: string | number | React.ReactNode
  className?: string
  uppercase?: boolean
  center?: boolean
}

export function PrintField({ label, value, className = "", uppercase = false, center = false }: PrintFieldProps) {
  const valueClasses = `print-value ${uppercase ? 'uppercase' : ''} ${center ? 'center' : ''} ${className}`

  return (
    <div className="print-field">
      <div className="print-label">{label}</div>
      <div className={valueClasses}>
        {value || '-'}
      </div>
    </div>
  )
}

interface PrintSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function PrintSection({ title, children, className = "" }: PrintSectionProps) {
  return (
    <div className={`print-patient-section ${className}`}>
      <div className="print-section-title">{title}</div>
      {children}
    </div>
  )
}

interface PrintRowProps {
  children: React.ReactNode
  className?: string
}

export function PrintRow({ children, className = "" }: PrintRowProps) {
  return (
    <div className={`print-row ${className}`}>
      {children}
    </div>
  )
}

interface PrintColProps {
  children: React.ReactNode
  className?: string
}

export function PrintCol({ children, className = "" }: PrintColProps) {
  return (
    <div className={`print-col ${className}`}>
      {children}
    </div>
  )
}

interface PrintSignatureProps {
  doctorName?: string
  qualification?: string
  registrationNumber?: string
  date?: string
}

export function PrintSignature({
  doctorName = "Dr. [Doctor Name]",
  qualification = "MBBS, MS (Ophthalmology)",
  registrationNumber = "REG/12345/2020",
  date
}: PrintSignatureProps) {
  return (
    <div className="print-signature-section">
      <div className="print-signature-box">
        <div style={{ height: '30pt' }}></div>
        <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
          <strong>{doctorName}</strong>
        </div>
        <div style={{ fontSize: '10pt' }}>{qualification}</div>
        <div style={{ fontSize: '10pt' }}>Registration: {registrationNumber}</div>
        {date && <div style={{ fontSize: '10pt', marginTop: '5pt' }}>Date: {date}</div>}
      </div>
    </div>
  )
}