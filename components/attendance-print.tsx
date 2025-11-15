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

          {/* HR Signature */}
          <PrintSignature 
            doctorName="HR Manager"
            qualification="Human Resources Department"
            registrationNumber=""
            date={formatDate(new Date().toISOString())}
          />
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}