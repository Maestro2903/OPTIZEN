"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"
import { PrintSection } from "./print-layout"
import { PrintGrid } from "./print-layout"
import { useMasterData } from "@/hooks/use-master-data"
import "@/styles/print.css"

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Helper function to check if a value is a UUID
const isUUID = (value: string | undefined | null): boolean => {
  if (!value || typeof value !== 'string') return false
  return UUID_REGEX.test(value)
}

interface BloodAdvicePrintProps {
  recordData: {
    id?: string
    record_number: string
    record_date?: string
    record_time?: string
    patient_id?: string
    patients?: {
      full_name?: string
      patient_id?: string
      date_of_birth?: string
      gender?: string
      mobile?: string
      state?: string
    }
    blood_investigation_data?: {
      blood_sugar?: string
      blood_tests?: string[]
    }
    advice_remarks?: string
  }
  children: React.ReactNode
}

export function BloodAdvicePrint({ recordData, children }: BloodAdvicePrintProps) {
  const masterData = useMasterData()
  const [dataLoaded, setDataLoaded] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Load necessary master data when component mounts
  React.useEffect(() => {
    if (!dataLoaded) {
      const categoriesToLoad: Array<keyof typeof masterData.data> = [
        'bloodTests',
      ]
      
      categoriesToLoad.forEach(category => {
        if (masterData.data[category].length === 0) {
          masterData.fetchCategory(category)
        }
      })
      setDataLoaded(true)
    }
  }, [dataLoaded, masterData])

  // Helper to resolve UUID from master data category
  const resolveUUID = (
    value: string | undefined | null,
    category: keyof typeof masterData.data | Array<keyof typeof masterData.data>
  ): string => {
    if (!value) return '-'
    if (!isUUID(value)) return value
    const categories = Array.isArray(category) ? category : [category]
    for (const cat of categories) {
      const option = masterData.data[cat].find(opt => opt.value === value)
      if (option) {
        return option.label
      }
    }
    return value
  }

  // Helper to resolve blood tests array
  const resolveBloodTests = (bloodTests: string[] | undefined | null): string => {
    if (!bloodTests || bloodTests.length === 0) return '-'
    const resolved = bloodTests.map(test => resolveUUID(test, 'bloodTests'))
    return resolved.join(', ')
  }

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Format time
  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return '-'
    return timeString
  }

  // Calculate age from date of birth
  const calculateAge = (dob: string | undefined): string => {
    if (!dob) return '-'
    try {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age.toString()
    } catch {
      return '-'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const patient = recordData.patients
  const bloodInvestigation = recordData.blood_investigation_data || {}

  const modalContent = isOpen ? (
    <PrintModalShell onClose={handleClose} onPrint={handlePrint}>
      <div className="print-content">
        <PrintHeader
          documentTitle="Blood Investigation & Advice"
          patientName={patient?.full_name || '-'}
          patientId={patient?.patient_id || '-'}
          age={calculateAge(patient?.date_of_birth)}
          sex={patient?.gender || '-'}
          address={patient?.state || '-'}
          recordNumber={recordData.record_number}
          recordDate={formatDate(recordData.record_date)}
          recordTime={formatTime(recordData.record_time)}
        />

        {/* Blood Investigation Section */}
        <PrintSection title="Blood Investigation">
          <PrintGrid columns={2}>
            <div>
              <div className="print-label">Blood Sugar</div>
              <div className="print-value">{bloodInvestigation.blood_sugar || '-'}</div>
            </div>
            <div>
              <div className="print-label">Blood Tests</div>
              <div className="print-value">{resolveBloodTests(bloodInvestigation.blood_tests)}</div>
            </div>
          </PrintGrid>
        </PrintSection>

        {/* Advice / Remarks Section */}
        {recordData.advice_remarks && (
          <PrintSection title="Advice / Remarks">
            <div className="print-value whitespace-pre-wrap">{recordData.advice_remarks}</div>
          </PrintSection>
        )}
      </div>
    </PrintModalShell>
  ) : null

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      {typeof window !== 'undefined' && modalContent
        ? createPortal(modalContent, document.body)
        : null}
    </>
  )
}



