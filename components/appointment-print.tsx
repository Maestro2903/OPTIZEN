"use client"

import React from "react"
import { createPortal } from "react-dom"
import { PrintHeader, PrintSection, PrintGrid, PrintFooter } from "./print-layout"
import { PrintModalShell } from "./print-modal-shell"

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
  const [isOpen, setIsOpen] = React.useState(false)
  // Helper function to validate if a date string is valid
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && dateString.trim() !== ''
  }

  // Format date with validation and fallback
  const formatDate = (dateString: string): string => {
    if (!isValidDate(dateString)) {
      // Fallback to current date if invalid
      const now = new Date()
      return now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      // Fallback to current date on error
      const now = new Date()
      return now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return '-'
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch {
      return timeString
    }
  }

  // Helper function to check if a string is a UUID
  const isUUID = (str: string | undefined | null): boolean => {
    if (!str) return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Helper function to format appointment ID - hide UUID if formatted number exists
  const formatAppointmentId = (appointmentNo?: string, id?: string): string => {
    if (appointmentNo && !isUUID(appointmentNo)) {
      return appointmentNo
    }
    if (id && !isUUID(id)) {
      return id
    }
    // If both are UUIDs, show the appointment_no if it exists, otherwise show formatted version
    if (appointmentNo) {
      return appointmentNo.substring(0, 8).toUpperCase() // Show first 8 chars of UUID
    }
    if (id) {
      return `APT-${id.substring(0, 8).toUpperCase()}` // Format as APT-XXXXXXXX
    }
    return '-'
  }

  // Helper function to format patient ID - hide UUID if formatted ID exists
  const formatPatientId = (patientId?: string): string => {
    if (!patientId) return '-'
    if (!isUUID(patientId)) {
      return patientId // Already formatted ID like PAT-20251110-UCR50T
    }
    // If it's a UUID, show formatted version
    return `PAT-${patientId.substring(0, 8).toUpperCase()}`
  }

  const getStatusDisplay = (status: string) => {
    // Map status to stamp text - only return 'CONFIRMED' or 'SCHEDULED'
    const normalizedStatus = status.toLowerCase().trim()
    
    // Return 'SCHEDULED' for scheduled appointments
    if (normalizedStatus === 'scheduled') {
      return 'SCHEDULED'
    }
    
    // Return 'CONFIRMED' for active/in-progress/completed appointments
    if (normalizedStatus === 'checked-in' ||
        normalizedStatus === 'in-progress' ||
        normalizedStatus === 'completed' ||
        normalizedStatus === 'confirmed') {
      return 'CONFIRMED'
    }
    
    // Default to 'SCHEDULED' for all other statuses
    return 'SCHEDULED'
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
      title={`Appointment_Slip_${formatAppointmentId(appointment.appointment_no, appointment.id)}`}
    >
      {/* Header */}
      <PrintHeader />
      
      {/* Document Title */}
      <div className="text-xl font-bold uppercase tracking-widest border-b-2 border-gray-900 pb-2 mb-8 text-center">
        APPOINTMENT CONFIRMATION
      </div>

      {/* Appointment Slip Container */}
      <div className="print-appointment-slip relative pt-8">
        {/* Date in Top-Right Corner */}
        <div className="absolute top-0 right-0 font-mono text-sm text-gray-600">
          Date: {formatDate(appointment.date)}
        </div>

        {/* Grid Layout with Status Stamp */}
        <div className="relative">
          {/* Use PrintGrid for standard label-value pairs */}
          <PrintGrid
            items={[
              { label: 'Patient Name', value: appointment.patient_name || '-' },
              { label: 'Appointment ID', value: formatAppointmentId(appointment.appointment_no, appointment.id) },
              { label: 'Patient ID', value: formatPatientId(appointment.patient_id) },
              { label: 'Contact No.', value: appointment.contact_number || appointment.email || '-' },
              { label: 'Doctor', value: appointment.doctor || 'Dr. [To be assigned]' },
              { label: 'Department', value: appointment.department || 'Ophthalmology' },
              { label: 'Appointment Type', value: appointment.type || '-' },
              { label: 'Duration', value: appointment.duration || '30 minutes' }
            ]}
            className="mt-4"
          />
          
          {/* Rubber Stamp Status - Floating over the grid */}
          <div className="absolute bottom-0 right-0 -mb-6 print:relative print:inline-block print:float-right print:mb-4 print:mt-4">
            <div className="border-4 border-emerald-600 text-emerald-600 text-xl font-black uppercase px-4 py-2 -rotate-6 opacity-80 rounded-md tracking-widest print:opacity-100">
              {getStatusDisplay(appointment.status)}
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="mt-8 space-y-6">
          {/* Room Number */}
          {appointment.room_number && (
            <PrintSection title="Room Number">
              {appointment.room_number}
            </PrintSection>
          )}

          {/* Purpose of Visit */}
          {appointment.reason && (
            <PrintSection title="Purpose of Visit">
              {appointment.reason}
            </PrintSection>
          )}

          {/* Special Notes */}
          {appointment.notes && (
            <PrintSection title="Special Instructions">
              {appointment.notes}
            </PrintSection>
          )}
        </div>

        {/* Instructions Box */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4 mt-8">
          <div className="text-sm font-bold text-gray-900 mb-3">Important Instructions:</div>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Please arrive 15 mins early.</li>
            <li>Bring this slip.</li>
            <li>Carry previous reports.</li>
          </ol>
        </div>

        {/* Standardized Footer */}
        <PrintFooter showTimestamp={true} />
      </div>
    </PrintModalShell>
  )

  return (
    <>
      {typeof window !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  )
}