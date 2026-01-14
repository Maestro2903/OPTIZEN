"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader } from "@/components/print/print-layout"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"
import "@/styles/print.css"

interface CertificatePrintModalProps {
  data: {
    id: string
    certificate_number?: string
    date: string
    issue_date?: string
    patient_name: string
    type: string
    purpose?: string
    status: string
    content?: string
    hospital_name?: string
    hospital_address?: string
    doctor_name?: string
    doctor_qualification?: string
    doctor_registration_number?: string
    // Additional fields that might be needed
    patients?: {
      full_name?: string
      gender?: string
      date_of_birth?: string
    }
  }
  isOpen: boolean
  onClose: () => void
}

export function CertificatePrintModal({ data, isOpen, onClose }: CertificatePrintModalProps) {
  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  // Fix date parsing - ensure valid date or use today's date
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) {
      return new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    
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

  // Get certificate number
  const getCertNumber = () => {
    return data.certificate_number || data.id || 'N/A'
  }

  // Get issue date (support both issue_date and date)
  const getIssueDate = () => {
    return data.issue_date || data.date
  }

  // Get certificate title based on type
  const getCertificateTitle = () => {
    return data.type?.toUpperCase() || 'MEDICAL CERTIFICATE'
  }

  // Dynamic text replacement function
  const formatBody = (text: string): string => {
    if (!text) return ''
    
    let formattedText = text
    
    // Replace placeholders with actual data
    if (data.patient_name) {
      formattedText = formattedText.replace(/\[Patient Name\]/gi, data.patient_name)
      formattedText = formattedText.replace(/\[patient name\]/gi, data.patient_name)
    }
    
    if (data.doctor_name) {
      formattedText = formattedText.replace(/\[Doctor Name\]/gi, data.doctor_name)
      formattedText = formattedText.replace(/\[doctor name\]/gi, data.doctor_name)
    }
    
    // Replace age placeholder if patient data is available
    if (data.patients?.date_of_birth) {
      try {
        const birthDate = new Date(data.patients.date_of_birth)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age = age - 1
        }
        formattedText = formattedText.replace(/\[Age\]/gi, age.toString())
        formattedText = formattedText.replace(/\[age\]/gi, age.toString())
      } catch (e) {
        // If age calculation fails, leave placeholder as is
      }
    }
    
    // Replace gender placeholder
    if (data.patients?.gender) {
      const gender = data.patients.gender.charAt(0).toUpperCase() + data.patients.gender.slice(1)
      formattedText = formattedText.replace(/\[Gender\]/gi, gender)
      formattedText = formattedText.replace(/\[gender\]/gi, gender)
    }
    
    return formattedText
  }

  // Get certificate body with text replacement
  const getCertificateBody = () => {
    const bodyContent = data.content || ''
    return formatBody(bodyContent)
  }

  // Get doctor name with fallback
  const getDoctorName = () => {
    return data.doctor_name || 'Dr. [Doctor Name]'
  }

  // Get doctor qualification with fallback
  const getDoctorQualification = () => {
    return data.doctor_qualification || 'MBBS, MS (Ophthalmology)'
  }

  // Get doctor registration number with fallback
  const getDoctorRegNumber = () => {
    return data.doctor_registration_number || 'Reg: 12345'
  }

  const formattedDate = formatDate(getIssueDate())
  const certNumber = getCertNumber()
  const certificateTitle = getCertificateTitle()
  const certificateBody = getCertificateBody()

  // Get hospital name with fallback
  const getHospitalName = () => {
    return data.hospital_name || 'Sri Ramana Maharishi Eye Hospital'
  }

  // Get hospital address with fallback
  const getHospitalAddress = () => {
    return data.hospital_address || '51-C, Somavarakula Street, Tiruvannamalai – 606 603'
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  const modalContent = (
    <>
      {/* Fixed Overlay */}
      <div 
        className="certificate-print-overlay fixed inset-0 bg-gray-900/80 z-50 flex justify-center overflow-y-auto py-10 print:hidden"
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        {/* Print Control Bar - Floating above A4 paper */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white hover:bg-gray-100"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* A4 Paper Container */}
        <div className="certificate-print-paper w-[210mm] min-h-[297mm] bg-white shadow-2xl mx-auto relative p-[20mm]">
          {/* Header (Standard) */}
          <PrintHeader
            hospitalName={getHospitalName()}
            hospitalAddress={getHospitalAddress()}
          />

          {/* Reference Block (Top Right) */}
          <div className="flex justify-end mb-6 -mt-4">
            <div className="text-right space-y-1">
              <div className="text-sm font-mono text-gray-900">
                Ref No: {certNumber}
              </div>
              <div className="text-sm font-bold text-gray-900">
                Date: {formattedDate}
              </div>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-2xl font-serif font-bold uppercase text-center underline decoration-double underline-offset-4 mt-8 mb-8 text-gray-900">
            {certificateTitle}
          </div>

          {/* Salutation */}
          <div className="font-bold uppercase tracking-wide mb-6 text-gray-900">
            TO WHOM IT MAY CONCERN
          </div>

          {/* Dynamic Body */}
          <div className="font-serif text-lg leading-loose text-gray-900 text-justify whitespace-pre-wrap mb-8">
            {certificateBody || 'Certificate content not available.'}
          </div>

          {/* Footer (Signature) - 2 Column */}
          <div className="mt-20 grid grid-cols-2 gap-8">
            {/* Left: Purpose */}
            <div className="text-sm italic text-gray-500">
              Issued for: {data.purpose || 'Medical purposes'}
            </div>

            {/* Right: Doctor's Block */}
            <div className="text-right">
              <div className="space-y-1">
                <div className="font-bold text-sm text-gray-900">
                  {getDoctorName()}
                </div>
                <div className="text-xs text-gray-600">
                  {getDoctorQualification()}
                </div>
                <div className="text-xs text-gray-600">
                  {getDoctorRegNumber()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  (Signature)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Certificate print overlay - make visible for print */
          .certificate-print-overlay {
            position: static !important;
            background: transparent !important;
            display: block !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            min-height: auto !important;
          }
          
          /* Hide control buttons */
          .print\\:hidden,
          button.print\\:hidden,
          [class*="print:hidden"],
          button[class*="absolute"] {
            display: none !important;
          }
          
          /* Certificate print paper - always visible */
          .certificate-print-paper {
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            page-break-after: always;
            position: relative !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: white !important;
          }
          
          /* Ensure all content inside certificate paper is visible */
          .certificate-print-paper,
          .certificate-print-paper * {
            visibility: visible !important;
            opacity: 1 !important;
            display: revert !important;
            color: black !important;
          }
          
          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page setup */
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </>
  )

  // Render to portal for proper z-index handling
  if (typeof window === 'undefined') return null
  
  return createPortal(modalContent, document.body)
}

