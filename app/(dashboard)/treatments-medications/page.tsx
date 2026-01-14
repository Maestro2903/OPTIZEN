"use client"

import * as React from "react"
import {
  FolderPlus,
  Copy,
  Phone,
  Search,
  Filter,
  Edit,
  Trash2,
  Printer,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TreatmentMedicationForm } from "@/components/forms/treatment-medication-form"
import { TreatmentMedicationPrint } from "@/components/print/treatment-medication-print"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { treatmentMedicationsApi, type TreatmentMedicationRecord, type TreatmentMedicationFilters } from "@/lib/services/api"

// Helper function to truncate text
function truncateText(text: string | undefined | null, maxLength: number = 50): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Helper function to format medications summary
function getMedicationsSummary(record: TreatmentMedicationRecord): string {
  const medications = record.medications_data?.medications || []
  if (medications.length === 0) return 'No medications'
  if (medications.length === 1) return '1 medication'
  return `${medications.length} medications`
}

// Helper function to format treatments summary
function getTreatmentsSummary(record: TreatmentMedicationRecord): string {
  const parts: string[] = []
  
  const pastMedications = record.past_medications_data?.medications || []
  const pastTreatments = record.past_treatments_data?.treatments || []
  const surgeries = record.surgeries_data?.surgeries || []
  const treatments = record.treatments_data?.treatments || []
  
  if (pastMedications.length > 0) parts.push(`${pastMedications.length} past meds`)
  if (pastTreatments.length > 0) parts.push(`${pastTreatments.length} past treatments`)
  if (surgeries.length > 0) parts.push(`${surgeries.length} surgeries`)
  if (treatments && treatments.length > 0) parts.push(`${treatments.length} treatments`)
  
  return parts.length > 0 ? parts.join(", ") : "N/A"
}

