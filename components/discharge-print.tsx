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
          {/* Discharge Header Information */}
          <PrintSection title="Discharge Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Discharge No." value={discharge.discharge_no} uppercase />
                <PrintField label="Discharge Date" value={formatDate(discharge.discharge_date)} />
                <PrintField label="Room Number" value={discharge.room_number} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Patient Name" value={discharge.patient_name} uppercase />
                <PrintField label="Patient ID" value={discharge.patient_id} />
                <PrintField label="Case No." value={discharge.case_no} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Admission Details */}
          <PrintSection title="Admission & Stay Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Admission Date" value={discharge.admission_date ? formatDate(discharge.admission_date) : undefined} />
                <PrintField label="Duration of Stay" value={calculateStayDuration()} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Final Condition" value={discharge.final_condition} />
                <PrintField label="Status" value={discharge.status} uppercase />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Medical Summary */}
          <PrintSection title="Medical Summary">
            {discharge.primary_diagnosis && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Primary Diagnosis" value={discharge.primary_diagnosis} />
                </PrintCol>
              </PrintRow>
            )}

            {discharge.secondary_diagnosis && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Secondary Diagnosis" value={discharge.secondary_diagnosis} />
                </PrintCol>
              </PrintRow>
            )}

            {discharge.procedures_performed && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Procedures Performed" value={discharge.procedures_performed} />
                </PrintCol>
              </PrintRow>
            )}

            {discharge.complications && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Complications" value={discharge.complications} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Clinical Data */}
          {(discharge.vital_signs || discharge.lab_results) && (
            <PrintSection title="Clinical Data at Discharge">
              {discharge.vital_signs && (
                <PrintRow>
                  <PrintCol className="w-full">
                    <PrintField label="Vital Signs" value={discharge.vital_signs} />
                  </PrintCol>
                </PrintRow>
              )}

              {discharge.lab_results && (
                <PrintRow>
                  <PrintCol className="w-full">
                    <PrintField label="Lab Results" value={discharge.lab_results} />
                  </PrintCol>
                </PrintRow>
              )}
            </PrintSection>
          )}

          {/* Discharge Medications */}
          {discharge.discharge_medications && (
            <PrintSection title="Discharge Medications" className="print-prescription">
              <div className="print-rx-header">℞ DISCHARGE MEDICATIONS</div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '12pt', lineHeight: '1.5', marginTop: '10pt' }}>
                {discharge.discharge_medications}
              </div>
            </PrintSection>
          )}

          {/* Follow-up Instructions */}
          <PrintSection title="Post-Discharge Instructions">
            {discharge.follow_up_instructions && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Follow-up Instructions" value={discharge.follow_up_instructions} />
                </PrintCol>
              </PrintRow>
            )}

            <PrintRow>
              <PrintCol>
                <PrintField
                  label="Next Follow-up Date"
                  value={discharge.follow_up_date ? formatDate(discharge.follow_up_date) : 'As per instructions'}
                />
              </PrintCol>
              <PrintCol>
                <PrintField label="Emergency Contact" value="Clinic 24x7 Helpline" />
              </PrintCol>
            </PrintRow>

            {discharge.discharge_summary && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Discharge Summary" value={discharge.discharge_summary} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Post-Discharge Care Instructions */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              GENERAL POST-DISCHARGE CARE INSTRUCTIONS
            </h4>
            <ul style={{ fontSize: '11pt', lineHeight: '1.4', paddingLeft: '20pt' }}>
              <li>Take all prescribed medications as directed</li>
              <li>Follow all activity restrictions and lifestyle modifications</li>
              <li>Keep all follow-up appointments</li>
              <li>Monitor for any warning signs or symptoms</li>
              <li>Maintain proper wound care if applicable</li>
              <li>Contact healthcare provider immediately if condition worsens</li>
              <li>Follow dietary recommendations if provided</li>
            </ul>
          </div>

          {/* Emergency Contact Information */}
          <div className="print-emergency">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt', color: '#d00' }}>
              🚨 EMERGENCY CONTACT INFORMATION
            </h4>
            <p style={{ fontSize: '11pt', lineHeight: '1.3' }}>
              <strong>24-Hour Emergency Helpline:</strong> +91 98765 43210<br />
              <strong>Clinic Address:</strong> 123 Medical Plaza, Healthcare District, City - 123456<br />
              <strong>Patient should seek immediate medical attention if experiencing:</strong><br />
              • Severe pain or discomfort • High fever • Difficulty breathing • Unusual bleeding or discharge
            </p>
          </div>

          {/* Doctor Signature */}
          <PrintSignature date={formatDate(discharge.discharge_date)} />

          {/* Discharge Reference Footer */}
          <div style={{ marginTop: '20pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>DISCHARGE REFERENCE</strong><br />
              Discharge No: {discharge.discharge_no} | Date: {formatDate(discharge.discharge_date)} | Patient: {discharge.patient_name}<br />
              This document serves as official discharge summary. Keep this document safe for future medical reference.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}