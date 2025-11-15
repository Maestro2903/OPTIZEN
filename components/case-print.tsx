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
          documentTitle="Medical Case Report"
        >
          <div className="print-case-report">
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

            {/* Patient Demographics - Brief */}
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

            {/* Chief Complaint - Prominent */}
            {caseData.chief_complaint && (
              <div className="print-chief-complaint">
                <div style={{ fontSize: '10pt', marginBottom: '4pt', textTransform: 'uppercase' }}>Chief Complaint</div>
                <div style={{ fontSize: '12pt' }}>{caseData.chief_complaint}</div>
              </div>
            )}

            {/* History of Present Illness - Paragraph Format */}
            {caseData.history && (
              <div className="print-history-section">
                <div className="print-section-title" style={{ marginBottom: '6pt' }}>History of Present Illness</div>
                <div style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '11pt' }}>
                  {caseData.history}
                </div>
              </div>
            )}

            {/* Clinical Examination - Structured */}
            {caseData.examination && (
              <PrintSection title="Clinical Examination">
                <div style={{ textAlign: 'justify', lineHeight: '1.5', fontSize: '11pt' }}>
                  {caseData.examination}
                </div>
              </PrintSection>
            )}

            {/* Vision Assessment - Side-by-side Eye Boxes */}
            {(caseData.visual_acuity_right || caseData.visual_acuity_left || caseData.intraocular_pressure_right || caseData.intraocular_pressure_left) && (
              <PrintSection title="Vision & Eye Pressure Assessment">
                <div style={{ marginBottom: '15pt' }}>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt' }}>Visual Acuity</div>
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
                  <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt' }}>Intraocular Pressure (IOP)</div>
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

            {/* Diagnosis - Boxed/Highlighted */}
            {caseData.diagnosis && (
              <div className="print-diagnosis-box">
                <div style={{ fontSize: '10pt', marginBottom: '6pt', textTransform: 'uppercase' }}>Diagnosis</div>
                <div style={{ fontSize: '12pt' }}>{caseData.diagnosis}</div>
              </div>
            )}

            {/* Treatment Plan - Numbered List Format */}
            {caseData.treatment && (
              <PrintSection title="Treatment Plan">
                <ol className="print-treatment-list">
                  {caseData.treatment.split('\n').filter(line => line.trim()).map((item, index) => (
                    <li key={index} style={{ marginBottom: '4pt' }}>{item.trim()}</li>
                  ))}
                </ol>
              </PrintSection>
            )}

            {/* Prescription - Traditional Rx Format */}
            {caseData.prescription && (
              <PrintSection title="Prescription" className="print-prescription">
                <div style={{ fontSize: '24pt', fontWeight: 'bold', marginBottom: '8pt' }}>℞</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '12pt', lineHeight: '1.6', fontFamily: 'Times New Roman, serif' }}>
                  {caseData.prescription}
                </div>
              </PrintSection>
            )}

            {/* Follow-up - Clear Date Display */}
            <PrintSection title="Follow-up & Additional Notes">
              <PrintRow>
                <PrintCol>
                  <PrintField
                    label="Next Follow-up Date"
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
                    <div style={{ marginTop: '8pt', fontSize: '10pt' }}>
                      <div className="print-label">Additional Notes</div>
                      <div style={{ fontSize: '11pt', lineHeight: '1.5', marginTop: '4pt' }}>{caseData.notes}</div>
                    </div>
                  </PrintCol>
                </PrintRow>
              )}
            </PrintSection>

            {/* Doctor Signature */}
            <PrintSignature date={formatDate(caseData.case_date)} />
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}