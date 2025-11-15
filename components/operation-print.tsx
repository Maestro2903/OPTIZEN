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
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type OperationPrintData = OperationPrintProps["operation"]

export function OperationPrint({ operation, children, open, onOpenChange }: OperationPrintProps) {
  if (!operation) {
    return null
  }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Operation Record"
          documentTitle="Surgical Operation Report"
        >
          <div className="print-surgical-report">
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

            {/* Patient Identification */}
            <PrintSection title="Patient Identification">
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

            {/* Surgical Team - Table Format */}
            <PrintSection title="Surgical Team">
              <table className="print-surgical-team-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Role</th>
                    <th style={{ width: '70%' }}>Name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Primary Surgeon</strong></td>
                    <td>{operation.surgeon || 'Dr. [To be assigned]'}</td>
                  </tr>
                  {operation.assistant_surgeon && (
                    <tr>
                      <td><strong>Assistant Surgeon</strong></td>
                      <td>{operation.assistant_surgeon}</td>
                    </tr>
                  )}
                  <tr>
                    <td><strong>Anesthesiologist</strong></td>
                    <td>{operation.anesthesiologist || 'Dr. [Anesthesiologist]'}</td>
                  </tr>
                  <tr>
                    <td><strong>Anesthesia Type</strong></td>
                    <td>{operation.anesthesia_type || 'Local'}</td>
                  </tr>
                </tbody>
              </table>
            </PrintSection>

            {/* Pre-Operative Diagnosis - Highlighted Box */}
            {operation.pre_op_diagnosis && (
              <div className="print-diagnosis-highlight pre-op">
                <div style={{ fontSize: '10pt', marginBottom: '6pt', textTransform: 'uppercase' }}>Pre-Operative Diagnosis</div>
                <div style={{ fontSize: '12pt' }}>{operation.pre_op_diagnosis}</div>
              </div>
            )}

            {/* Procedure Details */}
            <PrintSection title="Procedure Details">
              {operation.procedure_details && (
                <div style={{ textAlign: 'justify', lineHeight: '1.6', fontSize: '11pt', marginBottom: '10pt' }}>
                  {operation.procedure_details}
                </div>
              )}

              {operation.equipment_used && (
                <div style={{ marginTop: '10pt', fontSize: '10pt' }}>
                  <div className="print-label">Equipment Used</div>
                  <div style={{ fontSize: '11pt', marginTop: '4pt' }}>{operation.equipment_used}</div>
                </div>
              )}
            </PrintSection>

            {/* Post-Operative Diagnosis - Highlighted Box */}
            {operation.post_op_diagnosis && (
              <div className="print-diagnosis-highlight post-op">
                <div style={{ fontSize: '10pt', marginBottom: '6pt', textTransform: 'uppercase' }}>Post-Operative Diagnosis</div>
                <div style={{ fontSize: '12pt' }}>{operation.post_op_diagnosis}</div>
              </div>
            )}

            {/* Complications - Warning-style Box */}
            {operation.complications && (
              <div className="print-complications-box">
                <div style={{ fontSize: '10pt', marginBottom: '6pt', textTransform: 'uppercase', fontWeight: 'bold' }}>Complications</div>
                <div style={{ fontSize: '11pt' }}>{operation.complications}</div>
              </div>
            )}

            {/* Additional Notes */}
            {operation.notes && (
              <PrintSection title="Additional Observations">
                <div style={{ fontSize: '11pt', lineHeight: '1.5' }}>{operation.notes}</div>
              </PrintSection>
            )}

            {/* Post-Operative Instructions - Numbered List */}
            <PrintSection title="Post-Operative Instructions">
              {operation.post_op_instructions ? (
                <ol className="print-post-op-instructions">
                  {operation.post_op_instructions.split('\n').filter(line => line.trim()).map((item, index) => (
                    <li key={index}>{item.trim()}</li>
                  ))}
                </ol>
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

            {/* Surgeon Signature */}
            <PrintSignature 
              doctorName={operation.surgeon || 'Primary Surgeon'}
              date={formatDate(operation.operation_date)}
            />
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}