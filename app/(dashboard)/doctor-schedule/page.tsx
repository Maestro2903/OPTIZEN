"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Filter,
  Download,
  RefreshCcw,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { DoctorAppointmentCard } from "@/components/features/appointments/doctor-appointment-card"
import { DoctorStatsWidget } from "@/components/features/doctors/doctor-stats-widget"
import { AppointmentReassignDialog } from "@/components/dialogs/appointment-reassign-dialog"
import { AppointmentViewDialog } from "@/components/dialogs/appointment-view-dialog"
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { useUser } from "@/contexts/user-context"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "checked-in": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "in-progress": "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-gray-100 text-gray-700 border-gray-200",
}

interface Appointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  type: string
  status: string
  room: string | null
  notes: string | null
  patient_code: string
  patient_name: string
  patient_mobile: string
  patient_email: string
  provider_name: string
  is_reassigned: boolean
  original_provider_name: string | null
  reassignment_reason: string | null
  duration_minutes: number
}

interface ScheduleData {
  doctor: {
    id: string
    name: string
    email: string
    role: string
    department: string
    phone: string
  }
  appointments: Appointment[]
  stats: {
    total: number
    scheduled: number
    completed: number
    cancelled: number
    noShow: number
    reassigned: number
  }
}

export default function DoctorSchedulePage() {
  const { toast } = useToast()
  const { user, loading: userLoading } = useUser()
  const [date, setDate] = React.useState<Date>(new Date())
  const [viewMode, setViewMode] = React.useState<'day' | 'week' | 'month'>('day')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [loading, setLoading] = React.useState(false)
  const [scheduleData, setScheduleData] = React.useState<ScheduleData | null>(null)
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)
  const [reassignDialogOpen, setReassignDialogOpen] = React.useState(false)
  
  // For admins: doctor selector
  const [availableDoctors, setAvailableDoctors] = React.useState<SearchableSelectOption[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>('')
  const [loadingDoctors, setLoadingDoctors] = React.useState(false)
  
  // Check if user is admin
  const isAdmin = user?.role && ['super_admin', 'hospital_admin'].includes(user.role)
  const isDoctor = user?.role && ['optometrist', 'ophthalmologist'].includes(user.role)
  
  // Determine which doctor ID to use
  const activeDoctorId = isAdmin ? selectedDoctorId : (isDoctor ? user?.id : '')

  // Get date range based on view mode
  const getDateRange = (selectedDate: Date, mode: 'day' | 'week' | 'month') => {
    switch (mode) {
      case 'day':
        return {
          start: format(selectedDate, 'yyyy-MM-dd'),
          end: format(selectedDate, 'yyyy-MM-dd'),
        }
      case 'week':
        return {
          start: format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        }
      case 'month':
        return {
          start: format(startOfMonth(selectedDate), 'yyyy-MM-dd'),
          end: format(endOfMonth(selectedDate), 'yyyy-MM-dd'),
        }
    }
  }

  // Load available doctors for admins
  React.useEffect(() => {
    if (!isAdmin) return
    
    const loadDoctors = async () => {
      setLoadingDoctors(true)
      try {
        const response = await fetch('/api/employees?limit=1000')
        const result = await response.json()
        
        if (response.ok && result.data) {
          // Filter only doctors (medical professionals)
          const doctors = result.data.filter((emp: any) => 
            emp.is_active !== false && 
            ['optometrist', 'ophthalmologist', 'doctor'].includes(emp.role)
          )
          
          if (doctors.length === 0) {
            toast({
              title: "No Doctors Found",
              description: "No active doctors found in the system.",
              variant: "destructive"
            })
            return
          }
          
          const doctorOptions = doctors.map((doc: any) => ({
            value: doc.id,
            label: `${doc.full_name} - ${doc.role}`,
          }))
          
          setAvailableDoctors(doctorOptions)
          
          // Auto-select first doctor if available
          if (doctorOptions.length > 0 && !selectedDoctorId) {
            setSelectedDoctorId(doctorOptions[0].value)
          }
        } else {
          throw new Error(result.error || 'Failed to load doctors')
        }
      } catch (error) {
        console.error('Error loading doctors:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load doctors list"
        })
      } finally {
        setLoadingDoctors(false)
      }
    }
    
    loadDoctors()
  }, [isAdmin, toast])

  // Fetch schedule data
  const fetchSchedule = React.useCallback(async () => {
    if (!user?.id) return
    
    // For admins, need a doctor selected
    if (isAdmin && !activeDoctorId) {
      setScheduleData(null)
      return
    }
    
    // For doctors, use their own ID
    if (isDoctor && !activeDoctorId) return

    setLoading(true)
    try {
      const dateRange = getDateRange(date, viewMode)
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
        limit: '200',
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/doctors/${activeDoctorId}/schedule?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch schedule')
      }

      setScheduleData(result.data)
    } catch (error) {
      console.error('Error fetching schedule:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load schedule"
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, activeDoctorId, date, viewMode, statusFilter, toast, isAdmin, isDoctor])

  // Load schedule on mount and when dependencies change
  React.useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  // Navigate date
  const navigateDate = (direction: 'prev' | 'next') => {
    setDate(prevDate => {
      switch (viewMode) {
        case 'day':
          return addDays(prevDate, direction === 'next' ? 1 : -1)
        case 'week':
          return addDays(prevDate, direction === 'next' ? 7 : -7)
        case 'month':
          const newMonth = new Date(prevDate)
          newMonth.setMonth(prevDate.getMonth() + (direction === 'next' ? 1 : -1))
          return newMonth
        default:
          return prevDate
      }
    })
  }

  // Handle appointment view
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setViewDialogOpen(true)
  }

  // Handle appointment reassign
  const handleReassignClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setReassignDialogOpen(true)
  }

  // Handle successful reassignment
  const handleReassignSuccess = () => {
    setReassignDialogOpen(false)
    setSelectedAppointment(null)
    fetchSchedule() // Refresh the schedule
    toast({
      title: "Success",
      description: "Appointment reassigned successfully"
    })
  }

  // Group appointments by time slots (for day view)
  const groupAppointmentsByTimeSlot = (appointments: Appointment[]) => {
    const slots: { [key: string]: Appointment[] } = {}
    
    appointments.forEach(apt => {
      const timeKey = apt.start_time
      if (!slots[timeKey]) {
        slots[timeKey] = []
      }
      slots[timeKey].push(apt)
    })

    return Object.entries(slots).sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
  }

  // Group appointments by date (for week/month view)
  const groupAppointmentsByDate = (appointments: Appointment[]) => {
    const dates: { [key: string]: Appointment[] } = {}
    
    appointments.forEach(apt => {
      const dateKey = apt.appointment_date
      if (!dates[dateKey]) {
        dates[dateKey] = []
      }
      dates[dateKey].push(apt)
    })

    return Object.entries(dates).sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
  }

  // Filter appointments by status
  const filteredAppointments = React.useMemo(() => {
    if (!scheduleData?.appointments) return []
    if (statusFilter === 'all') return scheduleData.appointments
    return scheduleData.appointments.filter(apt => apt.status === statusFilter)
  }, [scheduleData?.appointments, statusFilter])

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const toolbarButtonClass =
    "h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-200"

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">
            {isAdmin ? 'My Schedules' : 'My Schedule'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'View and manage doctor appointment schedules'
              : 'View and manage your appointment schedule'
            }
          </p>
        </div>
        <Button onClick={fetchSchedule} variant="outline" className="gap-2">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Admin: Doctor Selector */}
      {isAdmin && (
        <Card className="rounded-xl bg-white shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Select Doctor</CardTitle>
            <CardDescription>Choose a doctor to view their schedule</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <SearchableSelect
              options={availableDoctors}
              value={selectedDoctorId}
              onValueChange={setSelectedDoctorId}
              placeholder={loadingDoctors ? "Loading doctors..." : "Search and select doctor"}
              disabled={loadingDoctors}
              searchPlaceholder="Search by name..."
            />
          </CardContent>
        </Card>
      )}

      {/* Doctor Info Card */}
      {scheduleData?.doctor && (
        <Card className={`rounded-xl bg-white shadow-sm ${isAdmin ? 'mt-2' : ''}`}>
          <CardHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{scheduleData.doctor.name}</CardTitle>
                <CardDescription>
                  {scheduleData.doctor.role} • {scheduleData.doctor.department || 'General'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Stats */}
      {scheduleData?.stats && (
        <DoctorStatsWidget stats={scheduleData.stats} />
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-gray-100/70 p-2 shadow-inner">
              <Button
                  variant="ghost"
                  size="icon"
                onClick={() => navigateDate('prev')}
                  className={`${toolbarButtonClass} w-10 px-0`}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`${toolbarButtonClass} gap-2 min-w-[200px]`}
                    >
                    <CalendarIcon className="h-4 w-4" />
                    {format(date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                  variant="ghost"
                  size="icon"
                onClick={() => navigateDate('next')}
                  className={`${toolbarButtonClass} w-10 px-0`}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                  variant="ghost"
                onClick={() => setDate(new Date())}
                  className={toolbarButtonClass}
              >
                Today
              </Button>
              </div>
            </div>

            {/* View Mode */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList className="rounded-2xl border border-gray-200 bg-gray-100 p-1 shadow-inner">
                <TabsTrigger
                  value="day"
                  className="rounded-xl px-5 py-2 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  Day
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="rounded-xl px-5 py-2 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  Week
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="rounded-xl px-5 py-2 text-sm font-semibold text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                >
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`w-[180px] ${toolbarButtonClass} justify-between`}>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'day' && `Appointments for ${format(date, 'EEEE, MMMM d, yyyy')}`}
            {viewMode === 'week' && `Week of ${format(date, 'MMMM d, yyyy')}`}
            {viewMode === 'month' && format(date, 'MMMM yyyy')}
          </CardTitle>
          <CardDescription>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCcw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isAdmin && !selectedDoctorId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Select a Doctor</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a doctor from the dropdown above to view their schedule
              </p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-gray-800">No appointments found</p>
              <p className="text-sm text-gray-500 mt-1">
                {statusFilter !== 'all' 
                  ? 'Try changing the status filter'
                  : 'No appointments scheduled for this period'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {viewMode === 'day' ? (
                // Day view: Group by time slot
                groupAppointmentsByTimeSlot(filteredAppointments).map(([time, appointments]) => (
                  <div key={time} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {time}
                    </div>
                    <div className="space-y-2 pl-6">
                      {appointments.map((appointment) => (
                        <DoctorAppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onView={handleViewAppointment}
                          onReassign={handleReassignClick}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Week/Month view: Group by date
                groupAppointmentsByDate(filteredAppointments).map(([dateStr, appointments]) => (
                  <div key={dateStr} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="space-y-2 pl-6">
                      {appointments.map((appointment) => (
                        <DoctorAppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onView={handleViewAppointment}
                          onReassign={handleReassignClick}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Appointment Dialog */}
      {selectedAppointment && (
        <AppointmentViewDialog
          appointment={{
            id: selectedAppointment.id,
            patient_name: selectedAppointment.patient_name,
            patient_id: selectedAppointment.patient_code,
            provider_name: selectedAppointment.provider_name,
            appointment_date: selectedAppointment.appointment_date,
            start_time: selectedAppointment.start_time,
            end_time: selectedAppointment.end_time,
            type: selectedAppointment.type,
            status: selectedAppointment.status,
            room: selectedAppointment.room,
            notes: selectedAppointment.notes,
            created_at: '', // Not available in this view
          }}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}

      {/* Reassign Appointment Dialog */}
      {selectedAppointment && (
        <AppointmentReassignDialog
          appointment={selectedAppointment}
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          onSuccess={handleReassignSuccess}
        />
      )}
    </div>
  )
}
