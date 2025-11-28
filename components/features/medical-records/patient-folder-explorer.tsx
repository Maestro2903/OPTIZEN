"use client"

import * as React from "react"
import {
  Folder,
  FolderOpen,
  FileText,
  Calendar,
  Receipt,
  Pill,
  Award,
  Stethoscope,
  Bed,
  Eye,
  ChevronRight,
  ChevronDown,
  File,
  Archive,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { PatientRecords } from "@/lib/services/api"

interface PatientFolderExplorerProps {
  records: PatientRecords | null
  onRecordClick: (type: string, record: any) => void
  loading?: boolean
}

interface FolderItem {
  type: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  records: any[]
  color: string
}

export function PatientFolderExplorer({
  records,
  onRecordClick,
  loading = false
}: PatientFolderExplorerProps) {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set())

  const toggleFolder = (folderType: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderType)) {
      newExpanded.delete(folderType)
    } else {
      newExpanded.add(folderType)
    }
    setExpandedFolders(newExpanded)
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getRecordLabel = (type: string, record: any): string => {
    switch (type) {
      case 'cases':
        return `Case ${record.case_no || 'N/A'} - ${formatDate(record.encounter_date)}`
      case 'appointments':
        return `${formatDate(record.appointment_date)} - ${record.type || 'Appointment'}`
      case 'invoices':
        return `Invoice ${record.invoice_number || 'N/A'} - ${formatDate(record.invoice_date)}`
      case 'prescriptions':
        return `Prescription - ${formatDate(record.prescription_date)}`
      case 'certificates':
        return `${record.type || 'Certificate'} - ${formatDate(record.issue_date)}`
      case 'operations':
        return `${record.operation_name || 'Operation'} - ${formatDate(record.operation_date)}`
      case 'discharges':
        return `Discharge - ${formatDate(record.discharge_date)}`
      case 'bedAssignments':
        return `Bed Assignment - ${formatDate(record.admission_date)}`
      case 'opticalOrders':
        return `Optical Order - ${formatDate(record.ordered_at)}`
      case 'oldRecords':
        return `Upload - ${formatDate(record.upload_date)}`
      case 'oldRecordFile':
        return record.file_name || 'File'
      default:
        return `${type} - ${formatDate(record.created_at)}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading patient records...</p>
        </div>
      </div>
    )
  }

  if (!records) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div className="space-y-2">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Select a patient to view their medical records</p>
        </div>
      </div>
    )
  }

  const folders: FolderItem[] = [
    {
      type: 'cases',
      label: 'Cases',
      icon: FileText,
      count: records.summary.totalCases,
      records: records.cases,
      color: 'text-blue-600'
    },
    {
      type: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      count: records.summary.totalAppointments,
      records: records.appointments,
      color: 'text-green-600'
    },
    {
      type: 'invoices',
      label: 'Invoices',
      icon: Receipt,
      count: records.summary.totalInvoices,
      records: records.invoices,
      color: 'text-purple-600'
    },
    {
      type: 'prescriptions',
      label: 'Prescriptions',
      icon: Pill,
      count: records.summary.totalPrescriptions,
      records: records.prescriptions,
      color: 'text-orange-600'
    },
    {
      type: 'certificates',
      label: 'Certificates',
      icon: Award,
      count: records.summary.totalCertificates,
      records: records.certificates,
      color: 'text-yellow-600'
    },
    {
      type: 'operations',
      label: 'Operations',
      icon: Stethoscope,
      count: records.summary.totalOperations,
      records: records.operations,
      color: 'text-red-600'
    },
    {
      type: 'discharges',
      label: 'Discharges',
      icon: FileText,
      count: records.summary.totalDischarges,
      records: records.discharges,
      color: 'text-indigo-600'
    },
    {
      type: 'bedAssignments',
      label: 'Bed Assignments',
      icon: Bed,
      count: records.summary.totalBedAssignments,
      records: records.bedAssignments,
      color: 'text-teal-600'
    },
    {
      type: 'opticalOrders',
      label: 'Optical Orders',
      icon: Eye,
      count: records.summary.totalOpticalOrders,
      records: records.opticalOrders,
      color: 'text-pink-600'
    },
    {
      type: 'oldRecords',
      label: 'Old Records',
      icon: Archive,
      count: records.summary.totalOldRecords || 0,
      records: records.oldRecords || [],
      color: 'text-amber-600'
    }
  ]

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-1 p-2">
        {/* Root Patient Folder */}
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <div className="flex-1">
              {records.patient ? (
                <>
                  <div className="font-semibold text-lg">{records.patient.full_name}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    Patient ID: {records.patient.patient_id}
                  </div>
                </>
              ) : records.oldPatientId ? (
                <>
                  <div className="font-semibold text-lg">Old Patient Records</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    Old Patient ID: {records.oldPatientId}
                  </div>
                </>
              ) : null}
            </div>
            <Badge variant="secondary" className="text-xs">
              {Object.values(records.summary).filter(v => typeof v === 'number').reduce((a: number, b: number) => a + b, 0)} Total Records
            </Badge>
          </div>
        </div>

        {/* Sub-folders */}
        {folders.map((folder) => {
          const isExpanded = expandedFolders.has(folder.type)
          const Icon = folder.icon
          const FolderIcon = isExpanded ? FolderOpen : Folder

          return (
            <div key={folder.type} className="space-y-1">
              {/* Folder Header */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 h-auto py-2 px-3 hover:bg-gray-100",
                  folder.count === 0 && "opacity-50"
                )}
                onClick={() => folder.count > 0 && toggleFolder(folder.type)}
                disabled={folder.count === 0}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <FolderIcon className={cn("h-4 w-4 shrink-0", folder.color)} />
                <span className="flex-1 text-left font-medium">{folder.label}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {folder.count}
                </Badge>
              </Button>

              {/* Folder Contents */}
              {isExpanded && folder.count > 0 && (
                <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-2">
                  {folder.type === 'oldRecords' ? (
                    // Special handling for old records - show uploads with nested files
                    folder.records.map((record, index) => {
                      const hasFiles = record.old_patient_record_files && record.old_patient_record_files.length > 0
                      return (
                        <div key={record.id || index} className="space-y-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-auto py-2 px-3 hover:bg-blue-50 text-left"
                            onClick={() => onRecordClick(folder.type, record)}
                          >
                            <File className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="flex-1 text-sm truncate">
                              {getRecordLabel(folder.type, record)}
                              {hasFiles && ` (${record.old_patient_record_files.length} files)`}
                            </span>
                          </Button>
                          {hasFiles && (
                            <div className="ml-4 space-y-1">
                              {record.old_patient_record_files.map((file: any, fileIndex: number) => (
                                <Button
                                  key={file.id || fileIndex}
                                  variant="ghost"
                                  className="w-full justify-start gap-2 h-auto py-1 px-2 hover:bg-gray-50 text-left text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (file.file_url) {
                                      window.open(file.file_url, '_blank')
                                    } else {
                                      onRecordClick('oldRecordFile', file)
                                    }
                                  }}
                                >
                                  <Download className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="flex-1 text-xs truncate">
                                    {file.file_name}
                                  </span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    folder.records.map((record, index) => (
                      <Button
                        key={record.id || index}
                        variant="ghost"
                        className="w-full justify-start gap-2 h-auto py-2 px-3 hover:bg-blue-50 text-left"
                        onClick={() => onRecordClick(folder.type, record)}
                      >
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-sm truncate">
                          {getRecordLabel(folder.type, record)}
                        </span>
                      </Button>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

