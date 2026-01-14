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
import { BloodAdviceForm } from "@/components/forms/blood-advice-form"
import { BloodAdvicePrint } from "@/components/print/blood-advice-print"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { bloodAdviceApi, type BloodAdviceRecord, type BloodAdviceFilters } from "@/lib/services/api"

// Helper function to truncate text
function truncateText(text: string | undefined | null, maxLength: number = 50): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Helper function to format blood tests summary
function getBloodTestsSummary(record: BloodAdviceRecord): string {
  const bloodTests = record.blood_investigation_data?.blood_tests || []
  if (bloodTests.length === 0) return 'No tests'
  if (bloodTests.length === 1) return '1 test'
  return `${bloodTests.length} tests`
}

export default function BloodAdvicePage() {
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
  } = useApiList<BloodAdviceRecord>(bloodAdviceApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: 'record_date',
    sortOrder: 'desc'
  })

  const { submitForm: createRecord, loading: createLoading } = useApiForm<BloodAdviceRecord>()
  const { submitForm: updateRecord, loading: updateLoading } = useApiForm<BloodAdviceRecord>()
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
        recordData.record_number = `BA-${timestamp}`
      }

      const response = await createRecord(() => bloodAdviceApi.create(recordData))
      
      if (response) {
        toast({
          title: "Success",
          description: "Blood & advice record created successfully.",
        })
        refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create blood & advice record.",
      })
    }
  }

  const handleUpdateRecord = async (id: string, recordData: any) => {
    try {
      const response = await updateRecord(() => bloodAdviceApi.update(id, recordData))
      
      if (response) {
        toast({
          title: "Success",
          description: "Blood & advice record updated successfully.",
        })
        refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update blood & advice record.",
      })
    }
  }

  const handleDeleteRecord = async (id: string) => {
    try {
      const success = await deleteItem(() => bloodAdviceApi.delete(id))
      
      if (success) {
        toast({
          title: "Success",
          description: "Blood & advice record deleted successfully.",
        })
        refresh()
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete blood & advice record.",
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
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Blood & Advice</h1>
            <p className="text-muted-foreground">
              Manage blood investigation and advice records
            </p>
          </div>
          <BloodAdviceForm onSubmit={handleAddRecord}>
            <Button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700">
              <FolderPlus className="h-4 w-4" />
              Add Blood & Advice
            </Button>
          </BloodAdviceForm>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Blood & Advice Records</h2>
              <p className="text-sm text-muted-foreground">
                Browse and manage all blood investigation and advice records
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
                  <TableHead className="min-w-[150px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    BLOOD SUGAR
                  </TableHead>
                  <TableHead className="min-w-[150px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    BLOOD TESTS
                  </TableHead>
                  <TableHead className="min-w-[200px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    ADVICE
                  </TableHead>
                  <TableHead className="min-w-[140px] border-b text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    ACTION
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
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
                      <span className="text-sm text-muted-foreground">
                        {record.blood_investigation_data?.blood_sugar || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{getBloodTestsSummary(record)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {truncateText(record.advice_remarks, 50)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <BloodAdvicePrint
                          recordData={{
                            id: record.id,
                            record_number: record.record_number,
                            record_date: record.record_date,
                            record_time: record.record_time,
                            patient_id: record.patient_id,
                            patients: record.patients,
                            blood_investigation_data: record.blood_investigation_data,
                            advice_remarks: record.advice_remarks,
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
                        </BloodAdvicePrint>
                        <BloodAdviceForm
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
                        </BloodAdviceForm>
                        <DeleteConfirmDialog
                          title="Delete Blood & Advice Record"
                          description={`Are you sure you want to delete blood & advice record ${record.record_number}? This action cannot be undone.`}
                          onConfirm={() => handleDeleteRecord(record.id)}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md text-destructive transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete Record"
                            disabled={deleteLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </div>
          {pagination && (
            <div className="border-t border-gray-100 p-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}











