"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintGrid, PrintFooter } from "./print-layout"
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

// Helper function to filter out UUIDs from display values
const filterUUID = (value: string | undefined | null, fallback: string = '-'): string => {
  if (!value) return fallback
  if (isUUID(value)) return fallback
  return value
}

interface CasePrintProps {
  caseData: {
    id?: string
    case_no: string
    case_date?: string
    encounter_date?: string
    patient_name?: string
    patient_id?: string
    visit_type?: string
    visit_no?: string
    age?: number
    gender?: string
    state?: string
    mobile?: string
    address?: string
    doctor_name?: string
    chief_complaint?: string
    history_of_present_illness?: string
    history_present_illness?: string
    past_medical_history?: string
    examination_findings?: string
    diagnosis?: string | string[]
    treatment_plan?: string
    medications_prescribed?: string
    follow_up_instructions?: string
    status?: string
    follow_up_date?: string
    notes?: string
    advice_remarks?: string
    // Past History
    past_history_treatments?: Array<{
      treatment?: string
      years?: string
    }>
    past_history_medicines?: Array<{
      medicine_id?: string
      medicine_name?: string
      type?: string
      advice?: string
      duration?: string
      eye?: string
    }>
    past_medications?: Array<{
      medicine_name?: string
      type?: string
      duration?: string
      eye?: string
    }>
    // Complaints
    complaints?: Array<{
      complaintId?: string
      categoryId?: string
      eye?: string
      duration?: string
      notes?: string
      complaint_name?: string
    }>
    // Vision & Refraction
    vision_data?: {
      unaided?: { right?: string; left?: string }
      pinhole?: { right?: string; left?: string }
      aided?: { right?: string; left?: string }
      near?: { right?: string; left?: string }
    }
    refraction_data?: {
      distant?: {
        right?: { sph?: string; cyl?: string; axis?: string; va?: string }
        left?: { sph?: string; cyl?: string; axis?: string; va?: string }
      }
      near?: {
        right?: { sph?: string; cyl?: string; axis?: string; va?: string }
        left?: { sph?: string; cyl?: string; axis?: string; va?: string }
      }
      pg?: {
        right?: { sph?: string; cyl?: string; axis?: string; va?: string }
        left?: { sph?: string; cyl?: string; axis?: string; va?: string }
      }
      purpose?: string
      quality?: string
      remark?: string
    }
    // Legacy refraction fields (for backward compatibility)
    refraction_distant_sph_right?: string
    refraction_distant_cyl_right?: string
    refraction_distant_axis_right?: string
    refraction_distant_va_right?: string
    refraction_distant_sph_left?: string
    refraction_distant_cyl_left?: string
    refraction_distant_axis_left?: string
    refraction_distant_va_left?: string
    refraction_near_sph_right?: string
    refraction_near_cyl_right?: string
    refraction_near_axis_right?: string
    refraction_near_va_right?: string
    refraction_near_sph_left?: string
    refraction_near_cyl_left?: string
    refraction_near_axis_left?: string
    refraction_near_va_left?: string
    refraction_pg_sph_right?: string
    refraction_pg_cyl_right?: string
    refraction_pg_axis_right?: string
    refraction_pg_va_right?: string
    refraction_pg_sph_left?: string
    refraction_pg_cyl_left?: string
    refraction_pg_axis_left?: string
    refraction_pg_va_left?: string
    refraction_purpose?: string
    refraction_quality?: string
    refraction_remark?: string
    // Examination
    examination_data?: {
      anterior_segment?: {
        eyelids_right?: string
        eyelids_left?: string
        conjunctiva_right?: string
        conjunctiva_left?: string
        cornea_right?: string
        cornea_left?: string
        anterior_chamber_right?: string
        anterior_chamber_left?: string
        iris_right?: string
        iris_left?: string
        lens_right?: string
        lens_left?: string
        remarks?: string
      }
      posterior_segment?: {
        vitreous_right?: string
        vitreous_left?: string
        disc_right?: string
        disc_left?: string
        retina_right?: string
        retina_left?: string
        remarks?: string
      }
      tests?: {
        iop?: {
          right?: { id?: string; value?: string }
          left?: { id?: string; value?: string }
        }
      }
    }
    // Legacy examination fields
    eyelids_right?: string
    eyelids_left?: string
    conjunctiva_right?: string
    conjunctiva_left?: string
    cornea_right?: string
    cornea_left?: string
    anterior_chamber_right?: string
    anterior_chamber_left?: string
    iris_right?: string
    iris_left?: string
    lens_right?: string
    lens_left?: string
    anterior_remarks?: string
    vitreous_right?: string
    vitreous_left?: string
    disc_right?: string
    disc_left?: string
    retina_right?: string
    retina_left?: string
    posterior_remarks?: string
    // Blood Investigation
    blood_tests?: string[]
    blood_pressure?: string
    blood_sugar?: string
    // Diagnostic Tests
    iop_right?: string
    iop_left?: string
    sac_test_right?: string
    sac_test_left?: string
    sac_test?: string // Legacy field for backwards compatibility
    diagnostic_tests?: Array<{
      test_id?: string
      test_name?: string
      eye?: string
      type?: string
      problem?: string
      notes?: string
    }>
    // Advice
    medicines?: Array<{
      drug_name?: string
      drug_id?: string
      eye?: string
      dosage?: string
      dosage_id?: string
      route?: string
      route_id?: string
      duration?: string
      quantity?: string
      frequency?: string
    }>
    surgeries?: Array<{
      eye?: string
      surgery_name?: string
      anesthesia?: string
    }>
    treatments?: Array<{
      drug_id?: string
      dosage_id?: string
      route_id?: string
      duration?: string
      eye?: string
      quantity?: string
      drug_name?: string
      dosage_name?: string
      route_name?: string
    }>
  }
  children: React.ReactNode
}

