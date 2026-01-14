"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintFooter } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"
import { calculateAge } from "@/lib/utils"

interface DischargePrintProps {
  discharge: {
    id: string
    discharge_no?: string
    discharge_date: string
    patient_name: string
    patient_id?: string
    admission_date?: string
    room_number?: string
    ward_name?: string
    case_no?: string
    primary_diagnosis?: string
    secondary_diagnosis?: string
    final_diagnosis?: {
      ids: string[]
      labels: string[]
    } | string | null
    procedures_performed?: string
    treatment_given?: {
      ids: string[]
      labels: string[]
    } | string | null
    complications?: string
    final_condition?: string
    condition_on_discharge?: string
    discharge_medications?: string
    medications?: {
      medicines: {
        ids: string[]
        labels: string[]
      }
      dosages: {
        ids: string[]
        labels: string[]
      }
    } | string | null
    follow_up_instructions?: string
    instructions?: string
    follow_up_date?: string
    discharge_summary?: string
    vital_signs?: string
    vitals_at_discharge?: string
    lab_results?: string
    status?: string
    patients?: {
      id?: string
      patient_id?: string
      full_name?: string
      gender?: 'male' | 'female' | 'other'
      date_of_birth?: string
    }
  }
  children: React.ReactNode
}

export function DischargePrint({ discharge, children }: DischargePrintProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '--'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const calculateStayDuration = () => {
    if (!discharge.admission_date) return 'Not recorded'
    const admission = new Date(discharge.admission_date)
    const dischargeDate = new Date(discharge.discharge_date)
    const diffTime = Math.abs(dischargeDate.getTime() - admission.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`
  }

  // Calculate patient age and gender
  const getPatientAgeSex = () => {
    const patient = discharge.patients
    if (!patient) return '--'
    
    let age = '--'
    if (patient.date_of_birth) {
      try {
        age = calculateAge(patient.date_of_birth).toString()
      } catch (e) {
        age = '--'
      }
    }
    
    const gender = patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '--'
    return `${age} / ${gender}`
  }

  // Get final diagnosis text
  const getFinalDiagnosis = () => {
    if (!discharge.final_diagnosis) return discharge.primary_diagnosis || '--'
    if (typeof discharge.final_diagnosis === 'string') return discharge.final_diagnosis
    if (discharge.final_diagnosis.labels && discharge.final_diagnosis.labels.length > 0) {
      return discharge.final_diagnosis.labels.join(', ')
    }
    return discharge.primary_diagnosis || '--'
  }

  // Get procedures/treatments as array
  const getProcedures = () => {
    if (discharge.procedures_performed) {
      return discharge.procedures_performed.split('\n').filter(line => line.trim())
    }
    if (discharge.treatment_given) {
      if (typeof discharge.treatment_given === 'string') {
        return discharge.treatment_given.split('\n').filter(line => line.trim())
      }
      if (discharge.treatment_given.labels && discharge.treatment_given.labels.length > 0) {
        return discharge.treatment_given.labels
      }
    }
    return []
  }

  // Parse medications into table format
  const parseMedications = () => {
    const medications: Array<{ name: string; dosage: string; duration: string; instructions: string }> = []
    
    // Try structured medications first
    if (discharge.medications && typeof discharge.medications === 'object' && 'medicines' in discharge.medications) {
      const meds = discharge.medications.medicines.labels || []
      const dosages = discharge.medications.dosages.labels || []
      const maxLength = Math.max(meds.length, dosages.length)
      
      for (let i = 0; i < maxLength; i++) {
        medications.push({
          name: meds[i] || '--',
          dosage: dosages[i] || '--',
          duration: '--',
          instructions: '--'
        })
      }
    } else if (discharge.discharge_medications) {
      // Parse string format medications
      const lines = discharge.discharge_medications.split('\n').filter(line => line.trim())
      lines.forEach(line => {
        // Try to parse common formats
        const parts = line.split(/\s*[,\-|]\s*/)
        medications.push({
          name: parts[0] || line,
          dosage: parts[1] || '--',
          duration: parts[2] || '--',
          instructions: parts.slice(3).join(', ') || '--'
        })
      })
    }
    
    return medications
  }

  const medications = parseMedications()
  const procedures = getProcedures()
  const roomWard = discharge.room_number 
    ? `${discharge.room_number}${discharge.ward_name ? ` / ${discharge.ward_name}` : ''}`
    : discharge.ward_name || '--'

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    )
  }

  const modalContent = (
    <PrintModalShell
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={discharge.discharge_no ? `Discharge_${discharge.discharge_no}` : 'Discharge_Summary'}
    >
      {/* Header & Branding */}
      <PrintHeader />
      
      {/* Document Title */}
      <div className="text-xl font-bold uppercase tracking-widest border-b-2 border-gray-900 pb-2 mb-8 text-center">
        DISCHARGE SUMMARY REPORT
      </div>

          {/* Section 1: Admission Details */}
          <PrintSection title="ADMISSION DETAILS">
            <div className="grid grid-cols-4 gap-x-8 gap-y-3">
              {/* Row 1 */}
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Patient Name</div>
                <div className="text-sm font-bold text-gray-900">{discharge.patient_name || '--'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Age/Sex</div>
                <div className="text-sm font-bold text-gray-900">{getPatientAgeSex()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Patient ID</div>
                <div className="text-sm font-bold text-gray-900">{discharge.patient_id || '--'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Case ID</div>
                <div className="text-sm font-bold text-gray-900">{discharge.case_no || '--'}</div>
              </div>
              
              {/* Row 2 */}
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Admission Date</div>
                <div className="text-sm font-bold text-gray-900">{formatDate(discharge.admission_date)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Discharge Date</div>
                <div className="text-sm font-bold text-gray-900">{formatDate(discharge.discharge_date)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Length of Stay</div>
                <div className="text-sm font-bold text-gray-900">{calculateStayDuration()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Room/Ward</div>
                <div className="text-sm font-bold text-gray-900">{roomWard}</div>
              </div>
            </div>
          </PrintSection>

          {/* Section 2: Clinical Summary */}
          <PrintSection title="CLINICAL SUMMARY">
            {/* Final Diagnosis */}
            <div className="mb-4">
              <div className="text-xs font-bold uppercase text-gray-500 mb-2">Final Diagnosis</div>
              <div className="text-sm font-bold text-gray-900">{getFinalDiagnosis()}</div>
            </div>

            {/* Procedures Performed */}
            {procedures.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold uppercase text-gray-500 mb-2">Procedures Performed</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-900">
                  {procedures.map((procedure, index) => (
                    <li key={index}>{procedure}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Note */}
            {discharge.discharge_summary && (
              <div>
                <div className="text-xs font-bold uppercase text-gray-500 mb-2">Summary Note</div>
                <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {discharge.discharge_summary}
                </div>
              </div>
            )}
          </PrintSection>

          {/* Section 3: Discharge Advice */}
          <PrintSection title="DISCHARGE ADVICE">
            {/* Condition on Discharge */}
            {(discharge.condition_on_discharge || discharge.final_condition) && (
              <div className="mb-4">
                <div className="text-xs font-bold uppercase text-gray-500 mb-2">Condition on Discharge</div>
                <div className="text-sm text-gray-900">
                  {discharge.condition_on_discharge || discharge.final_condition}
                </div>
              </div>
            )}

            {/* Medications (Rx) */}
            {medications.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold uppercase text-gray-500 mb-2">Medications (Rx)</div>
                <table className="w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-[10px] uppercase text-gray-600 font-semibold">Medicine Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-[10px] uppercase text-gray-600 font-semibold">Dosage</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-[10px] uppercase text-gray-600 font-semibold">Duration</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-[10px] uppercase text-gray-600 font-semibold">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">{med.name}</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">{med.dosage}</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">{med.duration}</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">{med.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Diet/Activity - if available in instructions */}
            {(discharge.instructions || discharge.follow_up_instructions) && (
              <div>
                <div className="text-xs font-bold uppercase text-gray-500 mb-2">Diet/Activity</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {discharge.instructions || discharge.follow_up_instructions}
                </div>
              </div>
            )}
          </PrintSection>

          {/* Section 4: Follow-up & Emergency */}
          <PrintSection title="FOLLOW-UP & EMERGENCY">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Review Date</div>
                <div className="text-sm font-bold text-gray-900">
                  {discharge.follow_up_date 
                    ? `${formatDate(discharge.follow_up_date)} at Outpatient Department`
                    : 'As per instructions'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Emergency Contact</div>
                <div className="text-sm font-bold text-gray-900">229461</div>
              </div>
            </div>
          </PrintSection>

      {/* Footer */}
      <PrintFooter showTimestamp={true} />
    </PrintModalShell>
  )

  return (
    <>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}