"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"
import "@/styles/print.css"

interface OutPatientRecordPrintProps {
  recordData: {
    id?: string
    receipt_no: string
    uhd_no?: string
    record_date: string
    record_time?: string
    patient_id?: string
    name: string
    age?: number
    sex?: 'male' | 'female' | 'other'
    address?: string
    pain_assessment_scale?: number
    complaints?: string
    diagnosis?: string
    tension?: string
    fundus?: string
    eye_examination?: {
      right_eye?: {
        lids?: string
        lacrimal_ducts?: string
        conjunctiva?: string
        cornea?: string
        anterior_chamber?: string
        iris?: string
        pupil?: string
        lens?: string
        ocular_movements?: string
      }
      left_eye?: {
        lids?: string
        lacrimal_ducts?: string
        conjunctiva?: string
        cornea?: string
        anterior_chamber?: string
        iris?: string
        pupil?: string
        lens?: string
        ocular_movements?: string
      }
    }
    vision_assessment?: {
      right_eye?: {
        vision_without_glasses_dv?: string
        vision_without_glasses_nv?: string
        vision_with_glasses_dv?: string
        vision_with_glasses_nv?: string
      }
      left_eye?: {
        vision_without_glasses_dv?: string
        vision_without_glasses_nv?: string
        vision_with_glasses_dv?: string
        vision_with_glasses_nv?: string
      }
    }
    history?: {
      dm?: boolean
      htn?: boolean
      previous_surgery?: boolean
      vaccination?: boolean
      others?: string
    }
    proposed_plan?: string
    rx?: string
    urine_albumin?: string
    urine_sugar?: string
    bp?: string
    weight?: number
    patients?: {
      full_name?: string
      patient_id?: string
      mobile?: string
      email?: string
      address?: string
    }
  }
  children: React.ReactNode
}

