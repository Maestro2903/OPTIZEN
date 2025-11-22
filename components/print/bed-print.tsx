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
          documentTitle="Bed Management Report"
        >
          <div className="print-bed-report">
            {/* Bed Identification - Prominent */}
            <div className="print-bed-identification">
              <div className="print-bed-number-large">
                BED {bed.bed_number}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8pt', marginTop: '8pt', fontSize: '10pt' }}>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Room Number</div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>{bed.room_number || '-'}</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Ward</div>
                  <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>{bed.ward || '-'}</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Bed Type</div>
                  <div style={{ fontSize: '11pt' }}>{bed.bed_type || 'Standard'}</div>
                </div>
              </div>
              <div style={{ marginTop: '10pt', textAlign: 'center' }}>
                <div className="print-label" style={{ fontSize: '9pt', marginBottom: '4pt' }}>Current Status</div>
                <div className={`print-status-badge ${bed.status}`}>
                  {getStatusDisplay(bed.status)}
                </div>
              </div>
            </div>

            {/* Current Occupancy Details */}
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
                      <PrintField label="Assigned Nurse" value={bed.assigned_nurse || '-'} />
                    </PrintCol>
                  </PrintRow>
                )}
              </PrintSection>
            )}

            {/* Bed Specifications */}
            <PrintSection title="Bed Specifications">
              <PrintRow>
                <PrintCol>
                  <PrintField label="Bed Type" value={bed.bed_type || 'Standard Hospital Bed'} />
                  <PrintField label="Special Equipment" value={bed.special_equipment || 'Standard equipment'} />
                </PrintCol>
                <PrintCol>
                  <PrintField label="Daily Rate" value={formatCurrency(bed.daily_rate)} />
                  <PrintField label="Maintenance Status" value={bed.status === 'maintenance' ? 'Under maintenance' : 'Operational'} />
                </PrintCol>
              </PrintRow>
            </PrintSection>

            {/* Occupancy History Table */}
            <PrintSection title="Bed Usage History">
              <table className="print-occupancy-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Date Range</th>
                    <th style={{ width: '25%' }}>Patient</th>
                    <th style={{ width: '15%' }}>Duration</th>
                    <th style={{ width: '15%' }}>Status</th>
                    <th style={{ width: '25%' }}>Notes</th>
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
                    <td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic', color: '#666', fontSize: '9pt' }}>
                      Historical data would be populated from bed management system
                    </td>
                  </tr>
                </tbody>
              </table>
            </PrintSection>

            {/* Maintenance Log */}
            <div className="print-maintenance-log">
              <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8pt', textTransform: 'uppercase' }}>
                Maintenance & Cleaning Log
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10pt', fontSize: '10pt' }}>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Last Deep Clean</div>
                  <div style={{ fontSize: '11pt' }}>
                    {bed.last_cleaned ? formatDate(bed.last_cleaned) : 'Schedule required'}
                  </div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Next Scheduled Clean</div>
                  <div style={{ fontSize: '11pt' }}>Daily after discharge</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Maintenance Due</div>
                  <div style={{ fontSize: '11pt' }}>Monthly inspection</div>
                </div>
                <div>
                  <div className="print-label" style={{ fontSize: '9pt' }}>Equipment Check</div>
                  <div style={{ fontSize: '11pt' }}>Weekly verification</div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {bed.notes && (
              <PrintSection title="Special Instructions & Notes">
                <div style={{ fontSize: '11pt', lineHeight: '1.5' }}>{bed.notes}</div>
              </PrintSection>
            )}

            {/* Nursing Supervisor Signature */}
            <PrintSignature 
              doctorName="Nursing Supervisor"
              qualification="Ward Management"
              registrationNumber=""
              date={formatDate(new Date().toISOString())}
            />
          </div>
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}