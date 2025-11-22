"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintGrid, PrintFooter } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"

interface OperationPrintProps {
  operation: {
    id: string
    operation_no?: string
    patient_name: string
    patient_id?: string
    case_id?: string
    case_no?: string
    operation_date: string
    begin_time?: string
    end_time?: string
    operation_type?: string
    operation_name?: string
    surgeon?: string
    assistant_surgeon?: string
    anesthesiologist?: string
    anesthesia?: string
    anesthesia_type?: string
    sys_diagnosis?: string
    pre_op_diagnosis?: string
    post_op_diagnosis?: string
    procedure_details?: string
    complications?: string
    post_op_instructions?: string
    operation_notes?: string
    status?: string
    duration?: string
    room_number?: string
    equipment_used?: string
    notes?: string
    follow_up_date?: string
    follow_up_visit_type?: string
    // IOL fields
    iol_name?: string
    iol_power?: string
    eye?: string
    // Financial fields
    amount?: number
    payment_mode?: string
    print_payment?: boolean
  }
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type OperationPrintData = OperationPrintProps["operation"]

export function OperationPrint({ operation, children, open, onOpenChange }: OperationPrintProps) {
  const [isOpen, setIsOpen] = React.useState(open ?? false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleClose = () => {
    setIsOpen(false)
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  if (!operation) {
    return null
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '--'
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return '--'
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--'
    try {
      // Handle both HH:mm format and full datetime strings
      let time: Date
      if (timeString.includes('T')) {
        time = new Date(timeString)
      } else {
        // Assume HH:mm format
        const [hours, minutes] = timeString.split(':')
        time = new Date(1970, 0, 1, parseInt(hours, 10), parseInt(minutes, 10))
      }
      
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return '--:--'
    }
  }

  const formatTimeRange = (beginTime?: string, endTime?: string) => {
    const begin = formatTime(beginTime)
    const end = formatTime(endTime)
    if (begin === '--:--' && end === '--:--') return '--:--'
    if (begin === '--:--') return end
    if (end === '--:--') return begin
    return `${begin} - ${end}`
  }

  const formatEye = (eye?: string) => {
    if (!eye) return '-'
    const eyeMap: { [key: string]: string } = {
      'Left': 'OS',
      'Right': 'OD',
      'Both': 'OD/OS',
      'OS': 'OS',
      'OD': 'OD',
      'OU': 'OD/OS'
    }
    return eyeMap[eye] || eye
  }

  const formatAmount = (amount?: number) => {
    if (!amount || amount === 0) return '-'
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Determine surgery type (operation_name takes precedence over operation_type)
  const surgeryType = operation.operation_name || operation.operation_type || '-'
  
  // Determine diagnosis (sys_diagnosis takes precedence)
  const diagnosis = operation.sys_diagnosis || operation.pre_op_diagnosis || operation.post_op_diagnosis || '-'
  
  // Determine anesthesia
  const anesthesia = operation.anesthesia || operation.anesthesia_type || '-'
  
  // Determine surgeon
  const surgeon = operation.surgeon || operation.anesthesiologist || '-'
  
  // Determine anesthetist
  const anesthetist = operation.anesthesiologist || operation.assistant_surgeon || '-'

  // Check if financial section should be shown
  const showFinancials = operation.print_payment || (operation.amount && operation.amount > 0)

  const modalContent = isOpen ? (
    <PrintModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={`Operation_${operation.operation_no || operation.id}`}
    >
      <PrintHeader />
      
      {/* Document Title */}
      <div className="text-xl font-bold uppercase tracking-widest border-b-2 border-gray-900 pb-2 mb-8 text-center">
        SURGICAL OPERATION RECORD
      </div>
          {/* Section 1: Operation Booking */}
          <PrintSection title="OPERATION BOOKING">
            <div className="grid grid-cols-3 gap-x-8 gap-y-2">
              {/* Row 1 */}
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Patient Name</div>
                <div className="text-sm font-bold text-gray-900">{operation.patient_name || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Case ID</div>
                <div className="text-sm font-bold text-gray-900">{operation.case_no || operation.case_id || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Patient ID</div>
                <div className="text-sm font-bold text-gray-900">{operation.patient_id || '-'}</div>
              </div>

              {/* Row 2 */}
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Operation Date</div>
                <div className="text-sm font-bold text-gray-900">{formatDate(operation.operation_date)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Time</div>
                <div className="text-sm font-bold text-gray-900">{formatTimeRange(operation.begin_time, operation.end_time)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">OT Room</div>
                <div className="text-sm font-bold text-gray-900">{operation.room_number || '-'}</div>
              </div>

              {/* Row 3 */}
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Surgeon Name</div>
                <div className="text-sm font-bold text-gray-900">{surgeon}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Anesthetist</div>
                <div className="text-sm font-bold text-gray-900">{anesthetist}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-400 font-semibold">Surgery Type</div>
                <div className="text-sm font-bold text-gray-900">{surgeryType}</div>
              </div>
            </div>
          </PrintSection>

          {/* Section 2: Clinical & IOL Details */}
          <PrintSection title="CLINICAL & IOL DETAILS">
            {/* Diagnosis - Full width */}
            <div className="mb-4">
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Diagnosis</div>
              <div className="text-sm font-bold text-gray-900">{diagnosis}</div>
            </div>

            {/* Anesthesia - Full width */}
            <div className="mb-4">
              <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Anesthesia</div>
              <div className="text-sm font-bold text-gray-900">{anesthesia}</div>
            </div>

            {/* IOL Table */}
            {(operation.iol_name || operation.iol_power || operation.eye) && (
              <div className="mt-4">
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-2">IOL Details</div>
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-[10px] uppercase text-gray-600 font-semibold">IOL Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-[10px] uppercase text-gray-600 font-semibold">Power</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-[10px] uppercase text-gray-600 font-semibold">Eye (OD/OS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">{operation.iol_name || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">{operation.iol_power || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">{formatEye(operation.eye)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </PrintSection>

          {/* Section 3: Financials (Conditional) */}
          {showFinancials && (
            <PrintSection title="FINANCIAL ESTIMATE">
              <PrintGrid
                items={[
                  { label: 'Amount', value: formatAmount(operation.amount) },
                  { label: 'Payment Mode', value: operation.payment_mode || '-' }
                ]}
              />
            </PrintSection>
          )}

          {/* Section 4: Post-OP Instructions */}
          <PrintSection title="POST-OP INSTRUCTIONS">
            {/* Operation Notes */}
            {(operation.operation_notes || operation.notes || operation.procedure_details) && (
              <div className="mb-4">
                <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Operation Notes</div>
                <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {operation.operation_notes || operation.notes || operation.procedure_details}
                </div>
              </div>
            )}

            {/* Follow-up Information */}
            {(operation.follow_up_date || operation.follow_up_visit_type) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-[10px] text-gray-500 italic">
                  {operation.follow_up_date && `Follow-up: ${formatDate(operation.follow_up_date)}`}
                  {operation.follow_up_date && operation.follow_up_visit_type && ' • '}
                  {operation.follow_up_visit_type && `Visit Type: ${operation.follow_up_visit_type}`}
                </div>
              </div>
            )}
          </PrintSection>

      {/* Footer */}
      <PrintFooter 
        doctorName={surgeon !== '-' ? surgeon : undefined}
        showTimestamp={true}
      />
    </PrintModalShell>
  ) : null

  return (
    <>
      {children && (
        <div onClick={() => setIsOpen(true)}>
          {children}
        </div>
      )}
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}