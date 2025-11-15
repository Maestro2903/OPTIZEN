"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface DischargePrintProps {
  discharge: {
    id: string
    discharge_no: string
    discharge_date: string
    patient_name: string
    patient_id?: string
    admission_date?: string
    room_number?: string
    case_no?: string
    primary_diagnosis?: string
    secondary_diagnosis?: string
    procedures_performed?: string
    complications?: string
    final_condition?: string
    discharge_medications?: string
    follow_up_instructions?: string
    follow_up_date?: string
    discharge_summary?: string
    vital_signs?: string
    lab_results?: string
    status?: string
  }
  children: React.ReactNode
}

export function DischargePrint({ discharge, children }: DischargePrintProps) {
  const formatDate = (dateString: string) => {
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
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Discharge Summary"
          documentTitle="Hospital Discharge Summary"
        >
          <div className="print-discharge-summary">
            {/* Discharge Header */}
            <div className="print-discharge-header">
              <PrintRow>
                <PrintCol>
                  <PrintField label="Discharge No." value={discharge.discharge_no} uppercase />
                  <PrintField label="Discharge Date" value={formatDate(discharge.discharge_date)} />
                  <PrintField label="Case No." value={discharge.case_no} />
                </PrintCol>
                <PrintCol>
                  <PrintField label="Patient Name" value={discharge.patient_name} uppercase />
                  <PrintField label="Patient ID" value={discharge.patient_id} />
                  <PrintField label="Room Number" value={discharge.room_number} />
                </PrintCol>
              </PrintRow>
            </div>

            {/* Admission Summary */}
            <PrintSection title="Admission & Stay Details">
              <PrintRow>
                <PrintCol>
                  <PrintField label="Admission Date" value={discharge.admission_date ? formatDate(discharge.admission_date) : undefined} />
                  <PrintField label="Duration of Stay" value={calculateStayDuration()} />
                </PrintCol>
                <PrintCol>
                  <PrintField label="Status" value={discharge.status} uppercase />
                </PrintCol>
              </PrintRow>
            </PrintSection>

            {/* Diagnoses - Primary and Secondary (Prominent) */}
            {discharge.primary_diagnosis && (
              <div className="print-diagnosis-primary">
                <div style={{ fontSize: '10pt', marginBottom: '4pt', textTransform: 'uppercase' }}>Primary Diagnosis</div>
                <div style={{ fontSize: '13pt' }}>{discharge.primary_diagnosis}</div>
              </div>
            )}

            {discharge.secondary_diagnosis && (
              <div className="print-diagnosis-secondary">
                <div style={{ fontSize: '9pt', marginBottom: '4pt', textTransform: 'uppercase' }}>Secondary Diagnosis</div>
                <div style={{ fontSize: '11pt' }}>{discharge.secondary_diagnosis}</div>
              </div>
            )}

            {/* Procedures Performed - List Format */}
            {discharge.procedures_performed && (
              <PrintSection title="Procedures Performed">
                <div style={{ fontSize: '11pt', lineHeight: '1.5' }}>
                  {discharge.procedures_performed.split('\n').filter(line => line.trim()).map((item, index) => (
                    <div key={index} style={{ marginBottom: '4pt' }}>
                      {index + 1}. {item.trim()}
                    </div>
                  ))}
                </div>
              </PrintSection>
            )}

            {/* Complications */}
            {discharge.complications && (
              <PrintSection title="Complications">
                <div style={{ fontSize: '11pt', lineHeight: '1.5' }}>{discharge.complications}</div>
              </PrintSection>
            )}

            {/* Hospital Course - Summary Paragraph */}
            {discharge.discharge_summary && (
              <div className="print-hospital-course">
                <div style={{ fontSize: '10pt', marginBottom: '6pt', textTransform: 'uppercase', fontWeight: 'bold' }}>Hospital Course</div>
                <div style={{ fontSize: '11pt', textAlign: 'justify' }}>{discharge.discharge_summary}</div>
              </div>
            )}

            {/* Clinical Data at Discharge */}
            {(discharge.vital_signs || discharge.lab_results) && (
              <PrintSection title="Clinical Data at Discharge">
                {discharge.vital_signs && (
                  <div style={{ marginBottom: '8pt', fontSize: '10pt' }}>
                    <div className="print-label">Vital Signs</div>
                    <div style={{ fontSize: '11pt', marginTop: '4pt' }}>{discharge.vital_signs}</div>
                  </div>
                )}

                {discharge.lab_results && (
                  <div style={{ fontSize: '10pt' }}>
                    <div className="print-label">Lab Results</div>
                    <div style={{ fontSize: '11pt', marginTop: '4pt' }}>{discharge.lab_results}</div>
                  </div>
                )}
              </PrintSection>
            )}

            {/* Discharge Medications - Prescription Format */}
            {discharge.discharge_medications && (
              <PrintSection title="Discharge Medications" className="print-prescription">
                <div style={{ fontSize: '24pt', fontWeight: 'bold', marginBottom: '8pt' }}>℞</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '12pt', lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                  {discharge.discharge_medications}
                </div>
              </PrintSection>
            )}

            {/* Discharge Instructions - Numbered List with Checkboxes */}
            <PrintSection title="Post-Discharge Instructions">
              {discharge.follow_up_instructions ? (
                <ul className="print-instruction-checklist">
                  {discharge.follow_up_instructions.split('\n').filter(line => line.trim()).map((item, index) => (
                    <li key={index}>{item.trim()}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#666', padding: '10pt' }}>
                  Standard post-discharge care instructions apply
                </div>
              )}

              <PrintRow>
                <PrintCol>
                  <PrintField
                    label="Next Follow-up Date"
                    value={discharge.follow_up_date ? formatDate(discharge.follow_up_date) : 'As per instructions'}
                  />
                </PrintCol>
                <PrintCol>
                  <PrintField label="Follow-up Location" value="Outpatient Department" />
                </PrintCol>
              </PrintRow>

              <PrintRow>
                <PrintCol>
                  <PrintField label="Emergency Contact" value="Clinic 24x7 Helpline: +91 98765 43210" />
                </PrintCol>
              </PrintRow>
            </PrintSection>

            {/* Final Condition - Highlighted */}
            {discharge.final_condition && (
              <div className="print-final-condition">
                <div style={{ fontSize: '10pt', marginBottom: '6pt', textTransform: 'uppercase' }}>Final Condition at Discharge</div>
                <div style={{ fontSize: '14pt' }}>{discharge.final_condition}</div>
              </div>
            )}

            {/* Doctor Signature */}
            <PrintSignature date={formatDate(discharge.discharge_date)} />
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}