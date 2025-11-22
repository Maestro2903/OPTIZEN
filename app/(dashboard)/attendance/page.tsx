"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Users as UsersIcon,
  Edit,
  Clock,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle,
  CalendarClock,
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
import { AttendanceForm } from "@/components/forms/attendance-form"
import { AttendanceDashboardStats } from "@/components/features/attendance/attendance-dashboard-stats"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { attendanceApi, type AttendanceRecord, type AttendanceFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

const statusStyles = {
  present: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    dot: "bg-emerald-500",
  },
  absent: {
    badge: "bg-rose-50 text-rose-700 border border-rose-100",
    dot: "bg-rose-500",
  },
  late: {
    badge: "bg-amber-50 text-amber-700 border border-amber-100",
    dot: "bg-amber-500",
  },
  half_day: {
    badge: "bg-purple-50 text-purple-700 border border-purple-100",
    dot: "bg-purple-500",
  },
  on_leave: {
    badge: "bg-blue-50 text-blue-700 border border-blue-100",
    dot: "bg-blue-500",
  },
  sick_leave: {
    badge: "bg-blue-50 text-blue-700 border border-blue-100",
    dot: "bg-blue-500",
  },
  casual_leave: {
    badge: "bg-blue-50 text-blue-700 border border-blue-100",
    dot: "bg-blue-500",
  },
  paid_leave: {
    badge: "bg-blue-50 text-blue-700 border border-blue-100",
    dot: "bg-blue-500",
  },
} as const

const statusLabels = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  half_day: "Half Day",
  on_leave: "On Leave",
  sick_leave: "Sick Leave",
  casual_leave: "Casual Leave",
  paid_leave: "Paid Leave",
}

