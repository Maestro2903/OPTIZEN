"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface CasePrintProps {
  caseData: {
    id: string
    case_no: string
    case_date: string
    patient_name: string
    patient_id?: string
    visit_no?: string
    age?: number
    gender?: string
    state?: string
    mobile?: string
    chief_complaint?: string
    history?: string
    examination?: string
    diagnosis?: string
    treatment?: string
    prescription?: string
    follow_up_date?: string
    notes?: string
    visual_acuity_right?: string
    visual_acuity_left?: string
    intraocular_pressure_right?: string
    intraocular_pressure_left?: string
    status?: string
  }
  children: React.ReactNode
}

export function CasePrint({ caseData, children }: CasePrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Case Record"
          documentTitle="Medical Case Record"
        >
          {/* Case Header Information */}
          <PrintSection title="Case Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Case No." value={caseData.case_no} uppercase />
                <PrintField label="Case Date" value={formatDate(caseData.case_date)} />
                <PrintField label="Visit Type" value={caseData.visit_no} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Patient Name" value={caseData.patient_name} uppercase />
                <PrintField label="Patient ID" value={caseData.patient_id} />
                <PrintField label="Status" value={caseData.status} uppercase />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Patient Demographics */}
          <PrintSection title="Patient Demographics">
            <PrintRow>
              <PrintCol>
                <PrintField label="Age" value={caseData.age ? `${caseData.age} years` : undefined} />
                <PrintField label="Gender" value={caseData.gender} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="State" value={caseData.state} />
                <PrintField label="Mobile" value={caseData.mobile} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Clinical Details */}
          <PrintSection title="Clinical Assessment">
            {caseData.chief_complaint && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Chief Complaint" value={caseData.chief_complaint} />
                </PrintCol>
              </PrintRow>
            )}

            {caseData.history && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="History" value={caseData.history} />
                </PrintCol>
              </PrintRow>
            )}

            {caseData.examination && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Clinical Examination" value={caseData.examination} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Vision Assessment */}
          {(caseData.visual_acuity_right || caseData.visual_acuity_left || caseData.intraocular_pressure_right || caseData.intraocular_pressure_left) && (
            <PrintSection title="Vision & Eye Pressure Assessment">
              <div style={{ marginBottom: '15pt' }}>
                <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt' }}>Visual Acuity</h4>
                <div style={{ display: 'flex', gap: '20pt' }}>
                  <div className="print-vision-box">
                    <strong>Right Eye (OD)</strong><br />
                    {caseData.visual_acuity_right || 'Not recorded'}
                  </div>
                  <div className="print-vision-box">
                    <strong>Left Eye (OS)</strong><br />
                    {caseData.visual_acuity_left || 'Not recorded'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '15pt' }}>
                <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt' }}>Intraocular Pressure (IOP)</h4>
                <div style={{ display: 'flex', gap: '20pt' }}>
                  <div className="print-vision-box">
                    <strong>Right Eye (OD)</strong><br />
                    {caseData.intraocular_pressure_right || 'Not recorded'}
                  </div>
                  <div className="print-vision-box">
                    <strong>Left Eye (OS)</strong><br />
                    {caseData.intraocular_pressure_left || 'Not recorded'}
                  </div>
                </div>
              </div>
            </PrintSection>
          )}

          {/* Diagnosis & Treatment */}
          <PrintSection title="Diagnosis & Treatment">
            {caseData.diagnosis && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Diagnosis" value={caseData.diagnosis} />
                </PrintCol>
              </PrintRow>
            )}

            {caseData.treatment && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Treatment Plan" value={caseData.treatment} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Prescription */}
          {caseData.prescription && (
            <PrintSection title="Prescription" className="print-prescription">
              <div className="print-rx-header">℞</div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '12pt', lineHeight: '1.5' }}>
                {caseData.prescription}
              </div>
            </PrintSection>
          )}

          {/* Follow-up & Notes */}
          <PrintSection title="Follow-up & Additional Notes">
            <PrintRow>
              <PrintCol>
                <PrintField
                  label="Next Follow-up"
                  value={caseData.follow_up_date ? formatDate(caseData.follow_up_date) : 'As advised'}
                />
              </PrintCol>
              <PrintCol>
                <PrintField label="Case Status" value={caseData.status} uppercase />
              </PrintCol>
            </PrintRow>

            {caseData.notes && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Additional Notes" value={caseData.notes} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Instructions to Patient */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              INSTRUCTIONS TO PATIENT
            </h4>
            <ul style={{ fontSize: '11pt', lineHeight: '1.4', paddingLeft: '20pt' }}>
              <li>Take medications as prescribed</li>
              <li>Return for follow-up as scheduled</li>
              <li>Contact clinic immediately if symptoms worsen</li>
              <li>Avoid rubbing or touching the eyes</li>
              <li>Wear protective eyewear if advised</li>
            </ul>
          </div>

          {/* Doctor Signature */}
          <PrintSignature date={formatDate(caseData.case_date)} />

          {/* Case Reference Footer */}
          <div style={{ marginTop: '20pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>CASE REFERENCE</strong><br />
              Case No: {caseData.case_no} | Date: {formatDate(caseData.case_date)} | Patient: {caseData.patient_name}<br />
              For follow-up appointments or queries, please quote the above case number.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}