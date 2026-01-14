"use client"

import * as React from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import "@/styles/print.css"

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
  showHeader?: boolean
  customHeader?: React.ReactNode
}

export function PrintLayout({
  documentType,
  documentTitle,
  clinicName = "Sri Ramana Maharishi Eye Hospital",
  clinicAddress = "51-C, Somavarakula Street, Tiruvannamalai – 606 603",
  clinicPhone = "229461",
  children,
  showPrintButton = true,
  isDraft = false,
  onPrint,
  showHeader = true,
  customHeader
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
        {/* Custom Header or Default Header */}
        {customHeader ? (
          customHeader
        ) : showHeader ? (
          <div className="print-header">
            <div className="print-clinic-name">{clinicName}</div>
            <div className="print-clinic-details">
              {clinicAddress} | Phone: {clinicPhone}
            </div>
            <div className="print-document-title">{documentTitle}</div>
          </div>
        ) : null}

        {/* Main Content */}
        <div className="print-content">
          {children}
        </div>

        {/* Footer */}
        <div className="print-footer">
          Generated on: {new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })} at {new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
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

// Standardized PrintHeader Component
interface PrintHeaderProps {
  hospitalName?: string
  hospitalAddress?: string
  hospitalPhone?: string
}

export function PrintHeader({
  hospitalName = "Sri Ramana Maharishi Eye Hospital",
  hospitalAddress = "51-C, Somavarakula Street, Tiruvannamalai – 606 603",
  hospitalPhone = "229461",
  compact = false
}: PrintHeaderProps & { compact?: boolean }) {
  // Use provided hospital name or default
  const normalizedHospitalName = hospitalName || "Sri Ramana Maharishi Eye Hospital"

  return (
    <div className={compact ? "mb-2" : "mb-6"}>
      {/* Flex row, justified between */}
      <div className="flex flex-row items-start justify-between">
        {/* Left: Hospital Logo + Hospital Name */}
        <div className="flex items-center gap-2">
          <Logo width={compact ? 40 : 48} height={compact ? 40 : 48} className={compact ? "w-10 h-10" : "w-12 h-12"} />
          <div className={compact ? "text-lg font-serif font-bold text-gray-900" : "text-2xl font-serif font-bold text-gray-900"}>
            {normalizedHospitalName}
          </div>
        </div>
        
        {/* Right: Address Block */}
        <div className="text-[10px] text-gray-500 text-right leading-relaxed">
          {hospitalAddress}
          {hospitalPhone && <div className={compact ? "mt-0" : "mt-1"}>Ph: {hospitalPhone}</div>}
        </div>
      </div>
      
      {/* Bottom: Thick black divider line */}
      <div className={compact ? "border-b-2 border-gray-900 my-2" : "border-b-2 border-gray-900 my-6"}></div>
    </div>
  )
}

// Standardized PrintSection Component
interface PrintSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function PrintSection({ title, children, className = "" }: PrintSectionProps) {
  return (
    <div className={`mb-3 ${className}`}>
      {/* Title: text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest */}
      <div className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">
        {title}
      </div>
      {/* Content: text-sm font-medium text-gray-900 leading-snug */}
      <div className="text-sm font-medium text-gray-900 leading-snug">
        {children}
      </div>
    </div>
  )
}

// Standardized PrintGrid Component for label-value pairs
interface PrintGridItem {
  label: string
  value: string | number | React.ReactNode
}

interface PrintGridProps {
  items: PrintGridItem[]
  className?: string
}

export function PrintGrid({ items, className = "" }: PrintGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-x-8 gap-y-2 ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {/* Label: text-[10px] uppercase text-gray-400 font-semibold */}
          <div className="text-[10px] uppercase text-gray-400 font-semibold">
            {item.label}
          </div>
          {/* Value: text-sm font-bold text-gray-900 */}
          <div className="text-sm font-bold text-gray-900">
            {item.value || '-'}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

// Standardized PrintFooter Component
interface PrintFooterProps {
  doctorName?: string
  showTimestamp?: boolean
}

export function PrintFooter({ 
  doctorName,
  showTimestamp = true 
}: PrintFooterProps) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' at ' + new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="flex justify-between items-end mt-4 pt-2 border-t border-gray-200">
      {/* Left: System Generated Timestamp */}
      {showTimestamp && (
        <div className="text-[10px] text-gray-400">
          System Generated: {timestamp}
        </div>
      )}
      
      {/* Right: Doctor Signature Block */}
      {doctorName && (
        <div className="text-right">
          <div className="font-bold text-sm">{doctorName}</div>
          <div className="text-[10px] text-gray-400">(Signature)</div>
        </div>
      )}
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