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
          documentTitle="Appointment Confirmation"
        >
          {/* Appointment Header */}
          <PrintSection title="Appointment Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Appointment No." value={appointment.appointment_no || appointment.id} uppercase />
                <PrintField label="Date" value={formatDate(appointment.date)} />
                <PrintField label="Time" value={formatTime(appointment.time)} center />
              </PrintCol>
              <PrintCol>
                <PrintField label="Type" value={appointment.type} uppercase />
                <PrintField label="Status" value={getStatusDisplay(appointment.status)} uppercase />
                <PrintField label="Duration" value={appointment.duration || '30 minutes'} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Patient Information */}
          <PrintSection title="Patient Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Patient Name" value={appointment.patient_name} uppercase />
                <PrintField label="Patient ID" value={appointment.patient_id} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Contact Number" value={appointment.contact_number} />
                <PrintField label="Email" value={appointment.email} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Doctor & Department Information */}
          <PrintSection title="Doctor & Department">
            <PrintRow>
              <PrintCol>
                <PrintField label="Doctor" value={appointment.doctor || 'Dr. [To be assigned]'} />
                <PrintField label="Department" value={appointment.department || 'Ophthalmology'} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Room Number" value={appointment.room_number || 'TBA'} />
                <PrintField label="Booking Date" value={formatDate(appointment.created_at)} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Appointment Purpose */}
          {appointment.reason && (
            <PrintSection title="Purpose of Visit">
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Reason for Appointment" value={appointment.reason} />
                </PrintCol>
              </PrintRow>
            </PrintSection>
          )}

          {/* Special Notes */}
          {appointment.notes && (
            <PrintSection title="Special Instructions">
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Notes" value={appointment.notes} />
                </PrintCol>
              </PrintRow>
            </PrintSection>
          )}

          {/* Patient Instructions */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              IMPORTANT INSTRUCTIONS FOR PATIENTS
            </h4>
            <ul style={{ fontSize: '11pt', lineHeight: '1.4', paddingLeft: '20pt' }}>
              <li>Please arrive 15 minutes before your scheduled appointment time</li>
              <li>Bring a valid photo ID and insurance card if applicable</li>
              <li>Bring any relevant medical records or previous test results</li>
              <li>If you need to cancel, please call at least 24 hours in advance</li>
              <li>For eye examinations, avoid wearing contact lenses if possible</li>
              <li>Bring a list of current medications you are taking</li>
              <li>If you have any allergies, please inform the staff upon arrival</li>
            </ul>
          </div>

          {/* Contact Information Box */}
          <div style={{ marginTop: '20pt', padding: '15pt', border: '2px solid #000', backgroundColor: '#f9f9f9' }}>
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt', textAlign: 'center' }}>
              CLINIC CONTACT INFORMATION
            </h4>
            <div style={{ fontSize: '11pt', lineHeight: '1.4', textAlign: 'center' }}>
              <strong>Phone:</strong> +91 98765 43210<br />
              <strong>Address:</strong> 123 Medical Plaza, Healthcare District, City - 123456<br />
              <strong>Emergency:</strong> +91 98765 43211 (24/7)<br />
              <strong>Email:</strong> appointments@eyezen.com
            </div>
          </div>

          {/* Appointment confirmation footer */}
          <div style={{ marginTop: '20pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f0f8ff' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>APPOINTMENT CONFIRMATION</strong><br />
              This document confirms your appointment on {formatDate(appointment.date)} at {formatTime(appointment.time)}<br />
              Appointment Reference: {appointment.appointment_no || appointment.id}<br />
              Please keep this document for your records and present it during your visit.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}