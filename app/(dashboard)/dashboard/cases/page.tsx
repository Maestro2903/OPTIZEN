"use client"

import * as React from "react"
import * as z from "zod"
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
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { CasePrint } from "@/components/case-print"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { casesApi, patientsApi, type Case, type CaseFilters } from "@/lib/services/api"


const statusColors = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
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
      // Generate globally unique case number using crypto.randomUUID()
      // This eliminates collision risk under concurrent requests
      const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase()
      const caseNumber = `OPT${new Date().getFullYear()}-${uuid}`
      
      const result = await createCase(
        () => casesApi.create({
          case_no: caseNumber,
          patient_id: caseData.patient_id,
          encounter_date: caseData.encounter_date || new Date().toISOString().split('T')[0],
          visit_type: caseData.visit_type,
          chief_complaint: caseData.chief_complaint,
          history_of_present_illness: caseData.history_of_present_illness,
          past_medical_history: caseData.past_medical_history,
          examination_findings: caseData.examination_findings,
          diagnosis: caseData.diagnosis,
          treatment_plan: caseData.treatment_plan,
          medications_prescribed: caseData.medications_prescribed,
          follow_up_instructions: caseData.follow_up_instructions,
          status: 'active'
        }),
        {
          successMessage: `Case ${caseNumber} has been added successfully.`,
          onSuccess: (newCase) => {
            addItem(newCase)
          }
        }
      )
    } catch (error) {
      console.error('Error creating case:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create case. Please try again."
      })
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SR. NO.</TableHead>
                  <TableHead>CASE NO</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>AGE</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>MOBILE</TableHead>
                  <TableHead>GENDER</TableHead>
                  <TableHead>STATE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading cases...
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No cases found
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem, index) => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</TableCell>
                    <TableCell className="font-medium">{caseItem.case_no}</TableCell>
                    <TableCell className="font-medium uppercase">{caseItem.patients?.full_name || '-'}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-muted-foreground">{caseItem.patients?.email || '-'}</TableCell>
                    <TableCell>{caseItem.patients?.mobile || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {caseItem.patients?.gender || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Case Details - ${caseItem.case_no}`}
                          description={`Complete case information for ${caseItem.patients?.full_name || 'Patient'}`}
                          data={caseItem}
                          // Basic schema for demo purposes; extend as needed
                          schema={z.object({
                            case_no: z.string().min(1),
                            case_date: z.string().min(1),
                            patient_name: z.string().min(1),
                            age: z.number().or(z.string()).transform((v) => Number(v)).pipe(z.number().min(0)),
                            email: z.string().optional(),
                            mobile: z.string().optional(),
                            gender: z.string().min(1),
                            state: z.string().min(1),
                            visit_no: z.string().min(1),
                          })}
                          renderViewAction={(data: any) => (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Case Number</p>
                                  <p className="font-semibold">{data?.case_no}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-semibold">{data?.case_date}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Patient</p>
                                  <p className="font-semibold uppercase">{data?.patient_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Visit Type</p>
                                  <Badge variant="secondary">{data?.visit_no}</Badge>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg mb-3">Patient Information</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Age</p>
                                    <p className="font-medium">{data?.age} years</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Gender</p>
                                    <p className="font-medium">{data?.gender}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">State</p>
                                    <p className="font-medium">{data?.state}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={"case_no" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Case No.</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"case_date" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Date</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"patient_name" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Patient Name</FormLabel>
                                      <FormControl>
                                        <Input className="uppercase" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"age" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Age</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"gender" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Gender</FormLabel>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"state" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>State</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"visit_no" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Visit Type</FormLabel>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select visit type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="First">First</SelectItem>
                                            <SelectItem value="Follow-up-1">Follow-up-1</SelectItem>
                                            <SelectItem value="Follow-up-2">Follow-up-2</SelectItem>
                                            <SelectItem value="Follow-up-3">Follow-up-3</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </Form>
                          )}
                          onSaveAction={async (values: any) => {
                            handleUpdateCase(caseItem.id, values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <CaseForm caseData={caseItem} mode="edit" onSubmit={(data) => handleUpdateCase(caseItem.id, data)}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          diagnosis: caseItem.diagnosis,
                          treatment: caseItem.treatment_plan,
                          prescription: caseItem.medications_prescribed,
                          notes: caseItem.follow_up_instructions,
                          status: caseItem.status,
                        }}>
                          <Button
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
