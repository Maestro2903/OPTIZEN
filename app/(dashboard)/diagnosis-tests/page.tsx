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
import { DiagnosisTestForm } from "@/components/forms/diagnosis-test-form"
import { DiagnosisTestPrint } from "@/components/print/diagnosis-test-print"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { diagnosisTestsApi, type DiagnosisTestRecord, type DiagnosisTestFilters } from "@/lib/services/api"

// Helper function to truncate text
function truncateText(text: string | undefined | null, maxLength: number = 50): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Helper function to format diagnosis for display
function formatDiagnosis(diagnosis: string[] | undefined | null): string {
  if (!diagnosis || diagnosis.length === 0) return '-'
  if (diagnosis.length === 1) return diagnosis[0]
  return `${diagnosis.length} diagnoses`
}

export default function DiagnosisTestsPage() {
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
  } = useApiList<DiagnosisTestRecord>(diagnosisTestsApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: 'record_date',
    sortOrder: 'desc'
  })

  const { submitForm: createRecord, loading: createLoading } = useApiForm<DiagnosisTestRecord>()
  const { submitForm: updateRecord, loading: updateLoading } = useApiForm<DiagnosisTestRecord>()
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
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        recordData.record_number = `DX${new Date().getFullYear()}-${timestamp}-${random}`
      }

      const result = await createRecord(
        () => diagnosisTestsApi.create(recordData),
        {
          successMessage: `Diagnosis & Test record ${recordData.record_number} has been added successfully.`,
          onSuccess: () => {
            setCurrentPage(1)
            changePage(1)
            setTimeout(() => {
              refresh()
            }, 500)
          },
          onError: (errorMessage: string) => {
            console.error('Error creating diagnosis test record:', errorMessage)
            throw new Error(errorMessage)
          }
        }
      )
      
      if (!result) {
        throw new Error('Failed to create diagnosis test record')
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleUpdateRecord = async (recordId: string, values: any) => {
    try {
      const result = await updateRecord(
        () => diagnosisTestsApi.update(recordId, values),
        {
          successMessage: "Diagnosis & Test record has been updated successfully.",
          onSuccess: (updatedRecord) => {
            updateItem(recordId, updatedRecord)
          }
        }
      )
    } catch (error) {
      console.error('Error updating diagnosis test record:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update diagnosis test record. Please try again."
      })
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    const recordItem = records.find(r => r.id === recordId)
    if (!recordItem) return

    const success = await deleteItem(
      () => diagnosisTestsApi.delete(recordId),
      {
        successMessage: `Diagnosis & Test record ${recordItem.record_number} has been deleted successfully.`,
        onSuccess: () => {
          removeItem(recordId)
        }
      }
    )
  }

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim())
        setCurrentPage(1)
      } else {
        search("")
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  const getDiagnosisSummary = (record: DiagnosisTestRecord) => {
    const diagnosis = record.diagnosis_data?.diagnosis
    if (!diagnosis || diagnosis.length === 0) {
      return record.diagnosis_data?.diagnosis_pending ? "Pending" : "N/A"
    }
    if (diagnosis.length === 1) {
      return truncateText(diagnosis[0], 40)
    }
    return `${diagnosis.length} diagnoses`
  }

  const getTestsSummary = (record: DiagnosisTestRecord) => {
    const tests = record.tests_data
    if (!tests) return "N/A"
    
    const parts: string[] = []
    if (tests.iop?.right || tests.iop?.left) parts.push("IOP")
    if (tests.sac_test?.right || tests.sac_test?.left) parts.push("SAC")
    if (tests.diagnostic_tests && tests.diagnostic_tests.length > 0) {
      parts.push(`${tests.diagnostic_tests.length} additional`)
    }
    
    return parts.length > 0 ? parts.join(", ") : "N/A"
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Diagnosis & Tests</h1>
            <p className="text-muted-foreground">
              Manage diagnosis and diagnostic test records
            </p>
          </div>
          <DiagnosisTestForm onSubmit={handleAddRecord}>
            <Button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700">
              <FolderPlus className="h-4 w-4" />
              Add Diagnosis & Test
            </Button>
          </DiagnosisTestForm>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Diagnosis & Test Records</h2>
              <p className="text-sm text-muted-foreground">
                Browse and manage all diagnosis and test records
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
                    DIAGNOSIS
                  </TableHead>
                  <TableHead className="min-w-[200px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    TESTS
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
                      <span className="text-sm text-muted-foreground">{getDiagnosisSummary(record)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{getTestsSummary(record)}</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <DiagnosisTestPrint
                          recordData={{
                            id: record.id,
                            record_number: record.record_number,
                            record_date: record.record_date,
                            record_time: record.record_time,
                            patient_id: record.patient_id,
                            patients: record.patients,
                            diagnosis_data: record.diagnosis_data,
                            tests_data: record.tests_data,
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
                        </DiagnosisTestPrint>
                        <DiagnosisTestForm
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
                        </DiagnosisTestForm>
                        <DeleteConfirmDialog
                          title="Delete Diagnosis & Test Record"
                          description={`Are you sure you want to delete diagnosis & test record ${record.record_number}? This action cannot be undone.`}
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
                              <div className="border-b border-gray-100 pb-3">
                                <p className="text-sm font-semibold text-gray-900">Record Details</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">Record Number</p>
                                  <p className="text-sm font-medium text-gray-800">
                                    {record.record_number || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">Date</p>
                                  <p className="text-sm font-medium text-gray-800">
                                    {formattedDate}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">Email</p>
                                  <p className="truncate text-sm font-medium text-gray-800">
                                    {record.patients?.email || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">Gender</p>
                                  <p className="text-sm font-medium text-gray-800 capitalize">
                                    {record.patients?.gender || '-'}
                                  </p>
                                </div>
                              </div>
                              {record.diagnosis_data && (
                                <div className="border-t border-gray-100 pt-3">
                                  <p className="text-[10px] font-semibold uppercase text-gray-500 mb-2">Diagnosis</p>
                                  <div className="space-y-1 text-xs text-gray-700">
                                    {record.diagnosis_data.diagnosis && record.diagnosis_data.diagnosis.length > 0 ? (
                                      record.diagnosis_data.diagnosis.map((d, idx) => (
                                        <div key={idx}>• {d}</div>
                                      ))
                                    ) : (
                                      <div>{record.diagnosis_data.diagnosis_pending ? "Pending" : "None"}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {record.tests_data && (
                                <div className="border-t border-gray-100 pt-3">
                                  <p className="text-[10px] font-semibold uppercase text-gray-500 mb-2">Tests</p>
                                  <div className="space-y-1 text-xs text-gray-700">
                                    {record.tests_data.iop && (
                                      <div>IOP: OD {record.tests_data.iop.right?.value || 'N/A'} | OS {record.tests_data.iop.left?.value || 'N/A'}</div>
                                    )}
                                    {record.tests_data.sac_test && (
                                      <div>SAC: OD {record.tests_data.sac_test.right || 'N/A'} | OS {record.tests_data.sac_test.left || 'N/A'}</div>
                                    )}
                                    {record.tests_data.diagnostic_tests && record.tests_data.diagnostic_tests.length > 0 && (
                                      <div>Additional: {record.tests_data.diagnostic_tests.length} test(s)</div>
                                    )}
                                  </div>
                                </div>
                              )}
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
          <Pagination
            currentPage={pagination?.page || 1}
            totalPages={pagination?.totalPages || 0}
            pageSize={pagination?.limit || 10}
            totalItems={pagination?.total || 0}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
          />
          </div>
        </div>
      </div>
    </div>
  )
}

