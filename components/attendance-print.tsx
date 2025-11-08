"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface AttendancePrintProps {
  attendance: {
    id: string
    employee_name: string
    employee_id?: string
    date: string
    check_in_time?: string
    check_out_time?: string
    status: string
    hours_worked?: string
    overtime_hours?: string
    department?: string
    position?: string
    notes?: string
    break_duration?: string
    location?: string
  }
  children: React.ReactNode
}

export function AttendancePrint({ attendance, children }: AttendancePrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not recorded'
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

  const calculateWorkDuration = () => {
    if (!attendance.check_in_time || !attendance.check_out_time) {
      return attendance.hours_worked || 'Not calculated'
    }

    try {
      const checkIn = new Date(`1970-01-01T${attendance.check_in_time}`)
      const checkOut = new Date(`1970-01-01T${attendance.check_out_time}`)
      const diff = checkOut.getTime() - checkIn.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m`
    } catch {
      return attendance.hours_worked || 'Not calculated'
    }
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'present': 'PRESENT',
      'absent': 'ABSENT',
      'late': 'LATE',
      'half-day': 'HALF DAY',
      'leave': 'ON LEAVE',
      'holiday': 'HOLIDAY'
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
          documentType="Attendance Record"
          documentTitle="Employee Attendance Report"
        >
          {/* Attendance Header */}
          <PrintSection title="Attendance Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Record ID" value={attendance.id} />
                <PrintField label="Date" value={formatDate(attendance.date)} />
                <PrintField label="Status" value={getStatusDisplay(attendance.status)} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="Location" value={attendance.location || 'Main Office'} />
                <PrintField label="Report Generated" value={formatDate(new Date().toISOString())} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Employee Information */}
          <PrintSection title="Employee Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Employee Name" value={attendance.employee_name} uppercase />
                <PrintField label="Employee ID" value={attendance.employee_id} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Department" value={attendance.department} />
                <PrintField label="Position" value={attendance.position} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Time Tracking */}
          <PrintSection title="Time Records">
            <PrintRow>
              <PrintCol>
                <PrintField label="Check-in Time" value={formatTime(attendance.check_in_time)} center />
                <PrintField label="Check-out Time" value={formatTime(attendance.check_out_time)} center />
              </PrintCol>
              <PrintCol>
                <PrintField label="Total Hours Worked" value={calculateWorkDuration()} center />
                <PrintField label="Break Duration" value={attendance.break_duration || 'Standard'} center />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Overtime & Additional Info */}
          {(attendance.overtime_hours || attendance.notes) && (
            <PrintSection title="Additional Information">
              {attendance.overtime_hours && (
                <PrintRow>
                  <PrintCol>
                    <PrintField label="Overtime Hours" value={attendance.overtime_hours} center />
                  </PrintCol>
                  <PrintCol>
                    <PrintField label="Overtime Rate" value="As per company policy" />
                  </PrintCol>
                </PrintRow>
              )}

              {attendance.notes && (
                <PrintRow>
                  <PrintCol className="w-full">
                    <PrintField label="Additional Notes" value={attendance.notes} />
                  </PrintCol>
                </PrintRow>
              )}
            </PrintSection>
          )}

          {/* Attendance Summary Table */}
          <PrintSection title="Daily Summary">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Time Period</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Check-in</td>
                  <td>{attendance.check_in_time ? 'On Time' : 'Not Recorded'}</td>
                  <td>-</td>
                  <td>{attendance.status === 'late' ? 'Late arrival' : 'Regular'}</td>
                </tr>
                <tr>
                  <td>Work Period</td>
                  <td>{getStatusDisplay(attendance.status)}</td>
                  <td>{calculateWorkDuration()}</td>
                  <td>{attendance.notes || '-'}</td>
                </tr>
                <tr>
                  <td>Check-out</td>
                  <td>{attendance.check_out_time ? 'Completed' : 'Pending'}</td>
                  <td>-</td>
                  <td>Regular checkout</td>
                </tr>
              </tbody>
            </table>
          </PrintSection>

          {/* Company Policies Reminder */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              ATTENDANCE POLICY REMINDERS
            </h4>
            <ul style={{ fontSize: '11pt', lineHeight: '1.4', paddingLeft: '20pt' }}>
              <li>Standard working hours: 9:00 AM to 6:00 PM</li>
              <li>Grace period for check-in: 15 minutes</li>
              <li>Lunch break: 1 hour (12:00 PM to 1:00 PM)</li>
              <li>Overtime approval required for work beyond standard hours</li>
              <li>Monthly attendance requirement: Minimum 22 working days</li>
              <li>Leave applications must be submitted in advance</li>
            </ul>
          </div>

          {/* HR Signature Section */}
          <div className="print-signature-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40pt' }}>
              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>Employee Signature</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>{attendance.employee_name}</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(new Date().toISOString())}</div>
              </div>

              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>HR Manager</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>HR Department</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(new Date().toISOString())}</div>
              </div>
            </div>
          </div>

          {/* Record Reference Footer */}
          <div style={{ marginTop: '40pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>ATTENDANCE RECORD VERIFICATION</strong><br />
              Record ID: {attendance.id} | Date: {formatDate(attendance.date)} | Employee: {attendance.employee_name}<br />
              This document is generated electronically and serves as official attendance record.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}