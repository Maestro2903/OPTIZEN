"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintGrid } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"
import { useMasterData } from "@/hooks/use-master-data"
import "@/styles/print.css"

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Helper function to check if a value is a UUID
const isUUID = (value: string | undefined | null): boolean => {
  if (!value || typeof value !== 'string') return false
  return UUID_REGEX.test(value)
}

interface TreatmentMedicationPrintProps {
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
    medications_data?: {
      medications?: Array<{
        drug_id: string
        eye?: string
        dosage_id?: string
        route_id?: string
        duration?: string
        quantity?: string
      }>
    }
    past_medications_data?: {
      medications?: Array<{
        medicine_id?: string
        medicine_name: string
        type?: string
        advice?: string
        duration?: string
        eye?: string
      }>
    }
    past_treatments_data?: {
      treatments?: Array<{
        treatment: string
        years?: string
      }>
    }
    surgeries_data?: {
      surgeries?: Array<{
        eye: string
        surgery_name: string
        anesthesia?: string
      }>
    }
    treatments_data?: {
      treatments?: string[]
    }
  }
  children: React.ReactNode
}

export function TreatmentMedicationPrint({ recordData, children }: TreatmentMedicationPrintProps) {
  const masterData = useMasterData()
  const [dataLoaded, setDataLoaded] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Load necessary master data when component mounts
  React.useEffect(() => {
    if (!dataLoaded) {
      const categoriesToLoad: Array<keyof typeof masterData.data> = [
        'medicines',
        'dosages',
        'routes',
        'eyeSelection',
        'surgeries',
        'anesthesiaTypes',
        'treatments',
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

  // Helper to get eye label
  const getEyeLabel = (eyeId: string | undefined | null): string => {
    if (!eyeId) return '-'
    return resolveUUID(eyeId, 'eyeSelection')
  }

  // Helper to resolve treatments array
  const resolveTreatments = (treatments: string[] | undefined | null): string => {
    if (!treatments || treatments.length === 0) return '-'
    const resolved = treatments.map(t => resolveUUID(t, 'treatments'))
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
      title="Treatment & Medication Record"
    >
      <div className="print-content p-6 bg-white">
        {/* Print Header */}
        <PrintHeader />
        
        {/* Centered Title */}
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">
            TREATMENT & MEDICATION RECORD
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
          {/* CURRENT MEDICATIONS SECTION */}
          {recordData.medications_data?.medications && recordData.medications_data.medications.length > 0 && (
            <PrintSection title="CURRENT MEDICATIONS">
              <div className="space-y-2">
                {recordData.medications_data.medications.map((med, index) => (
                  <div key={index} className="border border-gray-200 p-2 rounded">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Drug</div>
                        <div className="text-xs font-bold text-gray-900">
                          {resolveUUID(med.drug_id, 'medicines')}
                        </div>
                      </div>
                      {med.eye && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Eye</div>
                          <div className="text-xs text-gray-900">
                            {getEyeLabel(med.eye)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {med.dosage_id && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Dosage</div>
                          <div className="text-xs text-gray-900">
                            {resolveUUID(med.dosage_id, 'dosages')}
                          </div>
                        </div>
                      )}
                      {med.route_id && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Route</div>
                          <div className="text-xs text-gray-900">
                            {resolveUUID(med.route_id, 'routes')}
                          </div>
                        </div>
                      )}
                      {med.duration && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Duration</div>
                          <div className="text-xs text-gray-900">{med.duration}</div>
                        </div>
                      )}
                      {med.quantity && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Quantity</div>
                          <div className="text-xs text-gray-900">{med.quantity}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrintSection>
          )}

          {/* PAST HISTORY MEDICATIONS SECTION */}
          {recordData.past_medications_data?.medications && recordData.past_medications_data.medications.length > 0 && (
            <PrintSection title="PAST HISTORY MEDICATIONS">
              <div className="space-y-2">
                {recordData.past_medications_data.medications.map((med, index) => (
                  <div key={index} className="border border-gray-200 p-2 rounded">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Medicine Name</div>
                        <div className="text-xs font-bold text-gray-900">
                          {isUUID(med.medicine_name) 
                            ? resolveUUID(med.medicine_name, 'medicines')
                            : med.medicine_name}
                        </div>
                      </div>
                      {med.eye && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Eye</div>
                          <div className="text-xs text-gray-900">
                            {getEyeLabel(med.eye)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {med.type && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Type/Frequency</div>
                          <div className="text-xs text-gray-900">
                            {isUUID(med.type) ? resolveUUID(med.type, 'dosages') : med.type}
                          </div>
                        </div>
                      )}
                      {med.duration && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Duration</div>
                          <div className="text-xs text-gray-900">{med.duration}</div>
                        </div>
                      )}
                      {med.advice && (
                        <div className="col-span-2">
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Advice</div>
                          <div className="text-xs text-gray-900">{med.advice}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrintSection>
          )}

          {/* PAST HISTORY TREATMENTS SECTION */}
          {recordData.past_treatments_data?.treatments && recordData.past_treatments_data.treatments.length > 0 && (
            <PrintSection title="PAST HISTORY TREATMENTS">
              <div className="space-y-2">
                {recordData.past_treatments_data.treatments.map((treatment, index) => (
                  <div key={index} className="border border-gray-200 p-2 rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Treatment</div>
                        <div className="text-xs font-bold text-gray-900">
                          {isUUID(treatment.treatment) 
                            ? resolveUUID(treatment.treatment, 'treatments')
                            : treatment.treatment}
                        </div>
                      </div>
                      {treatment.years && (
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Years</div>
                          <div className="text-xs text-gray-900">{treatment.years}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrintSection>
          )}

          {/* SURGERIES SECTION */}
          {recordData.surgeries_data?.surgeries && recordData.surgeries_data.surgeries.length > 0 && (
            <PrintSection title="SURGERIES">
              <div className="space-y-2">
                {recordData.surgeries_data.surgeries.map((surgery, index) => (
                  <div key={index} className="border border-gray-200 p-2 rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Surgery Name</div>
                        <div className="text-xs font-bold text-gray-900">
                          {resolveUUID(surgery.surgery_name, 'surgeries')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Eye</div>
                        <div className="text-xs text-gray-900">
                          {getEyeLabel(surgery.eye)}
                        </div>
                      </div>
                      {surgery.anesthesia && (
                        <div className="col-span-2">
                          <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Anesthesia</div>
                          <div className="text-xs text-gray-900">
                            {isUUID(surgery.anesthesia) 
                              ? resolveUUID(surgery.anesthesia, 'anesthesiaTypes')
                              : surgery.anesthesia}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </PrintSection>
          )}

          {/* GENERAL TREATMENTS SECTION */}
          {recordData.treatments_data?.treatments && recordData.treatments_data.treatments.length > 0 && (
            <PrintSection title="GENERAL TREATMENTS">
              <div className="p-2 border-l-4 border-black bg-gray-50">
                <div className="text-xs font-medium text-black">
                  {resolveTreatments(recordData.treatments_data.treatments)}
                </div>
              </div>
            </PrintSection>
          )}
        </div>
      </div>
    </PrintModalShell>
  )

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    )
  }

  return (
    <>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}

