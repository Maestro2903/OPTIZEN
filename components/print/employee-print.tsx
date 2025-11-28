"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface EmployeePrintProps {
  employee: {
    id: string
    employee_id?: string
    full_name: string
    email?: string
    phone?: string
    position?: string
    department?: string
    hire_date?: string
    salary?: number
    status?: string
    address?: string
    emergency_contact?: string
    emergency_phone?: string
    qualifications?: string
    experience?: string
    date_of_birth?: string
    gender?: string
    blood_group?: string
    marital_status?: string
    created_at: string
  }
  children: React.ReactNode
}

export function EmployeePrint({ employee, children }: EmployeePrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const calculateExperience = () => {
    if (!employee.hire_date) return 'Not calculated'
    const hireDate = new Date(employee.hire_date)
    const today = new Date()
    const years = today.getFullYear() - hireDate.getFullYear()
    const months = today.getMonth() - hireDate.getMonth()

    let totalMonths = years * 12 + months
    if (totalMonths < 0) totalMonths = 0

    const expYears = Math.floor(totalMonths / 12)
    const expMonths = totalMonths % 12

    if (expYears === 0) return `${expMonths} month${expMonths !== 1 ? 's' : ''}`
    if (expMonths === 0) return `${expYears} year${expYears !== 1 ? 's' : ''}`
    return `${expYears} year${expYears !== 1 ? 's' : ''}, ${expMonths} month${expMonths !== 1 ? 's' : ''}`
  }

  const getStatusDisplay = (status?: string) => {
    if (!status) return 'ACTIVE'
    const statusMap: { [key: string]: string } = {
      'active': 'ACTIVE',
      'inactive': 'INACTIVE',
      'terminated': 'TERMINATED',
      'on-leave': 'ON LEAVE',
      'probation': 'PROBATION'
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
          documentType="Employee Record"
          documentTitle="Employee Information Profile"
        >
          {/* Employee Header */}
          <PrintSection title="Employee Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Employee ID" value={employee.employee_id || 'N/A'} uppercase />
                <PrintField label="Full Name" value={employee.full_name} uppercase />
                <PrintField label="Status" value={getStatusDisplay(employee.status)} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="Position" value={employee.position} />
                <PrintField label="Department" value={employee.department} />
                <PrintField label="Record Generated" value={formatDate(new Date().toISOString())} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Personal Details */}
          <PrintSection title="Personal Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Date of Birth" value={employee.date_of_birth ? formatDate(employee.date_of_birth) : undefined} />
                <PrintField label="Gender" value={employee.gender} />
                <PrintField label="Blood Group" value={employee.blood_group} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Marital Status" value={employee.marital_status} />
                <PrintField label="Email" value={employee.email} />
                <PrintField label="Phone" value={employee.phone} />
              </PrintCol>
            </PrintRow>
            {employee.address && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Address" value={employee.address} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Emergency Contact */}
          <PrintSection title="Emergency Contact Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Emergency Contact Name" value={employee.emergency_contact} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Emergency Phone Number" value={employee.emergency_phone} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Employment Details */}
          <PrintSection title="Employment Details">
            <PrintRow>
              <PrintCol>
                <PrintField label="Hire Date" value={employee.hire_date ? formatDate(employee.hire_date) : undefined} />
                <PrintField label="Experience with Company" value={calculateExperience()} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Current Salary" value={formatCurrency(employee.salary)} />
                <PrintField label="Employment Status" value={getStatusDisplay(employee.status)} uppercase />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Qualifications & Experience */}
          <PrintSection title="Qualifications & Experience">
            {employee.qualifications && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Educational Qualifications" value={employee.qualifications} />
                </PrintCol>
              </PrintRow>
            )}
            {employee.experience && (
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Previous Experience" value={employee.experience} />
                </PrintCol>
              </PrintRow>
            )}
          </PrintSection>

          {/* Employment History Table */}
          <PrintSection title="Employment Summary">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Details</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Date of Joining</td>
                  <td>Joined as {employee.position}</td>
                  <td>{employee.hire_date ? formatDate(employee.hire_date) : 'Not recorded'}</td>
                  <td>Completed</td>
                </tr>
                <tr>
                  <td>Probation Period</td>
                  <td>Initial probation period</td>
                  <td>{employee.hire_date ? formatDate(employee.hire_date) : 'Not applicable'}</td>
                  <td>Completed</td>
                </tr>
                <tr>
                  <td>Current Position</td>
                  <td>{employee.position} - {employee.department}</td>
                  <td>Current</td>
                  <td>{getStatusDisplay(employee.status)}</td>
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