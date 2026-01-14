"use client"

import * as React from "react"
import {
  FolderPlus,
  Copy,
  Phone,
  Search,
  Filter,
  Eye,
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
import { VisionRecordForm } from "@/components/forms/vision-record-form"
import { VisionRecordPrint } from "@/components/print/vision-record-print"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { visionRecordsApi, type VisionRecord, type VisionRecordFilters } from "@/lib/services/api"

// Helper function to truncate text
function truncateText(text: string | undefined | null, maxLength: number = 50): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export default function VisionPage() {
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
  } = useApiList<VisionRecord>(visionRecordsApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: 'record_date',
    sortOrder: 'desc'
  })

  const { submitForm: createRecord, loading: createLoading } = useApiForm<VisionRecord>()
  const { submitForm: updateRecord, loading: updateLoading } = useApiForm<VisionRecord>()
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
        recordData.record_number = `VIS${new Date().getFullYear()}-${timestamp}-${random}`
      }

      const result = await createRecord(
        () => visionRecordsApi.create(recordData),
        {
          successMessage: `Vision record ${recordData.record_number} has been added successfully.`,
          onSuccess: () => {
            setCurrentPage(1)
            changePage(1)
            setTimeout(() => {
              refresh()
            }, 500)
          },
          onError: (errorMessage: string) => {
            console.error('Error creating vision record:', errorMessage)
            throw new Error(errorMessage)
          }
        }
      )
      
      if (!result) {
        throw new Error('Failed to create vision record')
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleUpdateRecord = async (recordId: string, values: any) => {
    try {
      const result = await updateRecord(
        () => visionRecordsApi.update(recordId, values),
        {
          successMessage: "Vision record has been updated successfully.",
          onSuccess: (updatedRecord) => {
            updateItem(recordId, updatedRecord)
          }
        }
      )
    } catch (error) {
      console.error('Error updating vision record:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vision record. Please try again."
      })
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    const recordItem = records.find(r => r.id === recordId)
    if (!recordItem) return

    const success = await deleteItem(
      () => visionRecordsApi.delete(recordId),
      {
        successMessage: `Vision record ${recordItem.record_number} has been deleted successfully.`,
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

  const getVisionSummary = (record: VisionRecord) => {
    const vision = record.vision_data
    if (!vision) return "N/A"
    const unaided = vision.unaided
    if (unaided?.right || unaided?.left) {
      return `OD: ${unaided?.right || 'N/A'} | OS: ${unaided?.left || 'N/A'}`
    }
    return "N/A"
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Vision Records</h1>
            <p className="text-muted-foreground">
              Manage vision and examination records
            </p>
          </div>
          <VisionRecordForm onSubmit={handleAddRecord}>
            <Button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700">
              <FolderPlus className="h-4 w-4" />
              Add Vision Record
            </Button>
          </VisionRecordForm>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Vision Record List</h2>
              <p className="text-sm text-muted-foreground">
                Browse and manage all vision records
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
                    VISION SUMMARY
                  </TableHead>
                  <TableHead className="min-w-[140px] border-b text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    ACTION
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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
                      <span className="text-sm text-muted-foreground">{getVisionSummary(record)}</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <VisionRecordPrint
                          recordData={{
                            id: record.id,
                            record_number: record.record_number,
                            record_date: record.record_date,
                            record_time: record.record_time,
                            patient_id: record.patient_id,
                            patients: record.patients,
                            vision_data: record.vision_data,
                            examination_data: record.examination_data,
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
                        </VisionRecordPrint>
                        <VisionRecordForm
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
                        </VisionRecordForm>
                        <DeleteConfirmDialog
                          title="Delete Vision Record"
                          description={`Are you sure you want to delete vision record ${record.record_number}? This action cannot be undone.`}
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
                              {record.vision_data && (
                                <div className="border-t border-gray-100 pt-3">
                                  <p className="text-[10px] font-semibold uppercase text-gray-500 mb-2">Vision Data</p>
                                  <div className="space-y-1 text-xs text-gray-700">
                                    {record.vision_data.unaided && (
                                      <div>Unaided: OD {record.vision_data.unaided.right || 'N/A'} | OS {record.vision_data.unaided.left || 'N/A'}</div>
                                    )}
                                    {record.vision_data.aided && (
                                      <div>Aided: OD {record.vision_data.aided.right || 'N/A'} | OS {record.vision_data.aided.left || 'N/A'}</div>
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

