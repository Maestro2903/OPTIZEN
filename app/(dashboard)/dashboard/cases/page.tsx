"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  Eye,
  Edit,
  Trash2,
  Printer,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CaseForm } from "@/components/case-form"
import { CaseViewDialog } from "@/components/case-view-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { CasePrint } from "@/components/case-print"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { casesApi, patientsApi, type Case, type CaseFilters } from "@/lib/services/api"


const statusColors = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">
            Manage patient cases and medical records
          </p>
        </div>
        <CaseForm onSubmit={handleAddCase}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Case
          </Button>
        </CaseForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Case List</CardTitle>
              <CardDescription>
                Browse and manage all patient cases
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cases..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[60px]">SR. NO.</TableHead>
                  <TableHead className="min-w-[120px]">PATIENT ID</TableHead>
                  <TableHead className="min-w-[120px]">CASE NO</TableHead>
                  <TableHead className="min-w-[100px]">DATE</TableHead>
                  <TableHead className="min-w-[150px]">PATIENT NAME</TableHead>
                  <TableHead className="min-w-[60px]">AGE</TableHead>
                  <TableHead className="min-w-[100px]">EMAIL</TableHead>
                  <TableHead className="min-w-[100px]">MOBILE</TableHead>
                  <TableHead className="min-w-[80px]">GENDER</TableHead>
                  <TableHead className="min-w-[100px]">STATE</TableHead>
                  <TableHead className="min-w-[100px]">VISIT TYPE</TableHead>
                  <TableHead className="min-w-[80px]">STATUS</TableHead>
                  <TableHead className="min-w-[150px]">CHIEF COMPLAINT</TableHead>
                  <TableHead className="min-w-[150px]">DIAGNOSIS</TableHead>
                  <TableHead className="min-w-[120px]">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                      Loading cases...
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem, index) => {
                    const age = calculateAge(caseItem.patients?.date_of_birth)
                    const formattedDate = caseItem.encounter_date ? new Date(caseItem.encounter_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'
                    return (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-primary">{caseItem.patients?.patient_id || '-'}</TableCell>
                    <TableCell className="font-medium">{caseItem.case_no}</TableCell>
                    <TableCell className="text-muted-foreground">{formattedDate}</TableCell>
                    <TableCell className="font-medium uppercase">{caseItem.patients?.full_name || '-'}</TableCell>
                    <TableCell>{age !== null ? `${age} yrs` : '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{caseItem.patients?.email || '-'}</TableCell>
                    <TableCell>{caseItem.patients?.mobile || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {caseItem.patients?.gender || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{caseItem.patients?.state || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {caseItem.visit_type || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`text-xs ${
                          caseItem.status === 'active' ? statusColors.active :
                          caseItem.status === 'completed' ? statusColors.completed :
                          caseItem.status === 'cancelled' ? statusColors.cancelled :
                          statusColors.pending
                        }`}
                      >
                        {caseItem.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell 
                      className="text-muted-foreground max-w-[150px] truncate" 
                      title={caseItem.chief_complaint || '-'}
                    >
                      {truncateText(caseItem.chief_complaint, 30)}
                    </TableCell>
                    <TableCell 
                      className="text-muted-foreground max-w-[150px] truncate" 
                      title={formatDiagnosis(caseItem.diagnosis)}
                    >
                      {truncateText(formatDiagnosis(caseItem.diagnosis), 30)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
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
                            examination: caseItem.examination_findings,
                            examination_findings: caseItem.examination_findings,
                            
                            // Diagnosis and treatment
                            diagnosis: caseItem.diagnosis,
                            treatment: caseItem.treatment_plan,
                            treatment_plan: caseItem.treatment_plan,
                            medications_prescribed: caseItem.medications_prescribed,
                            prescription: caseItem.medications_prescribed,
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
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="View Case">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </CaseViewDialog>
                        <CaseForm caseData={caseItem} mode="edit" onSubmit={(data) => handleUpdateCase(caseItem.id, data)}>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Edit Case">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </CaseForm>
                        <CasePrint caseData={{
                          id: caseItem.id,
                          case_no: caseItem.case_no,
                          case_date: caseItem.encounter_date,
                          patient_name: caseItem.patients?.full_name || 'N/A',
                          patient_id: caseItem.patients?.patient_id,
                          gender: caseItem.patients?.gender,
                          mobile: caseItem.patients?.mobile,
                          chief_complaint: caseItem.chief_complaint,
                          history: caseItem.history_of_present_illness,
                          examination: caseItem.examination_findings,
                          diagnosis: formatDiagnosis(caseItem.diagnosis),
                          treatment: caseItem.treatment_plan,
                          prescription: caseItem.medications_prescribed,
                          notes: caseItem.follow_up_instructions,
                          status: caseItem.status,
                          visit_no: caseItem.visit_type,
                          age: calculateAge(caseItem.patients?.date_of_birth) || undefined,
                          state: caseItem.patients?.state,
                        }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
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
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete Case">
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
        </CardContent>
      </Card>
    </div>
  )
}
