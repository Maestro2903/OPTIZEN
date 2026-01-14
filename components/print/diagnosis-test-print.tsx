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

interface DiagnosisTestPrintProps {
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
      address?: string
    }
    diagnosis_data?: {
      diagnosis?: string[]
    }
    tests_data?: {
      sac_test?: {
        right?: string
        left?: string
      }
      iop?: {
        right?: { id?: string; value?: string }
        left?: { id?: string; value?: string }
      }
      diagnostic_tests?: Array<{
        test_id: string
        eye?: string
        type?: string
        problem?: string
        notes?: string
      }>
    }
  }
  children: React.ReactNode
}

export function DiagnosisTestPrint({ recordData, children }: DiagnosisTestPrintProps) {
  const masterData = useMasterData()
  const [dataLoaded, setDataLoaded] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Load necessary master data when component mounts
  React.useEffect(() => {
    if (!dataLoaded) {
      const categoriesToLoad: Array<keyof typeof masterData.data> = [
        'diagnosis',
        'sacStatus',
        'iopRanges',
        'diagnosticTests',
        'eyeSelection',
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

  // Helper to resolve diagnosis array
  const resolveDiagnosis = (diagnosis: string[] | undefined | null): string => {
    if (!diagnosis || diagnosis.length === 0) return '-'
    const resolved = diagnosis.map(d => resolveUUID(d, 'diagnosis'))
    return resolved.join(', ')
  }

  // Helper to get eye label
  const getEyeLabel = (eyeId: string | undefined | null): string => {
    if (!eyeId) return '-'
    return resolveUUID(eyeId, 'eyeSelection')
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

  const patient = recordData.patients
  const patientName = patient?.full_name || '-'
  const patientId = patient?.patient_id || recordData.patient_id || '-'
  const patientAge = calculateAge(patient?.date_of_birth)
  const patientSex = patient?.gender || '-'
  const patientAddress = patient?.address || '-'

  const modalContent = (
    <PrintModalShell
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Diagnosis & Tests Record"
    >
      <div className="print-content p-6 bg-white">
        {/* Print Header */}
        <PrintHeader />
        
        {/* Centered Title */}
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">
            DIAGNOSIS & TESTS RECORD
          </h2>
        </div>

        {/* Patient & Record Information */}
        <div className="mb-4 break-inside-avoid">
          <div className="grid grid-cols-4 gap-4 mb-4 border-b border-gray-300 pb-3">
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Record No</div>
              <div className="text-sm font-bold text-gray-900">{recordData.record_number || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Date</div>
              <div className="text-sm font-bold text-gray-900">{formatDate(recordData.record_date)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Time</div>
              <div className="text-sm font-bold text-gray-900">{formatTime(recordData.record_time)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Patient ID</div>
              <div className="text-sm font-bold text-gray-900">{patientId}</div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Patient Name</div>
              <div className="text-sm font-bold text-gray-900">{patientName}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Age / Gender</div>
              <div className="text-sm font-bold text-gray-900">
                {patientAge !== '-' ? `${patientAge} yrs` : '-'}
                {patientSex !== '-' && ` / ${patientSex}`}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Mobile</div>
              <div className="text-sm font-bold text-gray-900">{patient?.mobile || '-'}</div>
            </div>
          </div>
          {patientAddress !== '-' && (
            <div className="mb-3">
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Address</div>
              <div className="text-sm text-gray-900">{patientAddress}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* DIAGNOSIS SECTION */}
          {recordData.diagnosis_data?.diagnosis && recordData.diagnosis_data.diagnosis.length > 0 && (
            <PrintSection title="DIAGNOSIS">
              <div className="p-2 border-l-4 border-black bg-gray-50">
                <div className="text-xs font-medium text-black">
                  {resolveDiagnosis(recordData.diagnosis_data.diagnosis)}
                </div>
              </div>
            </PrintSection>
          )}

          {/* DIAGNOSTIC TESTS SECTION */}
          {(recordData.tests_data?.sac_test?.right || 
            recordData.tests_data?.sac_test?.left || 
            recordData.tests_data?.iop?.right || 
            recordData.tests_data?.iop?.left ||
            (recordData.tests_data?.diagnostic_tests && recordData.tests_data.diagnostic_tests.length > 0)) && (
            <PrintSection title="DIAGNOSTIC TESTS">
              <div className="space-y-3">
                {/* SAC Test */}
                {(recordData.tests_data?.sac_test?.right || recordData.tests_data?.sac_test?.left) && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-2">SAC Test</div>
                    <PrintGrid items={[
                      { label: 'Right Eye', value: resolveUUID(recordData.tests_data?.sac_test?.right, 'sacStatus') },
                      { label: 'Left Eye', value: resolveUUID(recordData.tests_data?.sac_test?.left, 'sacStatus') }
                    ]} />
                  </div>
                )}

                {/* IOP */}
                {(recordData.tests_data?.iop?.right || recordData.tests_data?.iop?.left) && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-2">IOP (Intraocular Pressure)</div>
                    <PrintGrid items={[
                      { 
                        label: 'Right Eye', 
                        value: recordData.tests_data?.iop?.right?.value 
                          ? resolveUUID(recordData.tests_data.iop.right.value, 'iopRanges')
                          : '-'
                      },
                      { 
                        label: 'Left Eye', 
                        value: recordData.tests_data?.iop?.left?.value 
                          ? resolveUUID(recordData.tests_data.iop.left.value, 'iopRanges')
                          : '-'
                      }
                    ]} />
                  </div>
                )}

                {/* Additional Diagnostic Tests */}
                {recordData.tests_data?.diagnostic_tests && recordData.tests_data.diagnostic_tests.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-2">Additional Diagnostic Tests</div>
                    <div className="space-y-2">
                      {recordData.tests_data.diagnostic_tests.map((test, index) => (
                        <div key={index} className="border border-gray-200 p-2 rounded">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Test Type</div>
                              <div className="text-xs text-gray-900">
                                {resolveUUID(test.test_id, 'diagnosticTests')}
                              </div>
                            </div>
                            {test.eye && (
                              <div>
                                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Eye</div>
                                <div className="text-xs text-gray-900">
                                  {getEyeLabel(test.eye)}
                                </div>
                              </div>
                            )}
                          </div>
                          {test.type && (
                            <div className="mb-2">
                              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Type</div>
                              <div className="text-xs text-gray-900">{test.type}</div>
                            </div>
                          )}
                          {test.problem && (
                            <div className="mb-2">
                              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Problem</div>
                              <div className="text-xs text-gray-900">{test.problem}</div>
                            </div>
                          )}
                          {test.notes && (
                            <div>
                              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Notes</div>
                              <div className="text-xs text-gray-900">{test.notes}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PrintSection>
          )}
        </div>
      </div>
    </PrintModalShell>
  )

  return (
    <>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    </>
  )
}

