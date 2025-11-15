"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface AppointmentPrintProps {
  appointment: {
    id: string
    appointment_no?: string
    patient_name: string
    patient_id?: string
    date: string
    time: string
    type: string
    status: string
    doctor?: string
    department?: string
    notes?: string
    contact_number?: string
    email?: string
    reason?: string
    duration?: string
    room_number?: string
    created_at: string
  }
  children: React.ReactNode
}

export function AppointmentPrint({ appointment, children }: AppointmentPrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'SCHEDULED',
      'checked-in': 'CHECKED IN',
      'in-progress': 'IN PROGRESS',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'no-show': 'NO SHOW'
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
          documentType="Appointment"
          documentTitle="Appointment Confirmation Slip"
        >
          {/* Appointment Slip Container */}
          <div className="print-appointment-slip">
            {/* Large Appointment Number */}
            <div className="print-appointment-number">
              APPOINTMENT #{appointment.appointment_no || appointment.id}
            </div>

            {/* Prominent Date/Time Display */}
            <div className="print-appointment-datetime">
              <div style={{ fontSize: '14pt', marginBottom: '4pt' }}>{formatDate(appointment.date)}</div>
              <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>{formatTime(appointment.time)}</div>
            </div>

            {/* Patient Information - Compact */}
            <div style={{ marginBottom: '10pt', fontSize: '10pt' }}>
              <div style={{ marginBottom: '6pt' }}>
                <div className="print-label" style={{ fontSize: '8pt' }}>Patient Name</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {appointment.patient_name}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt', marginTop: '6pt' }}>
                <div>
                  <div className="print-label" style={{ fontSize: '8pt' }}>Patient ID</div>
                  <div style={{ fontSize: '10pt' }}>{appointment.patient_id || '-'}</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '8pt' }}>Contact</div>
                  <div style={{ fontSize: '10pt' }}>{appointment.contact_number || appointment.email || '-'}</div>
                </div>
              </div>
            </div>

            {/* Doctor & Department - Compact */}
            <div style={{ marginBottom: '10pt', fontSize: '10pt', borderTop: '1px solid #ddd', paddingTop: '8pt' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt' }}>
                <div>
                  <div className="print-label" style={{ fontSize: '8pt' }}>Doctor</div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                    {appointment.doctor || 'Dr. [To be assigned]'}
                  </div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '8pt' }}>Department</div>
                  <div style={{ fontSize: '11pt' }}>{appointment.department || 'Ophthalmology'}</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '8pt' }}>Type</div>
                  <div style={{ fontSize: '10pt', textTransform: 'uppercase' }}>{appointment.type}</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '8pt' }}>Duration</div>
                  <div style={{ fontSize: '10pt' }}>{appointment.duration || '30 minutes'}</div>
                </div>
              </div>
            </div>

            {/* Room Number */}
            {appointment.room_number && (
              <div style={{ marginBottom: '10pt', fontSize: '10pt' }}>
                <div className="print-label" style={{ fontSize: '8pt' }}>Room Number</div>
                <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{appointment.room_number}</div>
              </div>
            )}

            {/* Purpose of Visit - Condensed */}
            {appointment.reason && (
              <div style={{ marginBottom: '10pt', fontSize: '9pt', borderTop: '1px solid #ddd', paddingTop: '8pt' }}>
                <div className="print-label" style={{ fontSize: '8pt' }}>Purpose of Visit</div>
                <div style={{ fontSize: '10pt', lineHeight: '1.4' }}>{appointment.reason}</div>
              </div>
            )}

            {/* Special Notes - Condensed */}
            {appointment.notes && (
              <div style={{ marginBottom: '10pt', fontSize: '9pt', borderTop: '1px solid #ddd', paddingTop: '8pt' }}>
                <div className="print-label" style={{ fontSize: '8pt' }}>Special Instructions</div>
                <div style={{ fontSize: '10pt', lineHeight: '1.4' }}>{appointment.notes}</div>
              </div>
            )}

            {/* Status */}
            <div style={{ marginBottom: '10pt', textAlign: 'center' }}>
              <div className="print-label" style={{ fontSize: '8pt', marginBottom: '4pt' }}>Status</div>
              <div style={{ 
                fontSize: '11pt', 
                fontWeight: 'bold', 
                textTransform: 'uppercase',
                display: 'inline-block',
                padding: '4pt 12pt',
                border: '2px solid #000'
              }}>
                {getStatusDisplay(appointment.status)}
              </div>
            </div>

            {/* Tear Line */}
            <div className="print-tear-line">
              Please bring this slip for your appointment
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}