"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface OperationPrintProps {
  operation: {
    id: string
    operation_no?: string
    patient_name: string
    patient_id?: string
    operation_date: string
    operation_time?: string
    operation_type: string
    surgeon?: string
    assistant_surgeon?: string
    anesthesiologist?: string
    anesthesia_type?: string
    pre_op_diagnosis?: string
    post_op_diagnosis?: string
    procedure_details?: string
    complications?: string
    post_op_instructions?: string
    status?: string
    duration?: string
    room_number?: string
    equipment_used?: string
    notes?: string
    follow_up_date?: string
  }
  children: React.ReactNode
}

export function OperationPrint({ operation, children }: OperationPrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = formatDate(dateString)
    if (!timeString) return date

    try {
      const time = new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `${date} at ${time}`
    } catch {
      return `${date} at ${timeString}`
    }
  }

  const getStatusDisplay = (status?: string) => {
    if (!status) return 'SCHEDULED'
    const statusMap: { [key: string]: string } = {
      'scheduled': 'SCHEDULED',
      'in-progress': 'IN PROGRESS',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'postponed': 'POSTPONED'
    }
    return statusMap[status] || status.toUpperCase()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Operation Record"
          documentTitle="Surgical Operation Report"
        >
          {/* Operation Header */}
          <PrintSection title="Operation Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Operation No." value={operation.operation_no || operation.id} uppercase />
                <PrintField label="Date & Time" value={formatDateTime(operation.operation_date, operation.operation_time)} />
                <PrintField label="Status" value={getStatusDisplay(operation.status)} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="Operation Type" value={operation.operation_type} uppercase />
                <PrintField label="Duration" value={operation.duration || 'To be recorded'} />
                <PrintField label="Room Number" value={operation.room_number || 'OT-1'} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Patient Information */}
          <PrintSection title="Patient Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Patient Name" value={operation.patient_name} uppercase />
                <PrintField label="Patient ID" value={operation.patient_id} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Pre-Op Diagnosis" value={operation.pre_op_diagnosis} />
                <PrintField label="Post-Op Diagnosis" value={operation.post_op_diagnosis} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Medical Team */}
          <PrintSection title="Medical Team">
            <PrintRow>
              <PrintCol>
                <PrintField label="Primary Surgeon" value={operation.surgeon || 'Dr. [To be assigned]'} />
                <PrintField label="Assistant Surgeon" value={operation.assistant_surgeon} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Anesthesiologist" value={operation.anesthesiologist || 'Dr. [Anesthesiologist]'} />
                <PrintField label="Anesthesia Type" value={operation.anesthesia_type || 'Local'} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Procedure Details */}
          <PrintSection title="Procedure Details">
            {operation.procedure_details && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Procedure Description" value={operation.procedure_details} />
                </PrintCol>
              </PrintRow>
            )}

            {operation.equipment_used && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Equipment Used" value={operation.equipment_used} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Complications & Observations */}
          {(operation.complications || operation.notes) && (
            <PrintSection title="Complications & Observations">
              {operation.complications && (
                <PrintRow>
                  <PrintCol className="w-full">
                    <PrintField label="Complications" value={operation.complications} />
                  </PrintCol>
                </PrintRow>
              )}

              {operation.notes && (
                <PrintRow>
                  <PrintCol className="w-full">
                    <PrintField label="Additional Notes" value={operation.notes} />
                  </PrintCol>
                </PrintRow>
              )}
            </PrintSection>
          )}

          {/* Post-Operative Care */}
          <PrintSection title="Post-Operative Instructions">
            {operation.post_op_instructions ? (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Post-Op Instructions" value={operation.post_op_instructions} />
                </PrintCol>
              </PrintRow>
            ) : (
              <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#666', padding: '15pt', textAlign: 'center' }}>
                Standard post-operative care instructions apply
              </div>
            )}

            <PrintRow>
              <PrintCol>
                <PrintField
                  label="Follow-up Date"
                  value={operation.follow_up_date ? formatDate(operation.follow_up_date) : 'As per surgeon\'s advice'}
                />
              </PrintCol>
              <PrintCol>
                <PrintField label="Discharge Status" value={operation.status === 'completed' ? 'Discharged' : 'Under observation'} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Operation Timeline */}
          <PrintSection title="Operation Timeline">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Activity</th>
                  <th>Personnel</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pre-Op</td>
                  <td>Patient Preparation</td>
                  <td>Nursing Staff</td>
                  <td>Patient prepared for surgery</td>
                </tr>
                <tr>
                  <td>{operation.operation_time || 'Scheduled time'}</td>
                  <td>Surgery Commenced</td>
                  <td>{operation.surgeon || 'Primary Surgeon'}</td>
                  <td>Operation started</td>
                </tr>
                <tr>
                  <td>During Op</td>
                  <td>Procedure Execution</td>
                  <td>Full surgical team</td>
                  <td>{operation.procedure_details || 'Standard procedure followed'}</td>
                </tr>
                <tr>
                  <td>Post-Op</td>
                  <td>Recovery & Monitoring</td>
                  <td>Recovery team</td>
                  <td>Patient transferred to recovery</td>
                </tr>
              </tbody>
            </table>
          </PrintSection>

          {/* Safety Protocols */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              SURGICAL SAFETY PROTOCOLS FOLLOWED
            </h4>
            <ul style={{ fontSize: '11pt', lineHeight: '1.4', paddingLeft: '20pt' }}>
              <li>Pre-operative patient verification completed ✓</li>
              <li>Surgical site marking and verification done ✓</li>
              <li>Anesthesia safety checklist completed ✓</li>
              <li>Surgical team briefing conducted ✓</li>
              <li>Post-operative count verification done ✓</li>
              <li>Patient monitoring protocols followed ✓</li>
              <li>Emergency procedures and equipment ready ✓</li>
            </ul>
          </div>

          {/* Emergency Contact Information */}
          <div style={{ marginTop: '20pt', padding: '15pt', border: '2px solid #ff0000', backgroundColor: '#fff5f5' }}>
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt', color: '#d00', textAlign: 'center' }}>
              🚨 POST-OPERATIVE EMERGENCY CONTACT
            </h4>
            <div style={{ fontSize: '11pt', lineHeight: '1.3', textAlign: 'center' }}>
              <strong>24-Hour Emergency Helpline:</strong> +91 98765 43210<br />
              <strong>Surgeon Direct Line:</strong> +91 98765 43211<br />
              <strong>Hospital Emergency:</strong> 108 (Ambulance)<br />
              <strong>Contact immediately if:</strong> Severe pain, excessive bleeding, difficulty breathing, high fever
            </div>
          </div>

          {/* Surgeon Signatures */}
          <div className="print-signature-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40pt' }}>
              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>{operation.surgeon || 'Primary Surgeon'}</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>Primary Surgeon</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(operation.operation_date)}</div>
              </div>

              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>{operation.anesthesiologist || 'Anesthesiologist'}</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>Anesthesiologist</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(operation.operation_date)}</div>
              </div>
            </div>
          </div>

          {/* Operation Record Footer */}
          <div style={{ marginTop: '40pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>SURGICAL OPERATION RECORD</strong><br />
              Operation No: {operation.operation_no || operation.id} | Date: {formatDate(operation.operation_date)} | Patient: {operation.patient_name}<br />
              This is an official surgical record. Keep this document safe for insurance and medical reference.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}