export function CasePrint({ caseData, children }: CasePrintProps) {
  const masterData = useMasterData()
  const [dataLoaded, setDataLoaded] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Load eye selection data when component mounts
  React.useEffect(() => {
    if (!dataLoaded && masterData.data.eyeSelection.length === 0) {
      masterData.fetchCategory('eyeSelection')
      setDataLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded])

  // Helper to resolve eye UUID to label
  const getEyeLabel = (eyeId: string | undefined | null): string => {
    if (!eyeId) return ''
    // Check if it's already a label (not a UUID)
    if (!isUUID(eyeId)) return eyeId
    // Try to resolve from master data
    const eyeOption = masterData.data.eyeSelection.find(opt => opt.value === eyeId)
    return eyeOption?.label || eyeId
  }

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


  // Helper to get refraction value (supports both new structure and legacy fields)
  const getRefractionValue = (
    type: 'distant' | 'near' | 'pg',
    eye: 'right' | 'left',
    field: 'sph' | 'cyl' | 'axis' | 'va'
  ): string => {
    // Try new structure first
    if (caseData.refraction_data?.[type]?.[eye]?.[field]) {
      return caseData.refraction_data[type][eye][field] || '-'
    }
    // Fall back to legacy fields
    const legacyField = `refraction_${type}_${field}_${eye}` as keyof typeof caseData
    return caseData[legacyField] as string || '-'
  }

  // Helper to get examination field (supports both new structure and legacy fields)
  const getExaminationField = (
    segment: 'anterior' | 'posterior',
    field: string,
    eye?: 'right' | 'left'
  ): string | undefined => {
    const segmentData = caseData.examination_data?.[`${segment}_segment` as 'anterior_segment' | 'posterior_segment']
    if (segmentData && eye) {
      return segmentData[`${field}_${eye}` as keyof typeof segmentData] as string | undefined
    }
    if (segmentData && !eye) {
      return segmentData[field as keyof typeof segmentData] as string | undefined
    }
    // Fall back to legacy fields
    if (eye) {
      const legacyField = `${field}_${eye}` as keyof typeof caseData
      return caseData[legacyField] as string | undefined
    }
    const legacyField = `${segment}_${field}` as keyof typeof caseData
    return caseData[legacyField] as string | undefined
  }

  // Check if any examination data exists
  const hasExaminationData = () => {
    const anterior = caseData.examination_data?.anterior_segment
    const posterior = caseData.examination_data?.posterior_segment
    if (anterior || posterior) return true
    
    // Check legacy fields
    return !!(
      caseData.eyelids_right || caseData.eyelids_left ||
      caseData.conjunctiva_right || caseData.conjunctiva_left ||
      caseData.cornea_right || caseData.cornea_left ||
      caseData.anterior_chamber_right || caseData.anterior_chamber_left ||
      caseData.iris_right || caseData.iris_left ||
      caseData.lens_right || caseData.lens_left ||
      caseData.vitreous_right || caseData.vitreous_left ||
      caseData.disc_right || caseData.disc_left ||
      caseData.retina_right || caseData.retina_left
    )
  }

  // Get IOP values
  const getIOP = (eye: 'right' | 'left'): string => {
    const iopValue = caseData.examination_data?.tests?.iop?.[eye]?.value
    if (iopValue) return iopValue
    return eye === 'right' ? (caseData.iop_right || '-') : (caseData.iop_left || '-')
  }

  // Get SAC test values
  const getSACTest = (eye: 'right' | 'left'): string => {
    const sacValue = caseData.examination_data?.tests?.sac_test?.[eye]
    if (sacValue) {
      // Try to resolve from master data if it's a UUID
      if (isUUID(sacValue)) {
        const sacOption = masterData.data.sacStatus?.find((opt: any) => opt.value === sacValue)
        return sacOption?.label || sacValue
      }
      return sacValue
    }
    // Backwards compatibility: check for old single sac_test field
    if (eye === 'right' && caseData.sac_test) {
      return caseData.sac_test
    }
    return '-'
  }

  // Check if refraction data exists
  const hasRefractionData = () => {
    if (caseData.refraction_data) return true
    return !!(
      caseData.refraction_distant_sph_right || caseData.refraction_distant_sph_left ||
      caseData.refraction_near_sph_right || caseData.refraction_near_sph_left ||
      caseData.refraction_pg_sph_right || caseData.refraction_pg_sph_left
    )
  }

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
      title={`Case_${caseData.case_no}`}
    >
      <PrintHeader />
      
      {/* Centered Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900">
          OPHTHALMOLOGY CASE RECORD
        </h2>
      </div>

      {/* Main Content */}
      <div className="print-case-report space-y-6 font-serif">
              
              {/* BLOCK 1: REGISTRATION & HISTORY */}
              <div className="mb-6">
                {/* 4-Column Grid: Case No | Case Date | Visit Type | Patient ID */}
                <div className="grid grid-cols-4 gap-4 mb-4 border-b border-gray-300 pb-3">
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Case No</div>
                    <div className="text-sm font-bold text-gray-900">{caseData.case_no || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Case Date</div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatDate(caseData.case_date || caseData.encounter_date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Visit Type</div>
                    <div className="text-sm font-bold text-gray-900">{caseData.visit_type || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Patient ID</div>
                    <div className="text-sm font-bold text-gray-900">{caseData.patient_id || '-'}</div>
                  </div>
                </div>

                {/* Chief Complaint */}
                {caseData.chief_complaint && (
                  <div className="mb-3">
                    <div className="text-xs font-bold text-black mb-1">Chief Complaint:</div>
                    <div className="text-xs text-black leading-relaxed">{caseData.chief_complaint}</div>
                  </div>
                )}

                {/* HPI */}
                {(caseData.history_of_present_illness || caseData.history_present_illness) && (
                  <div className="mb-3">
                    <div className="text-xs font-bold text-black mb-1">HPI:</div>
                    <div className="text-xs text-black leading-relaxed">
                      {caseData.history_of_present_illness || caseData.history_present_illness}
                    </div>
                  </div>
                )}
              </div>

              {/* BLOCK 2: PAST HISTORY (Treatments/Meds) */}
              {((caseData.past_history_treatments && caseData.past_history_treatments.length > 0) ||
                (caseData.past_history_medicines && caseData.past_history_medicines.length > 0) ||
                (caseData.past_medications && caseData.past_medications.length > 0)) && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    PAST HISTORY
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left: Past Treatments */}
                    {(caseData.past_history_treatments && caseData.past_history_treatments.length > 0) && (
                      <div>
                        <div className="text-xs font-bold text-black mb-2">Past Treatments:</div>
                        <ul className="text-xs text-black list-disc list-inside space-y-1">
                          {caseData.past_history_treatments.map((treatment, idx) => (
                            <li key={idx}>
                              {treatment.treatment || '-'}
                              {treatment.years && ` (${treatment.years} years)`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Right: Past Medications */}
                    {((caseData.past_history_medicines && caseData.past_history_medicines.length > 0) ||
                      (caseData.past_medications && caseData.past_medications.length > 0)) && (
                      <div>
                        <div className="text-xs font-bold text-black mb-2">Past Medications:</div>
                        <ul className="text-xs text-black list-disc list-inside space-y-1">
                          {(caseData.past_history_medicines || caseData.past_medications || []).map((med, idx) => {
                            const eyeLabel = getEyeLabel(med.eye)
                            const medName = filterUUID(med.medicine_name, '-')
                            return (
                              <li key={idx}>
                                {medName}
                                {med.type && ` (${med.type})`}
                                {med.duration && ` - ${med.duration}`}
                                {eyeLabel && ` - ${eyeLabel}`}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOCK 3: COMPLAINTS */}
                  {caseData.complaints && caseData.complaints.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    COMPLAINTS
                  </div>
                  <table className="w-full border-collapse border border-black" style={{ fontSize: '10pt' }}>
                    <thead>
                      <tr>
                        <th className="border border-black p-2 text-left font-bold">Complaint</th>
                        <th className="border border-black p-2 text-center font-bold">Eye</th>
                        <th className="border border-black p-2 text-center font-bold">Duration</th>
                        <th className="border border-black p-2 text-left font-bold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caseData.complaints.map((complaint, idx) => {
                        const eyeLabel = getEyeLabel(complaint.eye)
                        const complaintName = filterUUID(complaint.complaint_name, complaint.notes || '-')
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="border border-black p-2">{complaintName}</td>
                            <td className="border border-black p-2 text-center">{eyeLabel || '-'}</td>
                            <td className="border border-black p-2 text-center">{complaint.duration || '-'}</td>
                            <td className="border border-black p-2">{complaint.notes || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
              </div>
            )}

              {/* BLOCK 4: VISION & REFRACTION */}
              {(caseData.vision_data || hasRefractionData()) && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    VISION & REFRACTION
                </div>
                  
                  {/* Table A: Acuity */}
                  {caseData.vision_data && (
                    <div className="mb-4">
                      <table className="w-full border-collapse border border-black mb-4" style={{ fontSize: '10pt' }}>
                  <thead>
                    <tr>
                            <th className="border border-black p-2 text-left font-bold">Label</th>
                            <th className="border border-black p-2 text-center font-bold">Right Eye (OD)</th>
                            <th className="border border-black p-2 text-center font-bold">Left Eye (OS)</th>
                    </tr>
                  </thead>
                  <tbody>
                          {(caseData.vision_data.unaided?.right || caseData.vision_data.unaided?.left) && (
                            <tr>
                              <td className="border border-black p-2">Unaided</td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.unaided?.right || '-'}
                        </td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.unaided?.left || '-'}
                        </td>
                      </tr>
                    )}
                          {(caseData.vision_data.pinhole?.right || caseData.vision_data.pinhole?.left) && (
                            <tr>
                              <td className="border border-black p-2">Pinhole</td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.pinhole?.right || '-'}
                        </td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.pinhole?.left || '-'}
                        </td>
                      </tr>
                    )}
                          {(caseData.vision_data.aided?.right || caseData.vision_data.aided?.left) && (
                            <tr>
                              <td className="border border-black p-2">Aided</td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.aided?.right || '-'}
                        </td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.aided?.left || '-'}
                        </td>
                      </tr>
                    )}
                          {(caseData.vision_data.near?.right || caseData.vision_data.near?.left) && (
                            <tr>
                              <td className="border border-black p-2">Near</td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.near?.right || '-'}
                        </td>
                              <td className="border border-black p-2 text-center">
                                {caseData.vision_data.near?.left || '-'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

                  {/* Table B: Refraction */}
                  {hasRefractionData() && (
                    <div className="mb-4">
                      <table className="w-full border-collapse border border-black mb-2" style={{ fontSize: '10pt' }}>
                        <thead>
                          <tr>
                            <th className="border border-black p-2 text-left font-bold">Eye</th>
                            <th className="border border-black p-2 text-center font-bold">SPH</th>
                            <th className="border border-black p-2 text-center font-bold">CYL</th>
                            <th className="border border-black p-2 text-center font-bold">AXIS</th>
                            <th className="border border-black p-2 text-center font-bold">VA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Right Eye - Distant / Near / PG */}
                          {(getRefractionValue('distant', 'right', 'sph') !== '-' ||
                            getRefractionValue('near', 'right', 'sph') !== '-' ||
                            getRefractionValue('pg', 'right', 'sph') !== '-') && (
                            <tr>
                              <td className="border border-black p-2 font-semibold">Right Eye</td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'right', 'sph') !== '-' && `D: ${getRefractionValue('distant', 'right', 'sph')}`,
                                  getRefractionValue('near', 'right', 'sph') !== '-' && `N: ${getRefractionValue('near', 'right', 'sph')}`,
                                  getRefractionValue('pg', 'right', 'sph') !== '-' && `PG: ${getRefractionValue('pg', 'right', 'sph')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'right', 'cyl') !== '-' && `D: ${getRefractionValue('distant', 'right', 'cyl')}`,
                                  getRefractionValue('near', 'right', 'cyl') !== '-' && `N: ${getRefractionValue('near', 'right', 'cyl')}`,
                                  getRefractionValue('pg', 'right', 'cyl') !== '-' && `PG: ${getRefractionValue('pg', 'right', 'cyl')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'right', 'axis') !== '-' && `D: ${getRefractionValue('distant', 'right', 'axis')}`,
                                  getRefractionValue('near', 'right', 'axis') !== '-' && `N: ${getRefractionValue('near', 'right', 'axis')}`,
                                  getRefractionValue('pg', 'right', 'axis') !== '-' && `PG: ${getRefractionValue('pg', 'right', 'axis')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'right', 'va') !== '-' && `D: ${getRefractionValue('distant', 'right', 'va')}`,
                                  getRefractionValue('near', 'right', 'va') !== '-' && `N: ${getRefractionValue('near', 'right', 'va')}`,
                                  getRefractionValue('pg', 'right', 'va') !== '-' && `PG: ${getRefractionValue('pg', 'right', 'va')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                            </tr>
                          )}
                          {/* Left Eye - Distant / Near / PG */}
                          {(getRefractionValue('distant', 'left', 'sph') !== '-' ||
                            getRefractionValue('near', 'left', 'sph') !== '-' ||
                            getRefractionValue('pg', 'left', 'sph') !== '-') && (
                            <tr>
                              <td className="border border-black p-2 font-semibold">Left Eye</td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'left', 'sph') !== '-' && `D: ${getRefractionValue('distant', 'left', 'sph')}`,
                                  getRefractionValue('near', 'left', 'sph') !== '-' && `N: ${getRefractionValue('near', 'left', 'sph')}`,
                                  getRefractionValue('pg', 'left', 'sph') !== '-' && `PG: ${getRefractionValue('pg', 'left', 'sph')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'left', 'cyl') !== '-' && `D: ${getRefractionValue('distant', 'left', 'cyl')}`,
                                  getRefractionValue('near', 'left', 'cyl') !== '-' && `N: ${getRefractionValue('near', 'left', 'cyl')}`,
                                  getRefractionValue('pg', 'left', 'cyl') !== '-' && `PG: ${getRefractionValue('pg', 'left', 'cyl')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'left', 'axis') !== '-' && `D: ${getRefractionValue('distant', 'left', 'axis')}`,
                                  getRefractionValue('near', 'left', 'axis') !== '-' && `N: ${getRefractionValue('near', 'left', 'axis')}`,
                                  getRefractionValue('pg', 'left', 'axis') !== '-' && `PG: ${getRefractionValue('pg', 'left', 'axis')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                              <td className="border border-black p-2 text-center text-xs">
                                {[
                                  getRefractionValue('distant', 'left', 'va') !== '-' && `D: ${getRefractionValue('distant', 'left', 'va')}`,
                                  getRefractionValue('near', 'left', 'va') !== '-' && `N: ${getRefractionValue('near', 'left', 'va')}`,
                                  getRefractionValue('pg', 'left', 'va') !== '-' && `PG: ${getRefractionValue('pg', 'left', 'va')}`
                                ].filter(Boolean).join(' / ') || '-'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      {/* Footer: Purpose, Quality, Remark */}
                      {(caseData.refraction_data?.purpose || caseData.refraction_data?.quality || caseData.refraction_data?.remark ||
                        caseData.refraction_purpose || caseData.refraction_quality || caseData.refraction_remark) && (
                        <div className="text-xs text-black mt-2 space-y-1">
                          {caseData.refraction_data?.purpose || caseData.refraction_purpose ? (
                            <div><strong>Purpose:</strong> {caseData.refraction_data?.purpose || caseData.refraction_purpose}</div>
                          ) : null}
                          {caseData.refraction_data?.quality || caseData.refraction_quality ? (
                            <div><strong>Quality:</strong> {caseData.refraction_data?.quality || caseData.refraction_quality}</div>
                          ) : null}
                          {caseData.refraction_data?.remark || caseData.refraction_remark ? (
                            <div><strong>Remark:</strong> {caseData.refraction_data?.remark || caseData.refraction_remark}</div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BLOCK 5: EXAMINATION */}
              {hasExaminationData() && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    EXAMINATION
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                  {/* Anterior Segment */}
                    <div>
                      <div className="text-xs font-bold text-black mb-2">ANTERIOR SEGMENT</div>
                      <div className="text-xs text-black space-y-1">
                        {(() => {
                          const eyelidsRE = getExaminationField('anterior', 'eyelids', 'right')
                          const eyelidsLE = getExaminationField('anterior', 'eyelids', 'left')
                          if (eyelidsRE || eyelidsLE) {
                            return <div><strong>Eyelids:</strong> {eyelidsRE || '-'} / {eyelidsLE || '-'}</div>
                          }
                          return null
                        })()}
                        {(() => {
                          const conjunctivaRE = getExaminationField('anterior', 'conjunctiva', 'right')
                          const conjunctivaLE = getExaminationField('anterior', 'conjunctiva', 'left')
                          if (conjunctivaRE || conjunctivaLE) {
                            return <div><strong>Conjunctiva:</strong> {conjunctivaRE || '-'} / {conjunctivaLE || '-'}</div>
                          }
                          return null
                        })()}
                        {(() => {
                          const corneaRE = getExaminationField('anterior', 'cornea', 'right')
                          const corneaLE = getExaminationField('anterior', 'cornea', 'left')
                          if (corneaRE || corneaLE) {
                            return <div><strong>Cornea:</strong> {corneaRE || '-'} / {corneaLE || '-'}</div>
                          }
                          return null
                        })()}
                        {(() => {
                          const acRE = getExaminationField('anterior', 'anterior_chamber', 'right')
                          const acLE = getExaminationField('anterior', 'anterior_chamber', 'left')
                          if (acRE || acLE) {
                            return <div><strong>Anterior Chamber:</strong> {acRE || '-'} / {acLE || '-'}</div>
                          }
                          return null
                        })()}
                        {(() => {
                          const irisRE = getExaminationField('anterior', 'iris', 'right')
                          const irisLE = getExaminationField('anterior', 'iris', 'left')
                          if (irisRE || irisLE) {
                            return <div><strong>Iris:</strong> {irisRE || '-'} / {irisLE || '-'}</div>
                          }
                          return null
                        })()}
                        {(() => {
                          const lensRE = getExaminationField('anterior', 'lens', 'right')
                          const lensLE = getExaminationField('anterior', 'lens', 'left')
                          if (lensRE || lensLE) {
                            return <div><strong>Lens:</strong> {lensRE || '-'} / {lensLE || '-'}</div>
                          }
                          return null
                        })()}
                        {getExaminationField('anterior', 'remarks') && (
                          <div><strong>Remarks:</strong> {getExaminationField('anterior', 'remarks')}</div>
                        )}
                      </div>
                    </div>
                  {/* Posterior Segment */}
                    <div>
                      <div className="text-xs font-bold text-black mb-2">POSTERIOR SEGMENT</div>
                      <div className="text-xs text-black space-y-1">
                        {(() => {
                          const vitreousRE = getExaminationField('posterior', 'vitreous', 'right')
                          const vitreousLE = getExaminationField('posterior', 'vitreous', 'left')
                          if (vitreousRE || vitreousLE) {
                            return <div><strong>Vitreous:</strong> {vitreousRE || '-'} / {vitreousLE || '-'}</div>
                          }
                          return null
                        })()}
                        {(() => {
                          const discRE = getExaminationField('posterior', 'disc', 'right')
                          const discLE = getExaminationField('posterior', 'disc', 'left')
                          if (discRE || discLE) {
                            return <div><strong>Disc:</strong> {discRE || '-'} / {discLE || '-'}</div>
                          }
                          return null
                        })()}
                        {(() => {
                          const retinaRE = getExaminationField('posterior', 'retina', 'right')
                          const retinaLE = getExaminationField('posterior', 'retina', 'left')
                          if (retinaRE || retinaLE) {
                            return <div><strong>Retina:</strong> {retinaRE || '-'} / {retinaLE || '-'}</div>
                          }
                          return null
                        })()}
                        {getExaminationField('posterior', 'remarks') && (
                          <div><strong>Remarks:</strong> {getExaminationField('posterior', 'remarks')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BLOCK 6: BLOOD INVESTIGATION */}
              {caseData.blood_tests && caseData.blood_tests.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    BLOOD INVESTIGATION
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {caseData.blood_tests.map((test, idx) => {
                      const testName = filterUUID(test, test)
                      return (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 border border-gray-300 rounded"
                        >
                          {testName}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* BLOCK 7: DIAGNOSIS & TESTS */}
              {(caseData.diagnosis || getIOP('right') !== '-' || getIOP('left') !== '-' || getSACTest('right') !== '-' || getSACTest('left') !== '-' || 
                (caseData.diagnostic_tests && caseData.diagnostic_tests.length > 0)) && (
                <div className="mb-6">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    DIAGNOSIS & TESTS
                  </div>
                  
                  {/* Provisional Diagnosis */}
                  {caseData.diagnosis && (
                    <div className="mb-4 p-3 border-2 border-black bg-white">
                      <div className="text-xs font-bold text-black mb-1">Provisional Diagnosis:</div>
                      <div className="text-sm font-bold text-black">
                        {Array.isArray(caseData.diagnosis) ? caseData.diagnosis.join(', ') : caseData.diagnosis}
                      </div>
                    </div>
                  )}

                  {/* Tests Grid */}
                  {(getIOP('right') !== '-' || getIOP('left') !== '-' || getSACTest('right') !== '-' || getSACTest('left') !== '-' || 
                    (caseData.diagnostic_tests && caseData.diagnostic_tests.length > 0)) && (
                    <div className="space-y-3">
                      {/* SAC Syringing */}
                      {(getSACTest('right') !== '-' || getSACTest('left') !== '-') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-bold text-black mb-1">SAC Syringing:</div>
                            <div className="text-xs text-black">
                              Right: {getSACTest('right')} | Left: {getSACTest('left')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* IOP */}
                      {(getIOP('right') !== '-' || getIOP('left') !== '-') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-bold text-black mb-1">IOP:</div>
                            <div className="text-xs text-black">
                              Right: {getIOP('right')} | Left: {getIOP('left')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Tests */}
                      {caseData.diagnostic_tests && caseData.diagnostic_tests.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-black mb-2">Additional Tests:</div>
                          <ul className="text-xs text-black list-disc list-inside space-y-1">
                            {caseData.diagnostic_tests.map((test, idx) => {
                              const testName = filterUUID(test.test_name || test.test_id, 'Test')
                              const eyeLabel = getEyeLabel(test.eye)
                              return (
                                <li key={idx}>
                                  {testName}
                                  {eyeLabel && ` (${eyeLabel})`}
                                  {test.type && ` - Type: ${test.type}`}
                                  {test.problem && ` - Problem: ${test.problem}`}
                                  {test.notes && ` - Notes: ${test.notes}`}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BLOCK 8: ADVICE (Rx & Surgery) */}
              {((caseData.medicines && caseData.medicines.length > 0) ||
                (caseData.treatments && caseData.treatments.length > 0) ||
                (caseData.surgeries && caseData.surgeries.length > 0) ||
                caseData.advice_remarks) && (
              <div className="mb-6">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    ADVICE
                  </div>

                  {/* Prescription Table */}
                  {((caseData.medicines && caseData.medicines.length > 0) ||
                    (caseData.treatments && caseData.treatments.length > 0)) && (
                    <div className="mb-4">
                      <div className="text-xs font-bold text-black mb-2">Prescription:</div>
                  <table className="w-full border-collapse border border-black" style={{ fontSize: '10pt' }}>
                    <thead>
                      <tr>
                            <th className="border border-black p-2 text-left font-bold">Medicine</th>
                            <th className="border border-black p-2 text-center font-bold">Eye</th>
                            <th className="border border-black p-2 text-center font-bold">Dosage</th>
                            <th className="border border-black p-2 text-center font-bold">Freq</th>
                            <th className="border border-black p-2 text-center font-bold">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                          {(caseData.medicines || caseData.treatments || []).map((medicine, idx) => {
                        const eyeLabel = getEyeLabel(medicine.eye)
                        const drugName = filterUUID(
                          medicine.drug_name,
                          filterUUID(medicine.drug_id, '-')
                        )
                            const dosage = filterUUID(
                              medicine.dosage || medicine.dosage_name,
                          filterUUID(medicine.dosage_id, '-')
                        )
                            const frequency = medicine.frequency || filterUUID(
                              medicine.route || medicine.route_name,
                              filterUUID(medicine.route_id, '-')
                            )
                        return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="border border-black p-2">{drugName}</td>
                                <td className="border border-black p-2 text-center">{eyeLabel || '-'}</td>
                                <td className="border border-black p-2 text-center">{dosage || '-'}</td>
                                <td className="border border-black p-2 text-center">{frequency || '-'}</td>
                                <td className="border border-black p-2 text-center">{medicine.duration || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                    </div>
                  )}

                  {/* Surgery Table */}
                  {caseData.surgeries && caseData.surgeries.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-bold text-black mb-2">Surgery:</div>
                      <table className="w-full border-collapse border border-black" style={{ fontSize: '10pt' }}>
                        <thead>
                          <tr>
                            <th className="border border-black p-2 text-left font-bold">Surgery Name</th>
                            <th className="border border-black p-2 text-center font-bold">Eye</th>
                            <th className="border border-black p-2 text-center font-bold">Anesthesia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caseData.surgeries.map((surgery, idx) => {
                            const eyeLabel = getEyeLabel(surgery.eye)
                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="border border-black p-2">{surgery.surgery_name || '-'}</td>
                                <td className="border border-black p-2 text-center">{eyeLabel || '-'}</td>
                                <td className="border border-black p-2 text-center">{surgery.anesthesia || '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Final Remarks */}
                  {caseData.advice_remarks && (
                    <div className="mt-4">
                      <div className="text-xs font-bold text-black mb-1">Final Remarks:</div>
                      <div className="text-xs text-black leading-relaxed whitespace-pre-wrap">
                        {caseData.advice_remarks}
                      </div>
                  </div>
                )}
              </div>
            )}

        {/* Standardized Footer with Doctor Signature */}
        <PrintFooter 
          doctorName={caseData.doctor_name}
          showTimestamp={true}
        />
      </div>
    </PrintModalShell>
  )

  return (
    <>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}