export default function AttendancePage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("attendance_date")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [dateRangeMode, setDateRangeMode] = React.useState(false)
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')
  const [attendanceSummary, setAttendanceSummary] = React.useState({
    total_staff: 0,
    present: 0,
    absent: 0,
    on_leave: 0,
    attendance_percentage: 0,
    average_working_hours: 0
  })
  const [loadingSummary, setLoadingSummary] = React.useState(false)

  // API hooks
  const {
    data: attendanceRecords,
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
    refresh,
    meta
  } = useApiList<AttendanceRecord>(attendanceApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection,
    ...(dateRangeMode ? { date_from: dateFrom, date_to: dateTo } : { date: selectedDate })
  })

  const { submitForm: createAttendance, loading: createLoading } = useApiForm<AttendanceRecord>()
  const { submitForm: updateAttendance, loading: updateLoading } = useApiForm<AttendanceRecord>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  // Load attendance summary
  const loadSummary = React.useCallback(async () => {
    setLoadingSummary(true)
    try {
      const params = dateRangeMode 
        ? { date_from: dateFrom, date_to: dateTo }
        : { date: selectedDate }
      const response = await attendanceApi.getSummary(params)
      if (response.success && response.data) {
        setAttendanceSummary(response.data)
      } else {
        throw new Error(response.error || 'Failed to load attendance summary')
      }
    } catch (err) {
      console.error('Failed to load attendance summary:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load attendance summary"
      })
    } finally {
      setLoadingSummary(false)
    }
  }, [selectedDate, dateRangeMode, dateFrom, dateTo, toast])

  React.useEffect(() => {
    loadSummary()
  }, [loadSummary])

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

  // Handle date filter
  React.useEffect(() => {
    if (dateRangeMode) {
      if (dateFrom && dateTo) {
        filter({ date_from: dateFrom, date_to: dateTo })
      }
    } else {
      filter({ date: selectedDate })
    }
  }, [selectedDate, dateRangeMode, dateFrom, dateTo, filter])

  const handleAddAttendance = async (attendanceData: any) => {
    // Don't catch error here - let it propagate to the form so it can handle it properly
    const result = await createAttendance(
      () => attendanceApi.create({
        user_id: attendanceData.user_id,
        attendance_date: attendanceData.attendance_date,
        status: attendanceData.status,
        check_in_time: attendanceData.check_in_time || undefined,
        check_out_time: attendanceData.check_out_time || undefined,
        notes: attendanceData.notes || undefined,
      }),
      {
        successMessage: "Attendance marked successfully.",
        onSuccess: (newRecord) => {
          addItem(newRecord)
          loadSummary() // Refresh summary stats
        }
      }
    )
  }

  const handleUpdateAttendance = async (values: any) => {
    if (!values.id) return
    
    try {
      const result = await updateAttendance(
        () => attendanceApi.update(values.id, {
          attendance_date: values.attendance_date,
          status: values.status,
          check_in_time: values.check_in_time || undefined,
          check_out_time: values.check_out_time || undefined,
          notes: values.notes || undefined,
        }),
        {
          successMessage: "Attendance updated successfully.",
          onSuccess: (updatedRecord) => {
            updateItem(values.id, updatedRecord)
            loadSummary() // Refresh summary stats
          }
        }
      )
    } catch (error) {
      console.error('Error updating attendance record:', error)
    }
  }

  const handleDeleteAttendance = async (recordId: string) => {
    const success = await deleteItem(
      () => attendanceApi.delete(recordId),
      {
        successMessage: "Attendance record deleted successfully.",
        onSuccess: () => {
          removeItem(recordId)
          loadSummary() // Refresh summary stats
        }
      }
    )
  }


  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: AttendanceFilters = {}

    // Collect all status filters
    const statusFilters = filters.filter(f => 
      ["present", "absent", "sick_leave", "casual_leave", "paid_leave", "half_day"].includes(f)
    )
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters.join(',')
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  const handleRefresh = () => {
    refresh()
    loadSummary()
    toast({
      title: "Refreshed",
      description: "Attendance data has been refreshed."
    })
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "NA"
    const parts = name.trim().split(" ").filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleExport = async () => {
    try {
      // Fetch all records with current filters (no pagination)
      const params: any = {
        limit: 10000, // Large limit to get all records
        sortBy: currentSort,
        sortOrder: sortDirection,
        ...(dateRangeMode ? { date_from: dateFrom, date_to: dateTo } : { date: selectedDate }),
      }
      
      if (searchTerm) params.search = searchTerm
      if (appliedFilters.length > 0) {
        params.status = appliedFilters.join(',')
      }
      
      const response = await attendanceApi.list(params)
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch attendance data for export')
      }
      
      // Convert to CSV
      const headers = [
        'Date',
        'Employee Name',
        'Employee ID',
        'Role',
        'Department',
        'Status',
        'Check-In',
        'Check-Out',
        'Hours Worked',
        'Notes'
      ]
      
      const csvRows = [
        headers.join(','),
        ...response.data.map(record => [
          record.attendance_date,
          `"${record.employees?.full_name || 'N/A'}"`,
          record.employees?.employee_id || '',
          `"${record.employees?.role || ''}"`,
          `"${record.employees?.department || ''}"`,
          record.status,
          record.check_in_time || '',
          record.check_out_time || '',
          record.working_hours || '',
          `"${(record.notes || '').replace(/"/g, '""')}"` // Escape quotes in notes
        ].join(','))
      ]
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      const filename = dateRangeMode 
        ? `attendance_${dateFrom}_to_${dateTo}.csv`
        : `attendance_${selectedDate}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Export Successful",
        description: `Exported ${response.data.length} attendance records to ${filename}`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export attendance data"
      })
    }
  }

  // Use server-provided aggregate counts from API
  const statusCounts = (meta as any)?.statusCounts || {
    present: 0,
    absent: 0,
    sick_leave: 0,
    casual_leave: 0,
    paid_leave: 0,
    half_day: 0
  }
  
  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "present", label: "Present", count: statusCounts.present },
      { id: "absent", label: "Absent", count: statusCounts.absent },
      { id: "sick_leave", label: "Sick Leave", count: statusCounts.sick_leave },
      { id: "casual_leave", label: "Casual Leave", count: statusCounts.casual_leave },
      { id: "paid_leave", label: "Paid Leave", count: statusCounts.paid_leave },
      { id: "half_day", label: "Half Day", count: statusCounts.half_day },
    ],
    sortOptions: [
      { id: "attendance_date", label: "Date" },
      { id: "status", label: "Status" },
      { id: "working_hours", label: "Hours" },
    ],
    showExport: false,
    showSettings: false,
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">Staff Attendance</h1>
          <p className="text-muted-foreground">
            Track and manage daily staff attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            title="Refresh"
            className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-gray-500 shadow-none hover:border-indigo-200 hover:text-indigo-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleExport} 
            title="Export to CSV"
            disabled={loading || attendanceRecords.length === 0}
            className="h-10 w-10 rounded-lg border border-gray-200 bg-white text-gray-500 shadow-none hover:border-indigo-200 hover:text-indigo-600"
          >
            <Download className="h-4 w-4" />
          </Button>
          <AttendanceForm onFormSubmitAction={handleAddAttendance}>
            <Button className="gap-2 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700">
              <CheckCircle className="h-4 w-4" />
              Mark Attendance
            </Button>
          </AttendanceForm>
        </div>
      </div>

      {/* Dashboard Stats */}
      <AttendanceDashboardStats 
        stats={attendanceSummary} 
        loading={loadingSummary}
        date={dateRangeMode ? undefined : selectedDate}
        dateRange={dateRangeMode ? { from: dateFrom, to: dateTo } : undefined}
      />

      {/* Attendance Records Table */}
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {dateRangeMode 
                  ? `Viewing ${dateFrom && dateTo ? `${new Date(dateFrom).toLocaleDateString('en-GB')} - ${new Date(dateTo).toLocaleDateString('en-GB')}` : 'date range'}`
                  : `View and manage attendance for ${selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB') : 'all dates'}`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateRangeMode(!dateRangeMode)
                  if (!dateRangeMode) {
                    // Initialize range with current week
                    const today = new Date()
                    const weekAgo = new Date(today)
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    setDateFrom(weekAgo.toISOString().split('T')[0])
                    setDateTo(today.toISOString().split('T')[0])
                  }
                }}
                disabled={loading}
              >
                {dateRangeMode ? 'Single Date' : 'Date Range'}
              </Button>
              {dateRangeMode ? (
                <>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[150px]"
                    disabled={loading}
                    placeholder="From"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[150px]"
                    disabled={loading}
                    placeholder="To"
                  />
                </>
              ) : (
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-[150px]"
                  disabled={loading}
                />
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search staff..."
                  className="pl-8 w-[200px]"
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
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    DATE
                  </TableHead>
                  <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    EMPLOYEE
                  </TableHead>
                  <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    ROLE
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    STATUS
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    CHECK-IN
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    CHECK-OUT
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    HOURS
                  </TableHead>
                  <TableHead className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                    ACTION
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading attendance records...
                    </TableCell>
                  </TableRow>
                ) : attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <div className="min-h-[400px] w-full px-6 py-12 text-center">
                        <div className="flex h-full flex-col items-center justify-center gap-5">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            <CalendarClock className="h-10 w-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-900">No Records for Today</p>
                            <p className="text-sm text-gray-500">
                              Nobody has checked in yet, or the date filter is empty.
                            </p>
                          </div>
                          <AttendanceForm onFormSubmitAction={handleAddAttendance}>
                            <Button
                              className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
                            >
                              Mark Attendance Now
                            </Button>
                          </AttendanceForm>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {new Date(record.attendance_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                            {getInitials(record.employees?.full_name)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.employees?.full_name || 'N/A'}
                            </div>
                            <div className="font-mono text-xs text-gray-500">
                              {record.employees?.employee_id || '-'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {record.employees?.role || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const statusKey = record.status as keyof typeof statusStyles
                          const badgeClasses =
                            statusStyles[statusKey]?.badge || "bg-slate-100 text-slate-700 border border-slate-200"
                          const dotClasses = statusStyles[statusKey]?.dot || "bg-slate-400"
                          return (
                            <Badge
                              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}
                            >
                              <span className={`h-2 w-2 rounded-full ${dotClasses}`} />
                              {statusLabels[statusKey] || record.status}
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {record.check_in_time && <Clock className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-sm">
                            {record.check_in_time ? new Date(`2000-01-01T${record.check_in_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            }) : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {record.check_out_time && <Clock className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-sm">
                            {record.check_out_time ? new Date(`2000-01-01T${record.check_out_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            }) : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.working_hours && record.working_hours > 0 ? (
                          <span
                            className={`font-semibold ${
                              record.working_hours < 8
                                ? "text-amber-600"
                                : record.working_hours > 9
                                  ? "text-emerald-600"
                                  : "text-gray-900"
                            }`}
                          >
                            {record.working_hours}h
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AttendanceForm
                            attendanceData={{
                              id: record.id,
                              user_id: record.user_id,
                              attendance_date: record.attendance_date,
                              status: record.status,
                              check_in_time: record.check_in_time,
                              check_out_time: record.check_out_time,
                              notes: record.notes
                            }}
                            mode="edit"
                            onFormSubmitAction={handleUpdateAttendance}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </AttendanceForm>
                          <DeleteConfirmDialog
                            title="Delete Attendance Record"
                            description="Are you sure you want to delete this attendance record? This action cannot be undone."
                            onConfirm={() => handleDeleteAttendance(record.id)}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                            >
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
    </div>
  )
}
