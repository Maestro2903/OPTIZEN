"use client"

import * as React from "react"
import {
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
  CalendarPlus,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AppointmentForm } from "@/components/forms/appointment-form"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { ViewEditDialog } from "@/components/dialogs/view-edit-dialog"
import { AppointmentPrint } from "@/components/print/appointment-print"
import { AppointmentViewDialog } from "@/components/dialogs/appointment-view-dialog"
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

const statusStyles: Record<
  string,
  { container: string; dot: string }
> = {
  scheduled: {
    container: "border border-blue-100 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  completed: {
    container: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    container: "border border-red-100 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  "checked-in": {
    container: "border border-amber-100 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  "in-progress": {
    container: "border border-orange-100 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  "no-show": {
    container: "border border-gray-200 bg-gray-50 text-gray-600",
    dot: "bg-gray-400",
  },
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

  const getInitials = (name?: string | null) => {
    if (!name) return "PT"
    const parts = name.split(" ").filter(Boolean)
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
    return initials || "PT"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (time?: string | null) => {
    if (!time) return "--:--"
    return time.slice(0, 5)
  }

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
    <div className="flex flex-col gap-6 rounded-3xl bg-slate-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">Appointments</h1>
          <p className="text-muted-foreground">
            Manage patient appointments and scheduling
          </p>
        </div>
        <AppointmentForm onSubmit={handleAddAppointment}>
          <Button className="gap-2 rounded-lg bg-indigo-600 text-white shadow-md transition-colors hover:bg-indigo-700">
            <CalendarPlus className="h-4 w-4" />
            Schedule Appointment
          </Button>
        </AppointmentForm>
      </div>

      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
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
                <TableRow className="border-b border-gray-200 bg-gray-50/80">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Patient</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Time</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Doctor</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-blue-200 text-sm">
                            <AvatarFallback className="h-full w-full rounded-full bg-blue-100 text-blue-700">
                              {getInitials(appointment.patients?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {appointment.patients?.full_name || "-"}
                            </span>
                            <span className="font-mono text-xs text-gray-500">
                              {appointment.patients?.patient_id || appointment.patient_id || "-"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-700">
                        {formatDate(appointment.appointment_date)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 tabular-nums">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium capitalize text-gray-600">
                          {appointment.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-gray-200">
                            <AvatarFallback className="h-full w-full rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                              {getInitials(appointment.users?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900">
                            {appointment.users?.full_name || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                            statusStyles[appointment.status]?.container ||
                            "border border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              statusStyles[appointment.status]?.dot || "bg-gray-400"
                            }`}
                          />
                          {appointment.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            onClick={() => handleViewAppointment(appointment)}
                            title="View appointment details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            onClick={() => handleEditAppointment(appointment)}
                            title="Edit appointment"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AppointmentPrint appointment={{
                            id: appointment.id,
                            appointment_no: undefined,
                            patient_name: appointment.patients?.full_name || '-',
                            patient_id: appointment.patients?.patient_id || appointment.patient_id,
                            date: appointment.appointment_date,
                            time: `${appointment.start_time} - ${appointment.end_time}`,
                            type: appointment.type,
                            status: appointment.status,
                            doctor: appointment.users?.full_name,
                            department: undefined,
                            contact_number: appointment.patients?.mobile,
                            email: appointment.patients?.email,
                            reason: undefined,
                            duration: undefined,
                            room_number: appointment.room,
                            notes: appointment.notes,
                            created_at: appointment.created_at
                          }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                              title="Print appointment"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </AppointmentPrint>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
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