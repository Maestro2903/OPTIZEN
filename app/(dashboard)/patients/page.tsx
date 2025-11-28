"use client"

import * as React from "react"
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import * as z from "zod"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { PatientDetailModal } from "@/components/dialogs/patient-detail-modal"
import { PatientFormDialog } from "@/components/dialogs/patient-form-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { patientsApi, type Patient, type PatientFilters } from "@/lib/services/api"

const patientFormSchema = z.object({
  patient_id: z.string().optional(),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  date_of_birth: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().min(10, "Mobile number is required"),
  gender: z.enum(["male", "female", "other"]),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
})


export default function PatientsPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null)
  const [viewingPatient, setViewingPatient] = React.useState<Patient | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)
  const [editingPatientModal, setEditingPatientModal] = React.useState<Patient | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [currentView, setCurrentView] = React.useState("list")
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("full_name")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // API hooks
  const {
    data: patients,
    loading,
    error,
    pagination,
    search,
    sort,
    filter,
    changePage,
    changePageSize,
    addItem,
    updateItem,
    removeItem,
    refresh
  } = useApiList<Patient>(patientsApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createPatient, loading: createLoading } = useApiForm<Patient>()
  const { submitForm: updatePatient, loading: updateLoading } = useApiForm<Patient>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  const handleSubmitPatient = async (values: z.infer<typeof patientFormSchema>) => {
    try {
      if (editingPatient) {
        // Update existing patient
        const result = await updatePatient(
          () => patientsApi.update(editingPatient.id, {
            ...values,
            patient_id: editingPatient.patient_id,
            status: editingPatient.status
          }),
          {
            successMessage: `${values.full_name} has been updated successfully.`,
            onSuccess: (updatedPatient) => {
              updateItem(editingPatient.id, updatedPatient)
            }
          }
        )
        if (result) {
          setIsDialogOpen(false)
          setEditingPatient(null)
        }
      } else {
        // Create new patient
        // patient_id is generated client-side and displayed in the form
        const result = await createPatient(
          () => patientsApi.create({
            ...values,
            patient_id: values.patient_id || `PAT${Date.now()}`,
            status: 'active'
          }),
          {
            successMessage: "",  // We'll show custom message with patient_id
            onSuccess: (newPatient) => {
              addItem(newPatient)
              // Show success toast with generated patient_id
              toast({
                title: "Patient Created Successfully",
                description: `${newPatient.full_name} - ID: ${newPatient.patient_id}`
              })
              // Close dialog after success
              setIsDialogOpen(false)
              setEditingPatient(null)
            },
            onError: (errorMessage) => {
              console.error('Error creating patient:', errorMessage)
              // Error toast is already shown by useApiForm
            }
          }
        )
        // Note: Dialog is closed in onSuccess callback above
      }
    } catch (error) {
      console.error('Error submitting patient form:', error)
    }
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setIsDialogOpen(true)
  }

  const handleView = (patient: Patient) => {
    setViewingPatient(patient)
    setIsViewModalOpen(true)
  }

  const handleEditModal = (patient: Patient) => {
    setEditingPatientModal(patient)
    setIsEditModalOpen(true)
  }

  const handleUpdatePatient = async (values: z.infer<typeof patientFormSchema>) => {
    const patientToUpdate = viewingPatient || editingPatientModal
    if (!patientToUpdate) return
    
    try {
      const result = await updatePatient(
        () => patientsApi.update(patientToUpdate.id, {
          ...values,
          patient_id: patientToUpdate.patient_id,
          status: patientToUpdate.status
        }),
        {
          successMessage: `${values.full_name} has been updated successfully.`,
          onSuccess: (updatedPatient) => {
            updateItem(patientToUpdate.id, updatedPatient)
            if (viewingPatient) {
              setViewingPatient(updatedPatient)
            }
            if (editingPatientModal) {
              setEditingPatientModal(updatedPatient)
            }
          }
        }
      )
      if (result) {
        // If editing from view modal, switch back to view mode
        if (viewingPatient) {
          // Modal will handle switching back to view mode
        }
      }
    } catch (error) {
      console.error('Error updating patient:', error)
    }
  }

  const handleDelete = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) {
      throw new Error('Patient not found')
    }

    const success = await deleteItem(
      () => patientsApi.delete(patientId),
      {
        successMessage: `${patient.full_name} has been deleted successfully.`,
        onSuccess: () => {
          removeItem(patientId)
        }
      }
    )

    // Throw error if delete failed so dialog stays open
    if (!success) {
      throw new Error('Failed to delete patient')
    }
  }

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "active", label: "Active Patients", count: patients.filter(p => p.status === "active").length },
      { id: "male", label: "Male", count: patients.filter(p => p.gender === "male").length },
      { id: "female", label: "Female", count: patients.filter(p => p.gender === "female").length },
      { id: "gujarat", label: "Gujarat", count: patients.filter(p => p.state === "Gujarat").length },
      { id: "maharashtra", label: "Maharashtra", count: patients.filter(p => p.state === "Maharashtra").length },
    ],
    sortOptions: [
      { id: "full_name", label: "Name" },
      { id: "date_of_birth", label: "Age" },
      { id: "created_at", label: "Registration Date" },
      { id: "state", label: "State" },
    ],
    showExport: false,
    showSettings: false,
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view)
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: PatientFilters = {}

    // Collect status filters
    const statusFilters = filters.filter(f => f === "active")
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters
    }
    
    // Collect gender filters
    const genderFilters = filters.filter(f => ["male", "female"].includes(f))
    if (genderFilters.length > 0) {
      filterParams.gender = genderFilters
    }
    
    // Collect state filters
    const stateFilters = filters.filter(f => ["gujarat", "maharashtra"].includes(f))
    if (stateFilters.length > 0) {
      filterParams.state = stateFilters.map(s => s === "gujarat" ? "Gujarat" : "Maharashtra")
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  const handleExport = async () => {
    try {
      // Import dynamically to avoid SSR issues
      const { exportToCSV } = await import('@/lib/utils/export')
      exportToCSV(patients, 'patients')
      toast({
        title: "Export successful",
        description: "Patients data has been exported to CSV."
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export patients data."
      })
    }
  }

  const handleSettings = () => {
    console.log("Open patient settings")
    // Add settings functionality here
  }

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim())
      } else {
        search("")
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  // Handle page changes
  React.useEffect(() => {
    changePage(currentPage)
  }, [currentPage, changePage])

  React.useEffect(() => {
    changePageSize(pageSize)
  }, [pageSize, changePageSize])

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birth = new Date(dateOfBirth)
    // Validate date
    if (isNaN(birth.getTime())) return null
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  }

  // Get initials from full name
  const getInitials = (name: string): string => {
    if (!name) return '??'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return '??'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
  }

  // Generate pastel color based on ID (deterministic)
  const getPastelColor = (id: string): string => {
    const pastelColors = [
      'bg-pink-100 text-pink-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
    ]
    // Use hash of ID to select color consistently
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return pastelColors[Math.abs(hash) % pastelColors.length]
  }

  return (
    <div className="flex flex-col gap-6 bg-gray-50 -m-4 p-4 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-jakarta">Patients</h1>
          <p className="text-gray-500">
            Manage patient records and information
          </p>
        </div>
        <Button 
          className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md" 
          onClick={() => {
            setEditingPatient(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Toolbar Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Title */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Patient Records</h2>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
              {/* Search Input */}
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-10 w-full md:w-[300px] bg-gray-50 focus:bg-white border-gray-200 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {/* Filter/Sort Controls */}
              <div className="[&_button]:!bg-white [&_button]:!border-gray-300 [&_button]:!text-sm [&_button]:!rounded-lg [&_button]:!text-gray-700 [&_button:hover]:!bg-gray-50 [&_button]:!h-9 [&_button]:!px-3">
                <ViewOptions
                  config={viewOptionsConfig}
                  currentView={currentView}
                  appliedFilters={appliedFilters}
                  currentSort={currentSort}
                  sortDirection={sortDirection}
                  onViewChange={handleViewChange}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  onExport={handleExport}
                  onSettings={handleSettings}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Table Content */}
        <div className="p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">SR. NO.</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">PATIENT ID</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">NAME</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">AGE</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">EMAIL</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">MOBILE</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">GENDER</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">STATE</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider">LAST VISIT</TableHead>
                  <TableHead className="uppercase text-xs font-medium text-gray-500 tracking-wider text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Loading patients...
                    </TableCell>
                  </TableRow>
                ) : patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No patients found
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient, index) => (
                  <TableRow key={patient.id} className="hover:bg-gray-50/80 transition-colors">
                    <TableCell>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-blue-600">{patient.patient_id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className={getPastelColor(patient.id || patient.patient_id)}>
                            {getInitials(patient.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-900">{patient.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{calculateAge(patient.date_of_birth) ?? '-'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{patient.email || '-'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{patient.mobile}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`capitalize rounded-full ${
                          patient.gender === 'male' 
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                            : patient.gender === 'female'
                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {patient.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.state || '-'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{new Date(patient.created_at).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 hover:bg-gray-100 hover:text-gray-700 rounded-md transition-colors" 
                                title="View"
                                onClick={() => handleView(patient)}
                              >
                                  <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Patient Details</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                                onClick={() => handleEdit(patient)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Patient</p>
                            </TooltipContent>
                          </Tooltip>
                          <DeleteConfirmDialog
                            title="Delete Patient Permanently"
                            description={`Are you sure you want to permanently delete ${patient.full_name}? This will delete ALL related data including appointments, cases, invoices, certificates, operations, and medical records. This action cannot be undone.`}
                            onConfirm={() => handleDelete(patient.id)}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors" title="Delete Patient">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteConfirmDialog>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-gray-200">
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

      {/* Patient Form Dialog (Add/Edit) */}
      <PatientFormDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingPatient(null)
          }
        }}
        patient={editingPatient}
        onSubmit={handleSubmitPatient}
        loading={createLoading || updateLoading}
      />

      {/* Patient Detail Modal (View Mode) */}
      <PatientDetailModal
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open)
          if (!open) {
            setViewingPatient(null)
          }
        }}
        patient={viewingPatient}
        onSubmit={handleUpdatePatient}
        loading={updateLoading}
        defaultEdit={false}
      />

      {/* Patient Detail Modal (Edit Mode) */}
      <PatientDetailModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open)
          if (!open) {
            setEditingPatientModal(null)
          }
        }}
        patient={editingPatientModal}
        onSubmit={handleUpdatePatient}
        loading={updateLoading}
        defaultEdit={true}
      />
    </div>
  )
}
