"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface BedPrintProps {
  bed: {
    id: string
    bed_number: string
    room_number?: string
    ward?: string
    bed_type?: string
    status: string
    patient_name?: string
    patient_id?: string
    admission_date?: string
    discharge_date?: string
    daily_rate?: number
    special_equipment?: string
    notes?: string
    last_cleaned?: string
    assigned_nurse?: string
  }
  children: React.ReactNode
}

export function BedPrint({ bed, children }: BedPrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Standard rate'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'available': 'AVAILABLE',
      'occupied': 'OCCUPIED',
      'maintenance': 'UNDER MAINTENANCE',
      'cleaning': 'CLEANING IN PROGRESS',
      'reserved': 'RESERVED'
    }
    return statusMap[status] || status.toUpperCase()
  }

  const calculateOccupancyDuration = () => {
    if (!bed.admission_date) return 'Not applicable'

    const admission = new Date(bed.admission_date)
    const endDate = bed.discharge_date ? new Date(bed.discharge_date) : new Date()
    const diffTime = Math.abs(endDate.getTime() - admission.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Bed Management"
          documentTitle="Bed Allocation & Status Report"
        >
          {/* Bed Information */}
          <PrintSection title="Bed Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Bed Number" value={bed.bed_number} uppercase />
                <PrintField label="Room Number" value={bed.room_number} />
                <PrintField label="Ward" value={bed.ward} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Bed Type" value={bed.bed_type} />
                <PrintField label="Current Status" value={getStatusDisplay(bed.status)} uppercase />
                <PrintField label="Daily Rate" value={formatCurrency(bed.daily_rate)} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Current Occupancy */}
          {bed.status === 'occupied' && (
            <PrintSection title="Current Occupancy Details">
              <PrintRow>
                <PrintCol>
                  <PrintField label="Patient Name" value={bed.patient_name} uppercase />
                  <PrintField label="Patient ID" value={bed.patient_id} />
                </PrintCol>
                <PrintCol>
                  <PrintField label="Admission Date" value={bed.admission_date ? formatDate(bed.admission_date) : undefined} />
                  <PrintField label="Duration of Stay" value={calculateOccupancyDuration()} />
                </PrintCol>
              </PrintRow>

              {bed.discharge_date && (
                <PrintRow>
                  <PrintCol>
                    <PrintField label="Expected Discharge" value={formatDate(bed.discharge_date)} />
                  </PrintCol>
                  <PrintCol>
                    <PrintField label="Assigned Nurse" value={bed.assigned_nurse} />
                  </PrintCol>
                </PrintRow>
              )}
            </PrintSection>
          )}

          {/* Bed Specifications */}
          <PrintSection title="Bed Specifications & Equipment">
            <PrintRow>
              <PrintCol>
                <PrintField label="Bed Type" value={bed.bed_type || 'Standard Hospital Bed'} />
                <PrintField label="Special Equipment" value={bed.special_equipment || 'Standard equipment'} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Last Cleaned" value={bed.last_cleaned ? formatDate(bed.last_cleaned) : 'Needs update'} />
                <PrintField label="Maintenance Status" value={bed.status === 'maintenance' ? 'Under maintenance' : 'Operational'} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Bed History Table */}
          <PrintSection title="Recent Bed Usage History">
            <table className="print-table">
              <thead>
                <tr>
                  <th>Date Range</th>
                  <th>Patient</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {bed.status === 'occupied' && bed.admission_date ? (
                  <tr>
                    <td>{formatDate(bed.admission_date)} - Current</td>
                    <td>{bed.patient_name || 'Current Patient'}</td>
                    <td>{calculateOccupancyDuration()}</td>
                    <td>Occupied</td>
                    <td>{bed.notes || 'Active admission'}</td>
                  </tr>
                ) : (
                  <tr>
                    <td>Current</td>
                    <td>-</td>
                    <td>-</td>
                    <td>{getStatusDisplay(bed.status)}</td>
                    <td>{bed.notes || 'Available for admission'}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                    Historical data would be populated from bed management system
                  </td>
                </tr>
              </tbody>
            </table>
          </PrintSection>

          {/* Maintenance & Cleaning Schedule */}
          <PrintSection title="Maintenance & Cleaning Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Last Deep Clean" value={bed.last_cleaned ? formatDate(bed.last_cleaned) : 'Schedule required'} />
                <PrintField label="Next Scheduled Clean" value="Daily after discharge" />
              </PrintCol>
              <PrintCol>
                <PrintField label="Maintenance Due" value="Monthly inspection" />
                <PrintField label="Equipment Check" value="Weekly verification" />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Additional Notes */}
          {bed.notes && (
            <PrintSection title="Special Instructions & Notes">
              <PrintRow>
                <PrintCol className="w-full">
                  <PrintField label="Notes" value={bed.notes} />
                </PrintCol>
              </PrintRow>
            </PrintSection>
          )}

          {/* Bed Management Guidelines */}
          <div className="print-medical-section">
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10pt', borderBottom: '1px solid #000' }}>
              BED MANAGEMENT PROTOCOLS
            </h4>
            <ul style={{ fontSize: '11pt', lineHeight: '1.4', paddingLeft: '20pt' }}>
              <li>Bed allocation follows hospital admission guidelines</li>
              <li>Daily cleaning and sanitization after each patient discharge</li>
              <li>Equipment inspection before each new patient admission</li>
              <li>Maintenance requests should be submitted immediately</li>
              <li>Patient privacy and comfort protocols must be followed</li>
              <li>Emergency bed allocation procedures available 24/7</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div style={{ marginTop: '20pt', padding: '15pt', border: '1px solid #000', backgroundColor: '#f0f8ff' }}>
            <h4 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8pt', textAlign: 'center' }}>
              HOUSEKEEPING & MAINTENANCE CONTACT
            </h4>
            <div style={{ fontSize: '11pt', lineHeight: '1.3', textAlign: 'center' }}>
              <strong>Housekeeping Department:</strong> Extension 2001<br />
              <strong>Maintenance Department:</strong> Extension 2002<br />
              <strong>Nursing Station:</strong> Extension 2003<br />
              <strong>Emergency Bed Allocation:</strong> Extension 2000
            </div>
          </div>

          {/* Authorized Personnel Signatures */}
          <div className="print-signature-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40pt' }}>
              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>Nursing Supervisor</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>Ward Management</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(new Date().toISOString())}</div>
              </div>

              <div style={{ width: '200pt', textAlign: 'center' }}>
                <div style={{ height: '30pt' }}></div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '5pt' }}>
                  <strong>Housekeeping Manager</strong>
                </div>
                <div style={{ fontSize: '10pt' }}>Maintenance & Cleaning</div>
                <div style={{ fontSize: '10pt' }}>Date: {formatDate(new Date().toISOString())}</div>
              </div>
            </div>
          </div>

          {/* Bed Record Footer */}
          <div style={{ marginTop: '40pt', padding: '10pt', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
            <div style={{ fontSize: '10pt', textAlign: 'center' }}>
              <strong>BED MANAGEMENT RECORD</strong><br />
              Bed: {bed.bed_number} | Room: {bed.room_number} | Status: {getStatusDisplay(bed.status)}<br />
              Report Generated: {formatDate(new Date().toISOString())} | For internal hospital management use only.
            </div>
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}