"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader } from "./print-layout"
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

interface VisionRecordPrintProps {
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
    vision_data?: {
      unaided?: { right?: string; left?: string }
      pinhole?: { right?: string; left?: string }
      aided?: { right?: string; left?: string }
      near?: { right?: string; left?: string }
    }
    examination_data?: {
      refraction?: {
        distant?: {
          sph_right?: string
          cyl_right?: string
          axis_right?: string
          va_right?: string
          sph_left?: string
          cyl_left?: string
          axis_left?: string
          va_left?: string
        }
        near?: {
          sph_right?: string
          cyl_right?: string
          axis_right?: string
          va_right?: string
          sph_left?: string
          cyl_left?: string
          axis_left?: string
          va_left?: string
        }
        pg?: {
          sph_right?: string
          cyl_right?: string
          axis_right?: string
          va_right?: string
          sph_left?: string
          cyl_left?: string
          axis_left?: string
          va_left?: string
        }
        purpose?: string
        quality?: string
        remark?: string
      }
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
      blood_investigation?: {
        blood_pressure?: string
        blood_sugar?: string
        blood_tests?: string[]
      }
    }
  }
  children: React.ReactNode
}

export function VisionRecordPrint({ recordData, children }: VisionRecordPrintProps) {
  const masterData = useMasterData()
  const [dataLoaded, setDataLoaded] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  // Load necessary master data when component mounts
  React.useEffect(() => {
    if (!dataLoaded) {
      const categoriesToLoad: Array<keyof typeof masterData.data> = [
        'visualAcuity',
        'iopRanges',
        'sacStatus',
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
    return '-'
  }

  // Helper to resolve visual acuity UUID
  const resolveVisualAcuity = (acuity: string | undefined | null): string => {
    if (!acuity) return '-'
    if (isUUID(acuity)) {
      return resolveUUID(acuity, 'visualAcuity')
    }
    return acuity
  }

  // Helper to get IOP values
  const getIOP = (eye: 'right' | 'left'): string => {
    const iopValue = recordData.examination_data?.tests?.iop?.[eye]?.value
    if (iopValue) return iopValue
    const iopId = recordData.examination_data?.tests?.iop?.[eye]?.id
    if (iopId) {
      return resolveUUID(iopId, 'iopRanges')
    }
    return '-'
  }

  // Helper to get SAC test values
  const getSACTest = (eye: 'right' | 'left'): string => {
    const sacTest = recordData.examination_data?.tests?.sac_test
    if (sacTest) {
      if (typeof sacTest === 'object' && !Array.isArray(sacTest)) {
        const sacValue = sacTest[eye]
        if (sacValue) {
          if (isUUID(sacValue)) {
            return resolveUUID(sacValue, 'sacStatus')
          }
          return sacValue
        }
      }
    }
    return '-'
  }

  // Helper to get refraction value
  const getRefractionValue = (
    type: 'distant' | 'near' | 'pg',
    eye: 'right' | 'left',
    field: 'sph' | 'cyl' | 'axis' | 'va'
  ): string => {
    const refraction = recordData.examination_data?.refraction?.[type]
    if (!refraction) return '-'
    const fieldName = `${field}_${eye}` as keyof typeof refraction
    const value = refraction[fieldName] as string | undefined
    if (field === 'va' && value) {
      return resolveVisualAcuity(value)
    }
    return value || '-'
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined | null): number | null => {
    if (!dateOfBirth) return null
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
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

  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return '-'
    return timeString
  }

  // Check if refraction data exists
  const hasRefractionData = () => {
    const refraction = recordData.examination_data?.refraction
    if (!refraction) return false
    return !!(
      refraction.distant || refraction.near || refraction.pg
    )
  }

  // Check if examination data exists
  const hasExaminationData = () => {
    const anterior = recordData.examination_data?.anterior_segment
    const posterior = recordData.examination_data?.posterior_segment
    const tests = recordData.examination_data?.tests
    if (anterior || posterior || tests) return true
    return false
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
      title={`Vision_Record_${recordData.record_number}`}
    >
      <PrintHeader />
      
      {/* Centered Title */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">
          VISION & EXAMINATION RECORD
        </h2>
      </div>

      {/* Main Content */}
      <div className="print-case-report space-y-2 font-serif text-[11px] leading-tight">
        
        {/* BLOCK 1: PATIENT & RECORD INFORMATION */}
        <div className="mb-2 break-inside-avoid">
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
              <div className="text-sm font-bold text-gray-900">{recordData.patients?.patient_id || '-'}</div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Patient Name</div>
              <div className="text-sm font-bold text-gray-900">{recordData.patients?.full_name || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Age / Gender</div>
              <div className="text-sm font-bold text-gray-900">
                {recordData.patients?.date_of_birth ? `${calculateAge(recordData.patients.date_of_birth) || '-'} yrs` : '-'}
                {recordData.patients?.gender && ` / ${recordData.patients.gender}`}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Mobile</div>
              <div className="text-sm font-bold text-gray-900">{recordData.patients?.mobile || '-'}</div>
            </div>
          </div>
          {recordData.patients?.address && (
            <div className="mb-3">
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Address</div>
              <div className="text-sm text-gray-900">{recordData.patients.address}</div>
            </div>
          )}
        </div>

        {/* BLOCK 2: VISION DATA */}
        {recordData.vision_data && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              VISION DATA
            </div>
            <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left font-bold">Label</th>
                  <th className="border border-black p-1 text-center font-bold text-xs">Right</th>
                  <th className="border border-black p-1 text-center font-bold text-xs">Left</th>
                </tr>
              </thead>
              <tbody>
                {(recordData.vision_data.unaided?.right || recordData.vision_data.unaided?.left) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Unaided</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.unaided?.right)}</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.unaided?.left)}</td>
                  </tr>
                )}
                {(recordData.vision_data.pinhole?.right || recordData.vision_data.pinhole?.left) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Pinhole</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.pinhole?.right)}</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.pinhole?.left)}</td>
                  </tr>
                )}
                {(recordData.vision_data.aided?.right || recordData.vision_data.aided?.left) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Aided</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.aided?.right)}</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.aided?.left)}</td>
                  </tr>
                )}
                {(recordData.vision_data.near?.right || recordData.vision_data.near?.left) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Near</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.near?.right)}</td>
                    <td className="border border-black p-1 text-center text-xs">{resolveVisualAcuity(recordData.vision_data.near?.left)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* BLOCK 3: REFRACTION */}
        {hasRefractionData() && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              REFRACTION
            </div>
            <table className="w-full border-collapse border border-black" style={{ fontSize: '8pt' }}>
              <thead>
                <tr>
                  <th className="border border-black p-0.5 text-left font-bold text-[9px]">Type</th>
                  <th className="border border-black p-0.5 text-left font-bold text-[9px]">Eye</th>
                  <th className="border border-black p-0.5 text-center font-bold text-[9px]">SPH</th>
                  <th className="border border-black p-0.5 text-center font-bold text-[9px]">CYL</th>
                  <th className="border border-black p-0.5 text-center font-bold text-[9px]">AXIS</th>
                  <th className="border border-black p-0.5 text-center font-bold text-[9px]">VA</th>
                </tr>
              </thead>
              <tbody>
                {/* Distant - Right Eye */}
                {(getRefractionValue('distant', 'right', 'sph') !== '-' ||
                  getRefractionValue('distant', 'right', 'cyl') !== '-' ||
                  getRefractionValue('distant', 'right', 'axis') !== '-' ||
                  getRefractionValue('distant', 'right', 'va') !== '-') && (
                  <tr>
                    <td className="border border-black p-0.5 text-[9px]">Distant</td>
                    <td className="border border-black p-0.5 text-[9px]">Right</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'right', 'sph')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'right', 'cyl')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'right', 'axis')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'right', 'va')}</td>
                  </tr>
                )}
                {/* Distant - Left Eye */}
                {(getRefractionValue('distant', 'left', 'sph') !== '-' ||
                  getRefractionValue('distant', 'left', 'cyl') !== '-' ||
                  getRefractionValue('distant', 'left', 'axis') !== '-' ||
                  getRefractionValue('distant', 'left', 'va') !== '-') && (
                  <tr>
                    <td className="border border-black p-0.5 text-[9px]">Distant</td>
                    <td className="border border-black p-0.5 text-[9px]">Left</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'left', 'sph')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'left', 'cyl')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'left', 'axis')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('distant', 'left', 'va')}</td>
                  </tr>
                )}
                {/* Near - Right Eye */}
                {(getRefractionValue('near', 'right', 'sph') !== '-' ||
                  getRefractionValue('near', 'right', 'cyl') !== '-' ||
                  getRefractionValue('near', 'right', 'axis') !== '-' ||
                  getRefractionValue('near', 'right', 'va') !== '-') && (
                  <tr>
                    <td className="border border-black p-0.5 text-[9px]">Near</td>
                    <td className="border border-black p-0.5 text-[9px]">Right</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'right', 'sph')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'right', 'cyl')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'right', 'axis')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'right', 'va')}</td>
                  </tr>
                )}
                {/* Near - Left Eye */}
                {(getRefractionValue('near', 'left', 'sph') !== '-' ||
                  getRefractionValue('near', 'left', 'cyl') !== '-' ||
                  getRefractionValue('near', 'left', 'axis') !== '-' ||
                  getRefractionValue('near', 'left', 'va') !== '-') && (
                  <tr>
                    <td className="border border-black p-0.5 text-[9px]">Near</td>
                    <td className="border border-black p-0.5 text-[9px]">Left</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'left', 'sph')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'left', 'cyl')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'left', 'axis')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('near', 'left', 'va')}</td>
                  </tr>
                )}
                {/* PG - Right Eye */}
                {(getRefractionValue('pg', 'right', 'sph') !== '-' ||
                  getRefractionValue('pg', 'right', 'cyl') !== '-' ||
                  getRefractionValue('pg', 'right', 'axis') !== '-' ||
                  getRefractionValue('pg', 'right', 'va') !== '-') && (
                  <tr>
                    <td className="border border-black p-0.5 text-[9px]">PG</td>
                    <td className="border border-black p-0.5 text-[9px]">Right</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'right', 'sph')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'right', 'cyl')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'right', 'axis')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'right', 'va')}</td>
                  </tr>
                )}
                {/* PG - Left Eye */}
                {(getRefractionValue('pg', 'left', 'sph') !== '-' ||
                  getRefractionValue('pg', 'left', 'cyl') !== '-' ||
                  getRefractionValue('pg', 'left', 'axis') !== '-' ||
                  getRefractionValue('pg', 'left', 'va') !== '-') && (
                  <tr>
                    <td className="border border-black p-0.5 text-[9px]">PG</td>
                    <td className="border border-black p-0.5 text-[9px]">Left</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'left', 'sph')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'left', 'cyl')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'left', 'axis')}</td>
                    <td className="border border-black p-0.5 text-center text-[9px]">{getRefractionValue('pg', 'left', 'va')}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Refraction Purpose, Quality, Remark */}
            {(recordData.examination_data?.refraction?.purpose ||
              recordData.examination_data?.refraction?.quality ||
              recordData.examination_data?.refraction?.remark) && (
              <div className="mt-3 grid grid-cols-3 gap-4">
                {recordData.examination_data.refraction.purpose && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Purpose</div>
                    <div className="text-xs text-gray-900">{recordData.examination_data.refraction.purpose}</div>
                  </div>
                )}
                {recordData.examination_data.refraction.quality && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Quality</div>
                    <div className="text-xs text-gray-900">{recordData.examination_data.refraction.quality}</div>
                  </div>
                )}
                {recordData.examination_data.refraction.remark && (
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Remark</div>
                    <div className="text-xs text-gray-900">{recordData.examination_data.refraction.remark}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BLOCK 4: EXAMINATION */}
        {hasExaminationData() && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              EXAMINATION
            </div>
            
            {/* Anterior Segment */}
            {recordData.examination_data?.anterior_segment && (
              <div className="mb-3">
                <div className="text-xs font-bold text-black mb-2">Anterior Segment</div>
                <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
                  <thead>
                    <tr>
                      <th className="border border-black p-1 text-left font-bold">Structure</th>
                      <th className="border border-black p-1 text-center font-bold text-xs">Right</th>
                      <th className="border border-black p-1 text-center font-bold text-xs">Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recordData.examination_data.anterior_segment.eyelids_right || recordData.examination_data.anterior_segment.eyelids_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Eyelids</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.eyelids_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.eyelids_left || '-'}</td>
                      </tr>
                    )}
                    {(recordData.examination_data.anterior_segment.conjunctiva_right || recordData.examination_data.anterior_segment.conjunctiva_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Conjunctiva</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.conjunctiva_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.conjunctiva_left || '-'}</td>
                      </tr>
                    )}
                    {(recordData.examination_data.anterior_segment.cornea_right || recordData.examination_data.anterior_segment.cornea_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Cornea</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.cornea_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.cornea_left || '-'}</td>
                      </tr>
                    )}
                    {(recordData.examination_data.anterior_segment.anterior_chamber_right || recordData.examination_data.anterior_segment.anterior_chamber_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Anterior Chamber</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.anterior_chamber_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.anterior_chamber_left || '-'}</td>
                      </tr>
                    )}
                    {(recordData.examination_data.anterior_segment.iris_right || recordData.examination_data.anterior_segment.iris_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Iris</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.iris_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.iris_left || '-'}</td>
                      </tr>
                    )}
                    {(recordData.examination_data.anterior_segment.lens_right || recordData.examination_data.anterior_segment.lens_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Lens</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.lens_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.anterior_segment.lens_left || '-'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {recordData.examination_data.anterior_segment.remarks && (
                  <div className="mt-2 text-xs text-gray-700">
                    <span className="font-semibold">Remarks: </span>
                    {recordData.examination_data.anterior_segment.remarks}
                  </div>
                )}
              </div>
            )}

            {/* Posterior Segment */}
            {recordData.examination_data?.posterior_segment && (
              <div className="mb-3">
                <div className="text-xs font-bold text-black mb-2">Posterior Segment</div>
                <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
                  <thead>
                    <tr>
                      <th className="border border-black p-1 text-left font-bold">Structure</th>
                      <th className="border border-black p-1 text-center font-bold text-xs">Right</th>
                      <th className="border border-black p-1 text-center font-bold text-xs">Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recordData.examination_data.posterior_segment.vitreous_right || recordData.examination_data.posterior_segment.vitreous_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Vitreous</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.posterior_segment.vitreous_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.posterior_segment.vitreous_left || '-'}</td>
                      </tr>
                    )}
                    {(recordData.examination_data.posterior_segment.disc_right || recordData.examination_data.posterior_segment.disc_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Disc</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.posterior_segment.disc_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.posterior_segment.disc_left || '-'}</td>
                      </tr>
                    )}
                    {(recordData.examination_data.posterior_segment.retina_right || recordData.examination_data.posterior_segment.retina_left) && (
                      <tr>
                        <td className="border border-black p-1 text-xs">Retina</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.posterior_segment.retina_right || '-'}</td>
                        <td className="border border-black p-1 text-center text-xs">{recordData.examination_data.posterior_segment.retina_left || '-'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {recordData.examination_data.posterior_segment.remarks && (
                  <div className="mt-2 text-xs text-gray-700">
                    <span className="font-semibold">Remarks: </span>
                    {recordData.examination_data.posterior_segment.remarks}
                  </div>
                )}
              </div>
            )}

            {/* Tests */}
            {(getIOP('right') !== '-' || getIOP('left') !== '-' ||
              getSACTest('right') !== '-' || getSACTest('left') !== '-') && (
              <div className="mb-3">
                <div className="text-xs font-bold text-black mb-2">Tests</div>
                <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
                  <thead>
                    <tr>
                      <th className="border border-black p-1 text-left font-bold">Test</th>
                      <th className="border border-black p-1 text-center font-bold text-xs">Right</th>
                      <th className="border border-black p-1 text-center font-bold text-xs">Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getIOP('right') !== '-' || getIOP('left') !== '-') && (
                      <tr>
                        <td className="border border-black p-1 text-xs">IOP</td>
                        <td className="border border-black p-1 text-center text-xs">{getIOP('right')}</td>
                        <td className="border border-black p-1 text-center text-xs">{getIOP('left')}</td>
                      </tr>
                    )}
                    {(getSACTest('right') !== '-' || getSACTest('left') !== '-') && (
                      <tr>
                        <td className="border border-black p-1 text-xs">SAC Test</td>
                        <td className="border border-black p-1 text-center text-xs">{getSACTest('right')}</td>
                        <td className="border border-black p-1 text-center text-xs">{getSACTest('left')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Blood Investigation */}
            {recordData.examination_data?.blood_investigation && (
              <div className="mb-3">
                <div className="text-xs font-bold text-black mb-2">Blood Investigation</div>
                <div className="grid grid-cols-3 gap-4">
                  {recordData.examination_data.blood_investigation.blood_pressure && (
                    <div>
                      <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Blood Pressure</div>
                      <div className="text-xs text-gray-900">{recordData.examination_data.blood_investigation.blood_pressure}</div>
                    </div>
                  )}
                  {recordData.examination_data.blood_investigation.blood_sugar && (
                    <div>
                      <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Blood Sugar</div>
                      <div className="text-xs text-gray-900">{recordData.examination_data.blood_investigation.blood_sugar}</div>
                    </div>
                  )}
                  {recordData.examination_data.blood_investigation.blood_tests && recordData.examination_data.blood_investigation.blood_tests.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Blood Tests</div>
                      <div className="text-xs text-gray-900">{recordData.examination_data.blood_investigation.blood_tests.join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PrintModalShell>
  )

  return (
    <>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}

