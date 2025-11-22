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
import { CaseForm } from "@/components/forms/case-form"
import { CaseViewDialog } from "@/components/dialogs/case-view-dialog"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { CasePrint } from "@/components/print/case-print"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { casesApi, patientsApi, type Case, type CaseFilters } from "@/lib/services/api"


const statusStyles = {
  active: {
    container: "border-emerald-100 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  closed: {
    container: "border-gray-200 bg-gray-100 text-gray-600",
    dot: "bg-gray-500",
  },
  default: {
    container: "border-blue-100 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string | undefined | null): number | null {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  if (isNaN(birthDate.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Helper function to truncate text
function truncateText(text: string | undefined | null, maxLength: number = 50): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Helper function to format diagnosis for display
function formatDiagnosis(diagnosis: string | string[] | undefined | null): string {
  if (!diagnosis) return '-'
  if (Array.isArray(diagnosis)) {
    return diagnosis.length > 0 ? diagnosis.join(', ') : '-'
  }
  return diagnosis
}

export default function CasesPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // API hooks
  const {
    data: cases,
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
  } = useApiList<Case>(casesApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: 'encounter_date',
    sortOrder: 'desc'
  })

  const { submitForm: createCase, loading: createLoading } = useApiForm<Case>()
  const { submitForm: updateCase, loading: updateLoading } = useApiForm<Case>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  const handleCopyCaseNumber = React.useCallback((caseNumber: string) => {
    if (!caseNumber || typeof navigator === "undefined" || !navigator.clipboard) {
      return
    }
    navigator.clipboard
      .writeText(caseNumber)
      .then(() => {
        toast({
          title: "Copied",
          description: "Case number copied to clipboard.",
        })
      })
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Unable to copy the case number. Please try again.",
        })
      })
  }, [toast])

  const handleAddCase = async (caseData: any) => {
    try {
      // Generate globally unique case number using timestamp + random string
      // This eliminates collision risk under concurrent requests
      const timestamp = Date.now().toString(36).toUpperCase() // Base36 timestamp
      const random = Math.random().toString(36).substring(2, 8).toUpperCase() // Random string
      const caseNumber = `OPT${new Date().getFullYear()}-${timestamp}-${random}`
      
      // Prepare case data - form already transforms complaints, treatments, and examination_data
      // Use the transformed data directly from the form
      const casePayload: any = {
        ...caseData,
        case_no: caseNumber,
        status: caseData.status || 'active'
      }

      // Ensure encounter_date is set
      if (!casePayload.encounter_date) {
        casePayload.encounter_date = caseData.case_date || new Date().toISOString().split('T')[0]
      }
      
      const result = await createCase(
        () => casesApi.create(casePayload),
        {
          successMessage: `Case ${caseNumber} has been added successfully.`,
          onSuccess: () => {
            // Navigate to first page where new cases appear (with DESC sort)
            setCurrentPage(1)
            changePage(1)
            // Small delay to ensure server has committed the change, then refresh
            setTimeout(() => {
              refresh()
            }, 500)
          },
          onError: (errorMessage: string) => {
            // Error message is already a string from useApiForm
            console.error('Error creating case:', errorMessage)
            // The error toast is already shown by useApiForm
            // Throw error to prevent dialog from closing
            throw new Error(errorMessage)
          }
        }
      )
      
      // If result is null, it means an error occurred
      if (!result) {
        throw new Error('Failed to create case')
      }
    } catch (error: any) {
      // Re-throw error to prevent dialog from closing
      throw error
    }
  }

  const handleUpdateCase = async (caseId: string, values: any) => {
    try {
      const result = await updateCase(
        () => casesApi.update(caseId, values),
        {
          successMessage: "Case has been updated successfully.",
          onSuccess: (updatedCase) => {
            updateItem(caseId, updatedCase)
          }
        }
      )
    } catch (error) {
      console.error('Error updating case:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update case. Please try again."
      })
    }
  }

  const handleDeleteCase = async (caseId: string) => {
    const caseItem = cases.find(c => c.id === caseId)
    if (!caseItem) return

    const success = await deleteItem(
      () => casesApi.delete(caseId),
      {
        successMessage: `Case ${caseItem.case_no} has been deleted successfully.`,
        onSuccess: () => {
          removeItem(caseId)
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
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Cases</h1>
            <p className="text-muted-foreground">
              Manage patient cases and medical records
            </p>
          </div>
          <CaseForm onSubmit={handleAddCase}>
            <Button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700">
              <FolderPlus className="h-4 w-4" />
              Add Case
            </Button>
          </CaseForm>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Case List</h2>
              <p className="text-sm text-muted-foreground">
                Browse and manage all patient cases
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cases..."
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
                    CASE NO
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
                  <TableHead className="min-w-[80px] border-b text-xs font-semibold uppercase tracking-wider text-gray-500">
                    STATUS
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
                      Loading cases...
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => {
                    const age = calculateAge(caseItem.patients?.date_of_birth)
                    const formattedDate = caseItem.encounter_date
                      ? new Date(caseItem.encounter_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '-'
                    return (
                  <TableRow key={caseItem.id}>
                    <TableCell>
                      <div className="group flex items-center gap-2">
                        <span className="max-w-[150px] truncate font-mono text-xs text-gray-700">
                          {caseItem.case_no || '-'}
                        </span>
                        {caseItem.case_no && (
                          <button
                            type="button"
                            onClick={() => handleCopyCaseNumber(caseItem.case_no!)}
                            className="invisible rounded-full p-1 text-gray-400 transition-all hover:text-gray-700 group-hover:visible"
                            aria-label="Copy case number"
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
                          {caseItem.patients?.full_name || '-'}
                        </span>
                        <span className="text-xs font-mono text-blue-600">
                          {caseItem.patients?.patient_id || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {caseItem.patients?.mobile ? (
                        <a
                          href={`tel:${caseItem.patients.mobile}`}
                          className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          <Phone className="h-4 w-4 text-gray-400" />
                          {caseItem.patients.mobile}
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-gray-300" />
                          -
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const statusValue = caseItem.status?.toLowerCase() || "active"
                        const style =
                          statusValue === "active"
                            ? statusStyles.active
                            : statusValue === "closed"
                              ? statusStyles.closed
                              : statusStyles.default
                        return (
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${style.container}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                            <span className="capitalize">{caseItem.status || "Active"}</span>
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <CaseViewDialog
                          caseData={{
                            // Basic info
                            id: caseItem.id,
                            case_no: caseItem.case_no,
                            case_date: caseItem.encounter_date,
                            encounter_date: caseItem.encounter_date,
                            status: caseItem.status,
                            visit_no: caseItem.visit_type,
                            visit_type: caseItem.visit_type,
                            
                            // Patient info
                            patient_name: caseItem.patients?.full_name || 'N/A',
                            patient_id: caseItem.patients?.patient_id,
                            gender: caseItem.patients?.gender,
                            mobile: caseItem.patients?.mobile,
                            age: age,
                            state: caseItem.patients?.state,
                            
                            // Clinical data
                            chief_complaint: caseItem.chief_complaint,
                            history: caseItem.history_of_present_illness,
                            history_of_present_illness: caseItem.history_of_present_illness,
                            past_medical_history: caseItem.past_medical_history,
                            examination_findings: caseItem.examination_findings,
                            
                            // Diagnosis and treatment
                            diagnosis: caseItem.diagnosis,
                            treatment_plan: caseItem.treatment_plan,
                            medications_prescribed: caseItem.medications_prescribed,
                            follow_up_instructions: caseItem.follow_up_instructions,
                            notes: caseItem.follow_up_instructions,
                            
                            // JSONB fields - pass the entire objects
                            complaints: caseItem.complaints || [],
                            treatments: caseItem.treatments || [],
                            diagnostic_tests: caseItem.diagnostic_tests || [],
                            vision_data: caseItem.vision_data || {},
                            examination_data: caseItem.examination_data || {},
                            past_medications: caseItem.past_medications || [],
                          }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md transition-colors hover:bg-gray-100 hover:text-gray-900"
                            title="View Case"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </CaseViewDialog>
                        <CaseForm caseData={caseItem} mode="edit" onSubmit={(data) => handleUpdateCase(caseItem.id, data)}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Edit Case"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </CaseForm>
                        <CasePrint caseData={{
                          // Basic info
                          id: caseItem.id,
                          case_no: caseItem.case_no,
                          case_date: caseItem.encounter_date,
                          encounter_date: caseItem.encounter_date,
                          status: caseItem.status,
                          visit_no: caseItem.visit_type,
                          visit_type: caseItem.visit_type,
                          
                          // Patient info
                          patient_name: caseItem.patients?.full_name || 'N/A',
                          patient_id: caseItem.patients?.patient_id,
                          gender: caseItem.patients?.gender,
                          mobile: caseItem.patients?.mobile,
                          age: calculateAge(caseItem.patients?.date_of_birth) || undefined,
                          state: caseItem.patients?.state,
                          
                          // Clinical data
                          chief_complaint: caseItem.chief_complaint,
                          history_of_present_illness: caseItem.history_of_present_illness,
                          past_medical_history: caseItem.past_medical_history,
                          examination_findings: caseItem.examination_findings,
                          
                          // Diagnosis and treatment
                          diagnosis: caseItem.diagnosis,
                          treatment_plan: caseItem.treatment_plan,
                          medications_prescribed: caseItem.medications_prescribed,
                          follow_up_instructions: caseItem.follow_up_instructions,
                          notes: caseItem.follow_up_instructions,
                          advice_remarks: caseItem.advice_remarks,
                          
                          // JSONB fields - pass the entire objects
                          complaints: caseItem.complaints || [],
                          treatments: caseItem.treatments || [],
                          diagnostic_tests: caseItem.diagnostic_tests || [],
                          vision_data: caseItem.vision_data || {},
                          examination_data: caseItem.examination_data || {},
                        }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md transition-colors hover:bg-gray-100 hover:text-gray-900"
                            title="Print Case Record"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </CasePrint>
                        <DeleteConfirmDialog
                          title="Delete Case"
                          description={`Are you sure you want to delete case ${caseItem.case_no}? This action cannot be undone.`}
                          onConfirm={() => handleDeleteCase(caseItem.id)}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md text-destructive transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete Case"
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
                                <p className="text-sm font-semibold text-gray-900">Patient Snapshot</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">Age</p>
                                  <p className="text-sm font-medium text-gray-800">
                                    {age !== null ? `${age} yrs` : '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">Email</p>
                                  <p className="truncate text-sm font-medium text-gray-800">
                                    {caseItem.patients?.email || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">Gender</p>
                                  <p className="text-sm font-medium text-gray-800 capitalize">
                                    {caseItem.patients?.gender || '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase text-gray-500">State</p>
                                  <p className="text-sm font-medium text-gray-800">
                                    {caseItem.patients?.state || '-'}
                                  </p>
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
