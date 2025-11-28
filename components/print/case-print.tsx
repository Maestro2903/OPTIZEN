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

// Helper function to filter out UUIDs from display values (legacy - use resolveUUID in component instead)
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
        sac_test?: {
          right?: string
          left?: string
        } | string
      }
      diagrams?: {
        right?: string
        left?: string
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

  // Load necessary master data when component mounts
  React.useEffect(() => {
    if (!dataLoaded) {
      const categoriesToLoad: Array<keyof typeof masterData.data> = [
        'eyeSelection',
        'diagnosis',
        'medicines',
        'visualAcuity',
        'bloodTests',
        'sacStatus',
        'complaints',
        'diagnosticTests',
        'dosages',
        'routes',
        'surgeries',
        'surgeryTypes',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded])

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
    return '-'
  }

  // Helper to resolve diagnosis (can be string, array, or null)
  const resolveDiagnosis = (diagnosis: string | string[] | null | undefined): string => {
    if (!diagnosis) return '-'
    const diagnosisArray = Array.isArray(diagnosis) ? diagnosis : [diagnosis]
    const resolved = diagnosisArray.map(d => resolveUUID(d, 'diagnosis'))
    return resolved.join(', ')
  }

  // Helper to resolve eye UUID to label
  const getEyeLabel = (eyeId: string | undefined | null): string => {
    if (!eyeId) return ''
    return resolveUUID(eyeId, 'eyeSelection')
  }

  // Helper to resolve medicine name (UUID or string)
  const resolveMedicineName = (medicineId: string | undefined | null): string => {
    if (!medicineId) return '-'
    if (isUUID(medicineId)) {
      return resolveUUID(medicineId, 'medicines')
    }
    return medicineId
  }

  // Helper to resolve visual acuity UUID
  const resolveVisualAcuity = (acuity: string | undefined | null): string => {
    if (!acuity) return '-'
    if (isUUID(acuity)) {
      return resolveUUID(acuity, 'visualAcuity')
    }
    return acuity
  }

  // Helper to resolve blood test UUID
  const resolveBloodTest = (test: string | undefined | null): string => {
    if (!test) return '-'
    if (isUUID(test)) {
      return resolveUUID(test, 'bloodTests')
    }
    return test
  }

  const resolveComplaintName = (value: string | undefined | null): string => {
    if (!value) return '-'
    return resolveUUID(value, 'complaints')
  }

  const resolveDiagnosticTestName = (value: string | undefined | null): string => {
    if (!value) return '-'
    return resolveUUID(value, 'diagnosticTests')
  }

  const resolveDosage = (value: string | undefined | null): string => {
    if (!value) return '-'
    return resolveUUID(value, 'dosages')
  }

  const resolveRoute = (value: string | undefined | null): string => {
    if (!value) return '-'
    return resolveUUID(value, 'routes')
  }

  const resolveTreatmentName = (value: string | undefined | null): string => {
    if (!value) return '-'
    return resolveUUID(value, 'treatments')
  }

  const resolveSurgeryName = (value: string | undefined | null): string => {
    if (!value) return '-'
    return resolveUUID(value, ['surgeries', 'surgeryTypes'])
  }

  const resolveAnesthesia = (value: string | undefined | null): string => {
    if (!value) return '-'
    return resolveUUID(value, 'anesthesiaTypes')
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
    const sacTest = caseData.examination_data?.tests?.sac_test
    if (sacTest) {
      // Handle new structure (object with right/left)
      if (typeof sacTest === 'object' && !Array.isArray(sacTest)) {
        const sacValue = sacTest[eye]
        if (sacValue) {
          // Try to resolve from master data if it's a UUID
          if (isUUID(sacValue)) {
            const sacOption = masterData.data.sacStatus?.find((opt: any) => opt.value === sacValue)
            return sacOption?.label || sacValue
          }
          return sacValue
        }
      }
      // Handle legacy structure (string)
      else if (typeof sacTest === 'string') {
        // For legacy data, we can't determine which eye, so only return for right eye
        if (eye === 'right') {
          if (isUUID(sacTest)) {
            const sacOption = masterData.data.sacStatus?.find((opt: any) => opt.value === sacTest)
            return sacOption?.label || sacTest
          }
          return sacTest
        }
      }
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
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">
          OPHTHALMOLOGY CASE RECORD
        </h2>
      </div>

      {/* Main Content - Compact Mode with Global Scaling */}
      <div className="print-case-report space-y-2 font-serif text-[11px] leading-tight">
              
              {/* BLOCK 1: REGISTRATION & HISTORY */}
              <div className="mb-2 break-inside-avoid">
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
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Patient Name</div>
                    <div className="text-sm font-bold text-gray-900">{caseData.patient_name || '-'}</div>
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
                <div className="mb-2 break-inside-avoid">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    PAST HISTORY
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left: Past Treatments */}
                    {(caseData.past_history_treatments && caseData.past_history_treatments.length > 0) && (
                      <div>
                        <div className="text-xs font-bold text-black mb-2">Past Treatments:</div>
                        <ul className="text-xs text-black list-disc list-inside space-y-1">
                          {caseData.past_history_treatments.map((treatment, idx) => {
                            const treatmentName = resolveTreatmentName(treatment.treatment)
                            return (
                              <li key={idx}>
                                {treatmentName !== '-' ? treatmentName : '-'}
                                {treatment.years && ` (${treatment.years} years)`}
                              </li>
                            )
                          })}
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
                            const medName = resolveMedicineName(med.medicine_name || (med as any).medicine_id)
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
                <div className="mb-2 break-inside-avoid">
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
                        const resolvedComplaint = resolveComplaintName(complaint.complaint_name || complaint.complaintId)
                        const complaintName = resolvedComplaint !== '-' ? resolvedComplaint : (complaint.notes || '-')
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
                <div className="mb-2 break-inside-avoid">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    VISION & REFRACTION
                  </div>
                  
                  <div className="grid grid-cols-12 gap-4">
                    {/* Left (Col-span-5): Visual Acuity Table */}
                    {caseData.vision_data && (
                      <div className="col-span-5">
                        <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
                          <thead>
                            <tr>
                              <th className="border border-black p-1 text-left font-bold">Label</th>
                              <th className="border border-black p-1 text-center font-bold text-xs">Right</th>
                              <th className="border border-black p-1 text-center font-bold text-xs">Left</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(caseData.vision_data.unaided?.right || caseData.vision_data.unaided?.left) && (
                              <tr>
                                <td className="border border-black p-1 text-xs">Unaided</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.unaided?.right)}</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.unaided?.left)}</td>
                              </tr>
                            )}
                            {(caseData.vision_data.pinhole?.right || caseData.vision_data.pinhole?.left) && (
                              <tr>
                                <td className="border border-black p-1 text-xs">Pinhole</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.pinhole?.right)}</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.pinhole?.left)}</td>
                              </tr>
                            )}
                            {(caseData.vision_data.aided?.right || caseData.vision_data.aided?.left) && (
                              <tr>
                                <td className="border border-black p-1 text-xs">Aided</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.aided?.right)}</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.aided?.left)}</td>
                              </tr>
                            )}
                            {(caseData.vision_data.near?.right || caseData.vision_data.near?.left) && (
                              <tr>
                                <td className="border border-black p-1 text-xs">Near</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.near?.right)}</td>
                                <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(caseData.vision_data.near?.left)}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Right (Col-span-7): Refraction Table */}
                      {hasRefractionData() && (
                        <div className="col-span-7">
                          <table className="w-full border-collapse border border-black" style={{ fontSize: '8pt' }}>
                            <thead>
                              <tr>
                                <th className="border border-black p-0.5 text-left font-bold text-[9px]">Eye</th>
                                <th className="border border-black p-0.5 text-center font-bold text-[9px]">SPH</th>
                                <th className="border border-black p-0.5 text-center font-bold text-[9px]">CYL</th>
                                <th className="border border-black p-0.5 text-center font-bold text-[9px]">AXIS</th>
                                <th className="border border-black p-0.5 text-center font-bold text-[9px]">VA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Right Eye */}
                              {(getRefractionValue('distant', 'right', 'sph') !== '-' ||
                                getRefractionValue('near', 'right', 'sph') !== '-' ||
                                getRefractionValue('pg', 'right', 'sph') !== '-') && (
                                <tr>
                                  <td className="border border-black p-0.5 text-[9px] font-semibold">Right Eye</td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'right', 'sph') !== '-' && `D: ${getRefractionValue('distant', 'right', 'sph')}`,
                                    getRefractionValue('near', 'right', 'sph') !== '-' && `N: ${getRefractionValue('near', 'right', 'sph')}`
                                  ].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'right', 'cyl') !== '-' && `D: ${getRefractionValue('distant', 'right', 'cyl')}`,
                                    getRefractionValue('near', 'right', 'cyl') !== '-' && `N: ${getRefractionValue('near', 'right', 'cyl')}`
                                  ].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'right', 'axis') !== '-' && `D: ${getRefractionValue('distant', 'right', 'axis')}`,
                                    getRefractionValue('near', 'right', 'axis') !== '-' && `N: ${getRefractionValue('near', 'right', 'axis')}`
                                  ].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'right', 'va') !== '-' && `D: ${getRefractionValue('distant', 'right', 'va')}`,
                                    getRefractionValue('near', 'right', 'va') !== '-' && `N: ${getRefractionValue('near', 'right', 'va')}`
                                  ].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  </tr>
                                  )}
                                  {/* Left Eye */}
                                  {(getRefractionValue('distant', 'left', 'sph') !== '-' ||
                                  getRefractionValue('near', 'left', 'sph') !== '-' ||
                                  getRefractionValue('pg', 'left', 'sph') !== '-') && (
                                  <tr>
                                  <td className="border border-black p-0.5 text-[9px] font-semibold">Left Eye</td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'left', 'sph') !== '-' && `D: ${getRefractionValue('distant', 'left', 'sph')}`,
                                    getRefractionValue('near', 'left', 'sph') !== '-' && `N: ${getRefractionValue('near', 'left', 'sph')}`
                                  ].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'left', 'cyl') !== '-' && `D: ${getRefractionValue('distant', 'left', 'cyl')}`,
                                    getRefractionValue('near', 'left', 'cyl') !== '-' && `N: ${getRefractionValue('near', 'left', 'cyl')}`
                                  ].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'left', 'axis') !== '-' && `D: ${getRefractionValue('distant', 'left', 'axis')}`,
                                    getRefractionValue('near', 'left', 'axis') !== '-' && `N: ${getRefractionValue('near', 'left', 'axis')}`
                                  ].filter(Boolean).join(' / ') || '-'}
                                  </td>
                                  <td className="border border-black p-0.5 text-center text-[9px]">
                                  {[
                                    getRefractionValue('distant', 'left', 'va') !== '-' && `D: ${getRefractionValue('distant', 'left', 'va')}`,
                                    getRefractionValue('near', 'left', 'va') !== '-' && `N: ${getRefractionValue('near', 'left', 'va')}`
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
                          </div>
                          )}

              {/* BLOCK 5: EXAMINATION & DIAGRAMS - Split Panel Layout */}
              {(hasExaminationData() || (caseData.examination_data?.diagrams && 
               (caseData.examination_data.diagrams.right || caseData.examination_data.diagrams.left))) && (
                <div className="mb-2 break-inside-avoid">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-1 tracking-widest">
                    EXAMINATION
                  </div>
                  
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* LEFT COLUMN (Col-span-7): Examination Text */}
                    {hasExaminationData() && (
                      <div className="col-span-7">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                          {/* Right Eye Fields */}
                          {(() => {
                            const eyelidsRE = getExaminationField('anterior', 'eyelids', 'right')
                            if (eyelidsRE) return <><div className="font-bold text-gray-600">Lids (OD):</div><div>{eyelidsRE}</div></>
                            return null
                          })()}
                          {(() => {
                            const corneaRE = getExaminationField('anterior', 'cornea', 'right')
                            if (corneaRE) return <><div className="font-bold text-gray-600">Cornea (OD):</div><div>{corneaRE}</div></>
                            return null
                          })()}
                          {(() => {
                            const lensRE = getExaminationField('anterior', 'lens', 'right')
                            if (lensRE) return <><div className="font-bold text-gray-600">Lens (OD):</div><div>{lensRE}</div></>
                            return null
                          })()}
                          {(() => {
                            const discRE = getExaminationField('posterior', 'disc', 'right')
                            if (discRE) return <><div className="font-bold text-gray-600">Disc (OD):</div><div>{discRE}</div></>
                            return null
                          })()}
                          
                          {/* Left Eye Fields */}
                          {(() => {
                            const eyelidsLE = getExaminationField('anterior', 'eyelids', 'left')
                            if (eyelidsLE) return <><div className="font-bold text-gray-600">Lids (OS):</div><div>{eyelidsLE}</div></>
                            return null
                          })()}
                          {(() => {
                            const corneaLE = getExaminationField('anterior', 'cornea', 'left')
                            if (corneaLE) return <><div className="font-bold text-gray-600">Cornea (OS):</div><div>{corneaLE}</div></>
                            return null
                          })()}
                          {(() => {
                            const lensLE = getExaminationField('anterior', 'lens', 'left')
                            if (lensLE) return <><div className="font-bold text-gray-600">Lens (OS):</div><div>{lensLE}</div></>
                            return null
                          })()}
                          {(() => {
                            const discLE = getExaminationField('posterior', 'disc', 'left')
                            if (discLE) return <><div className="font-bold text-gray-600">Disc (OS):</div><div>{discLE}</div></>
                            return null
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* RIGHT COLUMN (Col-span-5): Eye Diagrams */}
                    {caseData.examination_data?.diagrams && 
                     (caseData.examination_data.diagrams.right || caseData.examination_data.diagrams.left) && (
                      <div className="col-span-5">
                        <div className="flex flex-col gap-2">
                          {/* Right Eye Diagram */}
                          {caseData.examination_data.diagrams.right && (
                            <div className="border border-gray-300 rounded bg-gray-50 p-1">
                              <img 
                                src={caseData.examination_data.diagrams.right} 
                                alt="Right Eye Diagram" 
                                className="w-full h-32 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          {/* Left Eye Diagram */}
                          {caseData.examination_data.diagrams.left && (
                            <div className="border border-gray-300 rounded bg-gray-50 p-1">
                              <img 
                                src={caseData.examination_data.diagrams.left} 
                                alt="Left Eye Diagram" 
                                className="w-full h-32 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOCK 6: BLOOD INVESTIGATION */}
              {caseData.blood_tests && caseData.blood_tests.length > 0 && (
                <div className="mb-2 break-inside-avoid">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
                    BLOOD INVESTIGATION
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {caseData.blood_tests.map((test, idx) => {
                      const testName = resolveBloodTest(test)
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
                <div className="mb-2 break-inside-avoid">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-1 tracking-widest">
                    DIAGNOSIS & TESTS
                  </div>
                  
                  {/* Provisional Diagnosis - Prominent Box */}
                  {caseData.diagnosis && (
                    <div className="mb-2 p-2 border-l-4 border-black bg-gray-50">
                      <div className="text-[10px] font-bold uppercase text-black mb-1">Diagnosis</div>
                      <div className="text-xs font-medium text-black">
                        {resolveDiagnosis(caseData.diagnosis)}
                      </div>
                    </div>
                  )}

                  {/* Tests Grid */}
                  {(getIOP('right') !== '-' || getIOP('left') !== '-' || getSACTest('right') !== '-' || getSACTest('left') !== '-' || 
                    (caseData.diagnostic_tests && caseData.diagnostic_tests.length > 0)) && (
                    <div className="space-y-1 text-[11px]">
                      {/* SAC Syringing */}
                      {(getSACTest('right') !== '-' || getSACTest('left') !== '-') && (
                        <div>
                          <div className="font-bold text-black">SAC:</div>
                          <div className="text-black">
                            Right: {getSACTest('right')} | Left: {getSACTest('left')}
                          </div>
                        </div>
                      )}

                      {/* IOP */}
                      {(getIOP('right') !== '-' || getIOP('left') !== '-') && (
                        <div>
                          <div className="font-bold text-black">IOP:</div>
                          <div className="text-black">
                            Right: {getIOP('right')} | Left: {getIOP('left')}
                          </div>
                        </div>
                      )}

                      {/* Additional Tests */}
                      {caseData.diagnostic_tests && caseData.diagnostic_tests.length > 0 && (
                        <div>
                          <div className="font-bold text-black">Additional Tests:</div>
                          <ul className="text-black list-disc list-inside space-y-0.5">
                            {caseData.diagnostic_tests.map((test, idx) => {
                              const resolvedTestName = resolveDiagnosticTestName(test.test_name || test.test_id)
                              const testName = resolvedTestName !== '-' ? resolvedTestName : (test.notes || 'Test')
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
              <div className="mb-2 break-inside-avoid">
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
                        const drugName = resolveMedicineName(medicine.drug_name || medicine.drug_id)
                            const dosage = resolveDosage(medicine.dosage || medicine.dosage_name || medicine.dosage_id)
                            const routeValue = resolveRoute(medicine.route || medicine.route_name || medicine.route_id)
                            const frequency = medicine.frequency || (routeValue !== '-' ? routeValue : '-')
                        return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="border border-black p-2">{drugName}</td>
                                <td className="border border-black p-2 text-center">{eyeLabel || '-'}</td>
                                <td className="border border-black p-2 text-center">{dosage}</td>
                                <td className="border border-black p-2 text-center">{frequency}</td>
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
                            const surgeryName = resolveSurgeryName(
                              surgery.surgery_name ||
                              (surgery as any)?.surgery_id ||
                              (surgery as any)?.surgery_type_id ||
                              (surgery as any)?.surgery_name_id
                            )
                            const anesthesia = resolveAnesthesia(surgery.anesthesia)
                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                                <td className="border border-black p-2">{surgeryName}</td>
                                <td className="border border-black p-2 text-center">{eyeLabel || '-'}</td>
                                <td className="border border-black p-2 text-center">{anesthesia}</td>
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
