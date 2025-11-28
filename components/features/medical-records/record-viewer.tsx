"use client"

import * as React from "react"
import { X, Download, Image as ImageIcon, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RecordViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordType: string | null
  record: any | null
}

export function RecordViewer({
  open,
  onOpenChange,
  recordType,
  record
}: RecordViewerProps) {
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) return "N/A"
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatFileSize = (bytes: number | undefined): string => {
    if (bytes === undefined || bytes === null) return "N/A"
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderRecordContent = () => {
    if (!record || !recordType) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No record selected
        </div>
      )
    }

    switch (recordType) {
      case 'cases':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Case Number:</span>
                    <p className="font-mono">{record.case_no || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Encounter Date:</span>
                    <p>{formatDate(record.encounter_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Visit Type:</span>
                    <p>{record.visit_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="secondary">{record.status || 'N/A'}</Badge>
                  </div>
                </div>
                {record.chief_complaint && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Chief Complaint:</span>
                    <p>{record.chief_complaint}</p>
                  </div>
                )}
                {record.diagnosis && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Diagnosis:</span>
                    <p>{Array.isArray(record.diagnosis) ? record.diagnosis.join(', ') : record.diagnosis}</p>
                  </div>
                )}
                {record.treatment_plan && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Treatment Plan:</span>
                    <p>{record.treatment_plan}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'appointments':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Date:</span>
                    <p>{formatDate(record.appointment_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Time:</span>
                    <p>{record.start_time} - {record.end_time}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                    <Badge variant="secondary">{record.type || 'N/A'}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                      {record.status || 'N/A'}
                    </Badge>
                  </div>
                  {record.room && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Room:</span>
                      <p>{record.room}</p>
                    </div>
                  )}
                  {record.users && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Provider:</span>
                      <p>{record.users.full_name || 'N/A'}</p>
                    </div>
                  )}
                </div>
                {record.notes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Notes:</span>
                    <p>{record.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'invoices':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Invoice Number:</span>
                    <p className="font-mono">{record.invoice_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Date:</span>
                    <p>{formatDate(record.invoice_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant={record.status === 'paid' ? 'default' : 'secondary'}>
                      {record.status || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                    <p className="font-semibold">{formatCurrency(record.total_amount)}</p>
                  </div>
                </div>
                {record.invoice_items && record.invoice_items.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-2 block">Items:</span>
                    <div className="space-y-2">
                      {record.invoice_items.map((item: any, index: number) => (
                        <div key={item.id || index} className="border rounded p-2">
                          <p className="font-medium">{item.description || item.item_description}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'prescriptions':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prescription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Date:</span>
                    <p>{formatDate(record.prescription_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="secondary">{record.status || 'N/A'}</Badge>
                  </div>
                  {record.diagnosis && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Diagnosis:</span>
                      <p>{record.diagnosis}</p>
                    </div>
                  )}
                  {record.users && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Prescribed By:</span>
                      <p>{record.users.full_name || 'N/A'}</p>
                    </div>
                  )}
                </div>
                {record.prescription_items && record.prescription_items.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-2 block">Medications:</span>
                    <div className="space-y-2">
                      {record.prescription_items.map((item: any, index: number) => (
                        <div key={item.id || index} className="border rounded p-2">
                          <p className="font-medium">{item.medicine_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.dosage} - {item.frequency} - {item.duration}
                          </p>
                          {item.instructions && (
                            <p className="text-sm text-muted-foreground">{item.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'certificates':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certificate Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Certificate Number:</span>
                    <p className="font-mono">{record.certificate_number || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Issue Date:</span>
                    <p>{formatDate(record.issue_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                    <Badge variant="secondary">{record.type || 'N/A'}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Purpose:</span>
                    <p>{record.purpose || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'operations':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Operation Name:</span>
                    <p className="font-semibold">{record.operation_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Date:</span>
                    <p>{formatDate(record.operation_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="secondary">{record.status || 'N/A'}</Badge>
                  </div>
                  {record.eye && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Eye:</span>
                      <p>{record.eye}</p>
                    </div>
                  )}
                  {record.anesthesia && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Anesthesia:</span>
                      <p>{record.anesthesia}</p>
                    </div>
                  )}
                </div>
                {record.operation_notes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Notes:</span>
                    <p>{record.operation_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'discharges':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Discharge Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Admission Date:</span>
                    <p>{formatDate(record.admission_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Discharge Date:</span>
                    <p>{formatDate(record.discharge_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Discharge Type:</span>
                    <Badge variant="secondary">{record.discharge_type || 'N/A'}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="secondary">{record.status || 'N/A'}</Badge>
                  </div>
                </div>
                {record.discharge_summary && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Summary:</span>
                    <p>{record.discharge_summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'bedAssignments':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bed Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Admission Date:</span>
                    <p>{formatDate(record.admission_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="secondary">{record.status || 'N/A'}</Badge>
                  </div>
                  {record.beds && (
                    <>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Bed Number:</span>
                        <p className="font-mono">{record.beds.bed_number || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Ward:</span>
                        <p>{record.beds.ward_name || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {record.admission_reason && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Admission Reason:</span>
                      <p>{record.admission_reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'opticalOrders':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Optical Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Order Date:</span>
                    <p>{formatDate(record.ordered_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <Badge variant="secondary">{record.status || 'N/A'}</Badge>
                  </div>
                  {record.lens_type && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Lens Type:</span>
                      <p>{record.lens_type}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
                    <p className="font-semibold">{formatCurrency(record.total_amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'oldRecords':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Old Patient Record</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Old Patient ID:</span>
                    <p className="font-mono">{record.old_patient_id || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Upload Date:</span>
                    <p>{formatDate(record.upload_date)}</p>
                  </div>
                  {record.patient_name && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Patient Name:</span>
                      <p>{record.patient_name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">File Count:</span>
                    <p>{record.old_patient_record_files?.length || 0} files</p>
                  </div>
                </div>
                {record.notes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Notes:</span>
                    <p>{record.notes}</p>
                  </div>
                )}
                {record.old_patient_record_files && record.old_patient_record_files.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-2 block">Files:</span>
                    <div className="space-y-2">
                      {record.old_patient_record_files.map((file: any, index: number) => {
                        const isImage = file.file_type?.startsWith('image/')
                        const isPdf = file.file_type === 'application/pdf'
                        return (
                          <div key={file.id || index} className="border rounded p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                {isImage ? (
                                  <ImageIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                ) : isPdf ? (
                                  <FileText className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                ) : (
                                  <FileText className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{file.file_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.file_size)} • {file.file_type || 'Unknown type'}
                                  </p>
                                </div>
                              </div>
                              {file.file_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(file.file_url, '_blank')}
                                  className="shrink-0"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open
                                </Button>
                              )}
                            </div>
                            {isImage && file.file_url && (
                              <div className="mt-2">
                                <img
                                  src={file.file_url}
                                  alt={file.file_name}
                                  className="max-w-full h-auto rounded border"
                                  style={{ maxHeight: '300px' }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'oldRecordFile':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">File Name:</span>
                    <p className="font-medium">{record.file_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">File Size:</span>
                    <p>{formatFileSize(record.file_size)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">File Type:</span>
                    <p>{record.file_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Upload Date:</span>
                    <p>{formatDate(record.created_at)}</p>
                  </div>
                </div>
                {record.file_url && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => window.open(record.file_url, '_blank')}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download/View File
                    </Button>
                    {record.file_type?.startsWith('image/') && (
                      <div className="mt-4">
                        <img
                          src={record.file_url}
                          alt={record.file_name}
                          className="max-w-full h-auto rounded border"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Record Details</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(record, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  const getTitle = () => {
    if (!recordType) return "Record Details"
    const titles: Record<string, string> = {
      cases: "Case Details",
      appointments: "Appointment Details",
      invoices: "Invoice Details",
      prescriptions: "Prescription Details",
      certificates: "Certificate Details",
      operations: "Operation Details",
      discharges: "Discharge Details",
      bedAssignments: "Bed Assignment Details",
      opticalOrders: "Optical Order Details",
      oldRecords: "Old Patient Record",
      oldRecordFile: "File Details"
    }
    return titles[recordType] || "Record Details"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{getTitle()}</SheetTitle>
          <SheetDescription>
            View detailed information about this record
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <ScrollArea className="h-[calc(100vh-150px)]">
          {renderRecordContent()}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

