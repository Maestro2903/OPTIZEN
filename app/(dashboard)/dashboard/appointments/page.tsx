"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  UserCheck,
  AlertCircle,
  Printer,
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
import { AppointmentForm } from "@/components/appointment-form"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { AppointmentPrint } from "@/components/appointment-print"
import { AppointmentViewDialog } from "@/components/appointment-view-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { appointmentsApi, type Appointment, type AppointmentFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "checked-in": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "in-progress": "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-gray-100 text-gray-700 border-gray-200",
}

const typeColors = {
  consult: "bg-blue-50 text-blue-700",
  "follow-up": "bg-green-50 text-green-700",
  surgery: "bg-red-50 text-red-700",
  refraction: "bg-purple-50 text-purple-700",
  other: "bg-gray-50 text-gray-700",
}

export default function AppointmentsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("appointment_date")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  
  // View/Edit/Delete state
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)

  // API hooks
  const {
    data: appointments,
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
  } = useApiList<Appointment>(appointmentsApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createAppointment, loading: createLoading } = useApiForm<Appointment>()
  const { submitForm: updateAppointment, loading: updateLoading } = useApiForm<Appointment>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

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

  const handleAddAppointment = async (appointmentData: any) => {
    try {
      const result = await createAppointment(
        () => appointmentsApi.create({
          patient_id: appointmentData.patient_id,
          provider_id: appointmentData.provider_id,
          appointment_date: appointmentData.appointment_date,
          start_time: appointmentData.start_time,
          end_time: appointmentData.end_time,
          type: appointmentData.type,
          room: appointmentData.room,
          notes: appointmentData.notes,
          status: appointmentData.status || 'scheduled'
        }),
        {
          successMessage: `Appointment scheduled successfully.`,
          onSuccess: (newAppointment) => {
            addItem(newAppointment)
            refresh() // Refresh the list to show the new appointment
          }
        }
      )
    } catch (error) {
      console.error('Error creating appointment:', error)
    }
  }

  const handleUpdateAppointment = async (appointmentId: string, values: any) => {
    try {
      const result = await updateAppointment(
        () => appointmentsApi.update(appointmentId, values),
        {
          successMessage: "Appointment updated successfully.",
          onSuccess: (updatedAppointment) => {
            updateItem(appointmentId, updatedAppointment)
          }
        }
      )
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return

    try {
      const success = await deleteItem(
        () => appointmentsApi.delete(selectedAppointment.id),
        {
          successMessage: `Appointment has been cancelled successfully.`,
          onSuccess: () => {
            removeItem(selectedAppointment.id)
            setDeleteDialogOpen(false)
            setSelectedAppointment(null)
          }
        }
      )
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setViewDialogOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDeleteDialogOpen(true)
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: AppointmentFilters = {}
    
    // Collect all status filters
    const statusFilters = filters.filter(f => ["scheduled", "completed", "cancelled", "no-show"].includes(f))
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters
    }

    if (filters.includes("today")) {
      filterParams.date = new Date().toISOString().split('T')[0]
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      // Note: Counts removed because they only reflected current page data.
      // TODO: Fetch total counts from API for accurate global counts
      { id: "today", label: "Today" },
      { id: "scheduled", label: "Scheduled" },
      { id: "completed", label: "Completed" },
      { id: "cancelled", label: "Cancelled" },
      { id: "no-show", label: "No-Show" },
    ],
    sortOptions: [
      { id: "appointment_date", label: "Date & Time" },
      { id: "appointment_type", label: "Type" },
      { id: "status", label: "Status" },
    ],
    showExport: false,
    showSettings: false,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage patient appointments and scheduling
          </p>
        </div>
        <AppointmentForm onSubmit={handleAddAppointment}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Schedule Appointment
          </Button>
        </AppointmentForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Appointment Schedule</CardTitle>
              <CardDescription>
                View and manage all patient appointments
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search appointments..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>
              <ViewOptions
                config={viewOptionsConfig}
                currentView="list"
                appliedFilters={appliedFilters}
                currentSort={currentSort}
                sortDirection={sortDirection}
                onViewChange={() => {}}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onExport={() => {
                  toast({
                    title: "Export feature",
                    description: "Appointment export functionality coming soon."
                  })
                }}
                onSettings={() => {
                  toast({
                    title: "Settings",
                    description: "Appointment settings functionality coming soon."
                  })
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SR. NO.</TableHead>
                  <TableHead>PATIENT ID</TableHead>
                  <TableHead>PATIENT</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>TIME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>DOCTOR</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading appointments...
                    </TableCell>
                  </TableRow>
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No appointments found
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment, index) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-primary">{appointment.patients?.patient_id || '-'}</TableCell>
                      <TableCell className="font-medium uppercase">{appointment.patients?.full_name || '-'}</TableCell>
                      <TableCell>{new Date(appointment.appointment_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{appointment.start_time} - {appointment.end_time}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {appointment.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{appointment.users?.full_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${statusColors[appointment.status as keyof typeof statusColors] || ''}`}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleViewAppointment(appointment)}
                            title="View appointment details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditAppointment(appointment)}
                            title="Edit appointment"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AppointmentPrint appointment={{
                            id: appointment.id,
                            patient_name: appointment.patients?.full_name || '-',
                            patient_id: appointment.patient_id,
                            date: appointment.appointment_date,
                            time: `${appointment.start_time} - ${appointment.end_time}`,
                            type: appointment.type,
                            status: appointment.status,
                            doctor: appointment.users?.full_name,
                            notes: appointment.notes,
                            created_at: appointment.created_at
                          }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Print Appointment"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </AppointmentPrint>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteClick(appointment)}
                            title="Delete appointment"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
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

      {/* View Appointment Dialog */}
      {selectedAppointment && (
        <AppointmentViewDialog
          appointment={{
            id: selectedAppointment.id,
            patient_name: selectedAppointment.patients?.full_name,
            patient_id: selectedAppointment.patients?.patient_id || selectedAppointment.patient_id,
            provider_name: selectedAppointment.users?.full_name,
            appointment_date: selectedAppointment.appointment_date,
            start_time: selectedAppointment.start_time,
            end_time: selectedAppointment.end_time,
            type: selectedAppointment.type,
            status: selectedAppointment.status,
            room: selectedAppointment.room,
            notes: selectedAppointment.notes,
            created_at: selectedAppointment.created_at,
          }}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}

      {/* Edit Appointment Dialog */}
      {selectedAppointment && (
        <AppointmentForm
          appointmentData={{
            patient_id: selectedAppointment.patient_id,
            provider_id: selectedAppointment.provider_id,
            appointment_date: selectedAppointment.appointment_date,
            start_time: selectedAppointment.start_time,
            end_time: selectedAppointment.end_time,
            type: selectedAppointment.type,
            room: selectedAppointment.room,
            notes: selectedAppointment.notes,
          }}
          mode="edit"
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) setSelectedAppointment(null)
          }}
          onSubmit={async (data) => {
            await handleUpdateAppointment(selectedAppointment.id, data)
            setEditDialogOpen(false)
            setSelectedAppointment(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this appointment for{' '}
              <strong>{selectedAppointment?.patients?.full_name || 'this patient'}</strong> scheduled for{' '}
              <strong>{selectedAppointment?.appointment_date}</strong> at{' '}
              <strong>{selectedAppointment?.start_time}</strong>.
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}