export default function TreatmentsMedicationsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // API hooks
  const {
    data: records,
    loading,
    error,
    pagination,
    search,
    changePage,
    changePageSize,
    addItem,
    updateItem,
    removeItem,
    refresh
  } = useApiList<TreatmentMedicationRecord>(treatmentMedicationsApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: 'record_date',
    sortOrder: 'desc'
  })

  const { submitForm: createRecord, loading: createLoading } = useApiForm<TreatmentMedicationRecord>()
  const { submitForm: updateRecord, loading: updateLoading } = useApiForm<TreatmentMedicationRecord>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  const handleCopyRecordNumber = React.useCallback((recordNumber: string) => {
    if (!recordNumber || typeof navigator === "undefined" || !navigator.clipboard) {
      return
    }
    navigator.clipboard
      .writeText(recordNumber)
      .then(() => {
        toast({
          title: "Copied",
          description: "Record number copied to clipboard.",
        })
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Unable to copy the record number. Please try again.",
        })
      })
  }, [toast])

  const handleAddRecord = async (recordData: any) => {
    try {
      // Generate record number if not provided
      if (!recordData.record_number) {
        const timestamp = Date.now()
        recordData.record_number = `TM-${timestamp}`
      }

      const response = await createRecord(() => treatmentMedicationsApi.create(recordData))
      
      if (response) {
        toast({
          title: "Success",
          description: "Treatment & medication record created successfully.",
        })
        refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create treatment & medication record.",
      })
    }
  }

  const handleUpdateRecord = async (id: string, recordData: any) => {
    try {
      const response = await updateRecord(() => treatmentMedicationsApi.update(id, recordData))
      
      if (response) {
        toast({
          title: "Success",
          description: "Treatment & medication record updated successfully.",
        })
        refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update treatment & medication record.",
      })
    }
  }

  const handleDeleteRecord = async (id: string) => {
    try {
      const success = await deleteItem(() => treatmentMedicationsApi.delete(id))
      
      if (success) {
        toast({
          title: "Success",
          description: "Treatment & medication record deleted successfully.",
        })
        refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete treatment & medication record.",
      })
    }
  }

  // Search handler
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  // Handle pagination
  React.useEffect(() => {
    changePage(currentPage)
  }, [currentPage, changePage])

  React.useEffect(() => {
    changePageSize(pageSize)
  }, [pageSize, changePageSize])

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Treatments & Medications</h1>
            <p className="text-muted-foreground">
              Manage treatment and medication records
            </p>
          </div>
          <TreatmentMedicationForm onSubmit={handleAddRecord}>
            <Button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700">
              <FolderPlus className="h-4 w-4" />
              Add Treatment & Medication
            </Button>
          </TreatmentMedicationForm>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Treatment & Medication Records</h2>
              <p className="text-sm text-muted-foreground">
                Browse and manage all treatment and medication records
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search records..."
                  className="w-full pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto rounded-md border lg:overflow-x-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="min-w-[120px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    RECORD NO
                  </TableHead>
                  <TableHead className="min-w-[100px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    DATE
                  </TableHead>
                  <TableHead className="min-w-[180px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    PATIENT DETAILS
                  </TableHead>
                  <TableHead className="min-w-[120px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    MOBILE
                  </TableHead>
                  <TableHead className="min-w-[200px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    MEDICATIONS
                  </TableHead>
                  <TableHead className="min-w-[200px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    TREATMENTS
                  </TableHead>
                  <TableHead className="min-w-[140px] border-b text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    ACTION
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => {
                    const formattedDate = record.record_date
                      ? new Date(record.record_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '-'
                    return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="group flex items-center gap-2">
                        <span className="max-w-[150px] truncate font-mono text-xs text-gray-700">
                          {record.record_number || '-'}
                        </span>
                        {record.record_number && (
                          <button
                            type="button"
                            onClick={() => handleCopyRecordNumber(record.record_number!)}
                            className="invisible rounded-full p-1 text-gray-400 transition-all hover:text-gray-700 group-hover:visible"
                            aria-label="Copy record number"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{formattedDate}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {record.patients?.full_name || '-'}
                        </span>
                        <span className="text-xs font-mono text-blue-600">
                          {record.patients?.patient_id || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.patients?.mobile ? (
                        <a
                          href={`tel:${record.patients.mobile}`}
                          className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          <Phone className="h-4 w-4 text-gray-400" />
                          {record.patients.mobile}
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-gray-300" />
                          -
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{getMedicationsSummary(record)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{getTreatmentsSummary(record)}</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <TreatmentMedicationPrint
                          recordData={{
                            id: record.id,
                            record_number: record.record_number,
                            record_date: record.record_date,
                            record_time: record.record_time,
                            patient_id: record.patient_id,
                            patients: record.patients,
                            medications_data: record.medications_data,
                            past_medications_data: record.past_medications_data,
                            past_treatments_data: record.past_treatments_data,
                            surgeries_data: record.surgeries_data,
                            treatments_data: record.treatments_data,
                          }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md transition-colors hover:bg-gray-100 hover:text-gray-900"
                            title="Print Record"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TreatmentMedicationPrint>
                        <TreatmentMedicationForm
                          recordData={record}
                          mode="edit"
                          onSubmit={(data) => handleUpdateRecord(record.id, data)}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Edit Record"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TreatmentMedicationForm>
                        <DeleteConfirmDialog
                          title="Delete Treatment & Medication Record"
                          description={`Are you sure you want to delete treatment & medication record ${record.record_number}? This action cannot be undone.`}
                          onConfirm={() => handleDeleteRecord(record.id)}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md text-destructive transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md transition-colors hover:bg-gray-100 hover:text-gray-900"
                              title="More details"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="z-50 w-80 rounded-lg border border-gray-200 bg-white p-0 shadow-xl ring-0"
                          >
                            <div className="flex flex-col gap-4 p-4">
                              <div>
                                <div className="text-xs font-semibold uppercase text-gray-400 mb-2">Record Details</div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Record Number:</span>
                                    <span className="font-medium text-gray-900">{record.record_number || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Date:</span>
                                    <span className="font-medium text-gray-900">
                                      {record.record_date 
                                        ? new Date(record.record_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '-'}
                                    </span>
                                  </div>
                                  {record.record_time && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Time:</span>
                                      <span className="font-medium text-gray-900">{record.record_time}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase text-gray-400 mb-2">Patient Information</div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Name:</span>
                                    <span className="font-medium text-gray-900">{record.patients?.full_name || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Patient ID:</span>
                                    <span className="font-medium text-gray-900">{record.patients?.patient_id || '-'}</span>
                                  </div>
                                  {record.patients?.mobile && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Mobile:</span>
                                      <span className="font-medium text-gray-900">{record.patients.mobile}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase text-gray-400 mb-2">Summary</div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Current Medications:</span>
                                    <span className="font-medium text-gray-900">{getMedicationsSummary(record)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Treatments:</span>
                                    <span className="font-medium text-gray-900">{getTreatmentsSummary(record)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  pageSize={pageSize}
                  totalItems={pagination.total}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