export function OutPatientRecordPrint({ recordData, children }: OutPatientRecordPrintProps) {
  const [isOpen, setIsOpen] = React.useState(false)

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

  const getPainScaleLabel = (scale: number | undefined): string => {
    if (scale === undefined || scale === null) return '-'
    if (scale === 0) return '0: No Pain'
    if (scale >= 1 && scale <= 3) return `${scale}: Mild`
    if (scale >= 4 && scale <= 6) return `${scale}: Moderate`
    if (scale >= 7 && scale <= 9) return `${scale}: Severe`
    if (scale === 10) return '10: Worst Pain'
    return `${scale}`
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
      title={`Out_Patient_Record_${recordData.receipt_no}`}
    >
      <PrintHeader />
      
      {/* Centered Title */}
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">
          OUT PATIENT RECORD
        </h2>
      </div>

      {/* Main Content */}
      <div className="print-case-report space-y-2 font-serif text-[11px] leading-tight">
        
        {/* BLOCK 1: PATIENT & RECORD INFORMATION */}
        <div className="mb-2 break-inside-avoid">
          <div className="grid grid-cols-4 gap-4 mb-4 border-b border-gray-300 pb-3">
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Receipt No</div>
              <div className="text-sm font-bold text-gray-900">{recordData.receipt_no || '-'}</div>
            </div>
            {recordData.uhd_no && (
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">UHD No</div>
                <div className="text-sm font-bold text-gray-900">{recordData.uhd_no}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Date</div>
              <div className="text-sm font-bold text-gray-900">{formatDate(recordData.record_date)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Time</div>
              <div className="text-sm font-bold text-gray-900">{formatTime(recordData.record_time)}</div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div>
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Name</div>
              <div className="text-sm font-bold text-gray-900">{recordData.name || recordData.patients?.full_name || '-'}</div>
            </div>
            {recordData.age && (
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Age</div>
                <div className="text-sm font-bold text-gray-900">{recordData.age} yrs</div>
              </div>
            )}
            {recordData.sex && (
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Sex</div>
                <div className="text-sm font-bold text-gray-900 capitalize">{recordData.sex}</div>
              </div>
            )}
            {recordData.patients?.mobile && (
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Mobile</div>
                <div className="text-sm font-bold text-gray-900">{recordData.patients.mobile}</div>
              </div>
            )}
          </div>
          {(recordData.address || recordData.patients?.address) && (
            <div className="mb-3">
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Address</div>
              <div className="text-sm text-gray-900">{recordData.address || recordData.patients?.address}</div>
            </div>
          )}
        </div>

        {/* BLOCK 2: PAIN ASSESSMENT SCALE */}
        {recordData.pain_assessment_scale !== undefined && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              PAIN ASSESSMENT SCALE (0–10)
            </div>
            <div className="text-sm font-bold text-gray-900">
              {getPainScaleLabel(recordData.pain_assessment_scale)}
            </div>
          </div>
        )}

        {/* BLOCK 3: COMPLAINTS */}
        {recordData.complaints && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              COMPLAINTS
            </div>
            <div className="text-sm text-gray-900 leading-relaxed">{recordData.complaints}</div>
          </div>
        )}

        {/* BLOCK 4: DIAGNOSIS */}
        {recordData.diagnosis && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              DIAGNOSIS
            </div>
            <div className="text-sm text-gray-900 leading-relaxed">{recordData.diagnosis}</div>
          </div>
        )}

        {/* BLOCK 5: EYE EXAMINATION */}
        {recordData.eye_examination && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              EYE EXAMINATION
            </div>
            <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left font-bold">Structure</th>
                  <th className="border border-black p-1 text-center font-bold text-xs">Right Eye</th>
                  <th className="border border-black p-1 text-center font-bold text-xs">Left Eye</th>
                </tr>
              </thead>
              <tbody>
                {(recordData.eye_examination.right_eye?.lids || recordData.eye_examination.left_eye?.lids) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Lids</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.lids || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.lids || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.lacrimal_ducts || recordData.eye_examination.left_eye?.lacrimal_ducts) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Lacrimal Ducts</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.lacrimal_ducts || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.lacrimal_ducts || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.conjunctiva || recordData.eye_examination.left_eye?.conjunctiva) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Conjunctiva</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.conjunctiva || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.conjunctiva || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.cornea || recordData.eye_examination.left_eye?.cornea) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Cornea</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.cornea || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.cornea || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.anterior_chamber || recordData.eye_examination.left_eye?.anterior_chamber) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Anterior Chamber</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.anterior_chamber || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.anterior_chamber || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.iris || recordData.eye_examination.left_eye?.iris) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Iris</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.iris || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.iris || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.pupil || recordData.eye_examination.left_eye?.pupil) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Pupil</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.pupil || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.pupil || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.lens || recordData.eye_examination.left_eye?.lens) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Lens</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.lens || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.lens || '-'}</td>
                  </tr>
                )}
                {(recordData.eye_examination.right_eye?.ocular_movements || recordData.eye_examination.left_eye?.ocular_movements) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Ocular Movements</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.right_eye?.ocular_movements || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.eye_examination.left_eye?.ocular_movements || '-'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* BLOCK 6: VISION ASSESSMENT */}
        {recordData.vision_assessment && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              VISION ASSESSMENT
            </div>
            <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left font-bold">Test</th>
                  <th className="border border-black p-1 text-center font-bold text-xs">Right Eye</th>
                  <th className="border border-black p-1 text-center font-bold text-xs">Left Eye</th>
                </tr>
              </thead>
              <tbody>
                {(recordData.vision_assessment.right_eye?.vision_without_glasses_dv || recordData.vision_assessment.left_eye?.vision_without_glasses_dv) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Vision without Glasses – D.V.</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.right_eye?.vision_without_glasses_dv || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.left_eye?.vision_without_glasses_dv || '-'}</td>
                  </tr>
                )}
                {(recordData.vision_assessment.right_eye?.vision_without_glasses_nv || recordData.vision_assessment.left_eye?.vision_without_glasses_nv) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Vision without Glasses – N.V.</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.right_eye?.vision_without_glasses_nv || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.left_eye?.vision_without_glasses_nv || '-'}</td>
                  </tr>
                )}
                {(recordData.vision_assessment.right_eye?.vision_with_glasses_dv || recordData.vision_assessment.left_eye?.vision_with_glasses_dv) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Vision with Glasses – D.V.</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.right_eye?.vision_with_glasses_dv || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.left_eye?.vision_with_glasses_dv || '-'}</td>
                  </tr>
                )}
                {(recordData.vision_assessment.right_eye?.vision_with_glasses_nv || recordData.vision_assessment.left_eye?.vision_with_glasses_nv) && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Vision with Glasses – N.V.</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.right_eye?.vision_with_glasses_nv || '-'}</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.vision_assessment.left_eye?.vision_with_glasses_nv || '-'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* BLOCK 7: TENSION & FUNDUS */}
        {(recordData.tension || recordData.fundus) && (
          <div className="mb-2 break-inside-avoid">
            <div className="grid grid-cols-2 gap-4">
              {recordData.tension && (
                <div>
                  <div className="text-xs font-bold text-black mb-1">Tension:</div>
                  <div className="text-sm text-gray-900">{recordData.tension}</div>
                </div>
              )}
              {recordData.fundus && (
                <div>
                  <div className="text-xs font-bold text-black mb-1">Fundus:</div>
                  <div className="text-sm text-gray-900">{recordData.fundus}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BLOCK 8: HISTORY */}
        {recordData.history && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              HISTORY
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={recordData.history.dm ? 'font-bold' : ''}>
                  {recordData.history.dm ? '☑' : '☐'} DM
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={recordData.history.htn ? 'font-bold' : ''}>
                  {recordData.history.htn ? '☑' : '☐'} HTN
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={recordData.history.previous_surgery ? 'font-bold' : ''}>
                  {recordData.history.previous_surgery ? '☑' : '☐'} Previous Surgery
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={recordData.history.vaccination ? 'font-bold' : ''}>
                  {recordData.history.vaccination ? '☑' : '☐'} Vaccination (Paediatrics)
                </span>
              </div>
              {recordData.history.others && (
                <div className="col-span-2">
                  <span className="font-bold">Others: </span>
                  <span>{recordData.history.others}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BLOCK 9: PROPOSED PLAN */}
        {recordData.proposed_plan && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              PROPOSED PLAN
            </div>
            <div className="text-sm text-gray-900 leading-relaxed">{recordData.proposed_plan}</div>
          </div>
        )}

        {/* BLOCK 10: Rx (PRESCRIPTION) */}
        {recordData.rx && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              Rx
            </div>
            <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{recordData.rx}</div>
          </div>
        )}

        {/* BLOCK 11: URINE TEST */}
        {(recordData.urine_albumin || recordData.urine_sugar) && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              URINE TEST
            </div>
            <table className="w-full border-collapse border border-black" style={{ fontSize: '9pt' }}>
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left font-bold">Test</th>
                  <th className="border border-black p-1 text-center font-bold text-xs">Result</th>
                </tr>
              </thead>
              <tbody>
                {recordData.urine_albumin && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Albumin</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.urine_albumin}</td>
                  </tr>
                )}
                {recordData.urine_sugar && (
                  <tr>
                    <td className="border border-black p-1 text-xs">Sugar</td>
                    <td className="border border-black p-1 text-center text-xs">{recordData.urine_sugar}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* BLOCK 12: VITALS */}
        {(recordData.bp || recordData.weight) && (
          <div className="mb-2 break-inside-avoid">
            <div className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-widest">
              VITALS
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recordData.bp && (
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">B.P.</div>
                  <div className="text-sm font-bold text-gray-900">{recordData.bp}</div>
                </div>
              )}
              {recordData.weight && (
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Weight</div>
                  <div className="text-sm font-bold text-gray-900">{recordData.weight} kg</div>
                </div>
              )}
            </div>
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






