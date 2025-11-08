"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  UserCheck,
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  Edit,
  Clock,
  Trash2,
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
import { AttendanceForm } from "@/components/attendance-form"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { attendanceApi, employeesApi, type AttendanceRecord, type AttendanceFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"


const statusColors = {
  present: "bg-green-100 text-green-700 border-green-200",
  absent: "bg-red-100 text-red-700 border-red-200",
  sick_leave: "bg-yellow-100 text-yellow-700 border-yellow-200",
  casual_leave: "bg-blue-100 text-blue-700 border-blue-200",
  paid_leave: "bg-purple-100 text-purple-700 border-purple-200",
  half_day: "bg-orange-100 text-orange-700 border-orange-200",
}

const statusLabels = {
  present: "Present",
  absent: "Absent",
  sick_leave: "Sick Leave",
  casual_leave: "Casual Leave",
  paid_leave: "Paid Leave",
  half_day: "Half Day",
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
  const [attendanceSummary, setAttendanceSummary] = React.useState({
    total_staff: 0,
    present: 0,
    absent: 0,
    on_leave: 0,
    attendance_percentage: 0
  })

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
    refresh
  } = useApiList<AttendanceRecord>(attendanceApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection,
    date: selectedDate
  })

  const { submitForm: createAttendance, loading: createLoading } = useApiForm<AttendanceRecord>()
  const { submitForm: updateAttendance, loading: updateLoading } = useApiForm<AttendanceRecord>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  // Load attendance summary
  React.useEffect(() => {
    const loadSummary = async () => {
      const response = await attendanceApi.getSummary({ date: selectedDate })
      if (response.success && response.data) {
        setAttendanceSummary(response.data)
      }
    }
    loadSummary()
  }, [selectedDate])

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
    filter({ date: selectedDate })
  }, [selectedDate, filter])

  const handleAddAttendance = async (attendanceData: any) => {
    try {
      const result = await createAttendance(
        () => attendanceApi.create({
          user_id: attendanceData.employee_id,
          attendance_date: attendanceData.date,
          status: attendanceData.status,
          check_in_time: attendanceData.check_in_time,
          check_out_time: attendanceData.check_out_time,
          working_hours: attendanceData.working_hours,
          notes: attendanceData.notes,
          marked_by: attendanceData.marked_by
        }),
        {
          successMessage: "Attendance marked successfully.",
          onSuccess: (newRecord) => {
            addItem(newRecord)
          }
        }
      )
    } catch (error) {
      console.error('Error creating attendance record:', error)
    }
  }

  const handleUpdateAttendance = async (recordId: string, values: any) => {
    try {
      const result = await updateAttendance(
        () => attendanceApi.update(recordId, values),
        {
          successMessage: "Attendance updated successfully.",
          onSuccess: (updatedRecord) => {
            updateItem(recordId, updatedRecord)
          }
        }
      )
    } catch (error) {
      console.error('Error updating attendance record:', error)
    }
  }

  const handleDeleteAttendance = async (recordId: string) => {
    const record = attendanceRecords.find(r => r.id === recordId)
    if (!record) return

    const success = await deleteItem(
      () => attendanceApi.delete(recordId),
      {
        successMessage: "Attendance record has been deleted successfully.",
        onSuccess: () => {
          removeItem(recordId)
        }
      }
    )
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: AttendanceFilters = {}

    // Collect all status filters
    const statusFilters = filters.filter(f => 
      ["present", "absent", "sick_leave", "casual_leave", "half_day"].includes(f)
    )
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  // TODO: Replace with server-provided aggregate counts from API
  // Current counts only reflect the current page, not total records
  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "present", label: "Present (page)", count: attendanceRecords.filter(r => r.status === "present").length },
      { id: "absent", label: "Absent (page)", count: attendanceRecords.filter(r => r.status === "absent").length },
      { id: "sick_leave", label: "Sick Leave (page)", count: attendanceRecords.filter(r => r.status === "sick_leave").length },
      { id: "casual_leave", label: "Casual Leave (page)", count: attendanceRecords.filter(r => r.status === "casual_leave").length },
      { id: "half_day", label: "Half Day (page)", count: attendanceRecords.filter(r => r.status === "half_day").length },
    ],
    sortOptions: [
      { id: "attendance_date", label: "Date" },
      { id: "status", label: "Status" },
      { id: "working_hours", label: "Hours" },
    ],
    showExport: true,
    showSettings: true,
  }

  const todayRecords = attendanceRecords.filter(r => r.attendance_date === selectedDate)
  const presentToday = todayRecords.filter(r => r.status === "present" || r.status === "half_day").length
  const absentToday = todayRecords.filter(r => r.status === "absent").length
  const onLeave = todayRecords.filter(r => r.status.includes("leave")).length

  // Calculate month statistics
  const thisMonthLeaves = attendanceRecords.filter(r => r.status.includes("leave")).length
  const thisMonthAbsent = attendanceRecords.filter(r => r.status === "absent").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Attendance</h1>
          <p className="text-muted-foreground">
            Track and manage daily staff attendance
          </p>
        </div>
        <AttendanceForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Mark Attendance
          </Button>
        </AttendanceForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceSummary.total_staff}</div>
            <p className="text-xs text-muted-foreground">all staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceSummary.present}</div>
            <p className="text-xs text-muted-foreground">currently on duty</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceSummary.on_leave}</div>
            <p className="text-xs text-muted-foreground">{thisMonthLeaves} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceSummary.attendance_percentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">today&apos;s attendance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Daily attendance tracking for all staff members
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[150px]"
                disabled={loading}
              />
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
                onExport={() => {
                  toast({
                    title: "Export feature",
                    description: "Attendance export functionality coming soon."
                  })
                }}
                onSettings={() => {
                  toast({
                    title: "Settings",
                    description: "Attendance settings functionality coming soon."
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
                  <TableHead>DATE</TableHead>
                  <TableHead>STAFF NAME</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>CHECK-IN</TableHead>
                  <TableHead>CHECK-OUT</TableHead>
                  <TableHead>HOURS</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading attendance records...
                    </TableCell>
                  </TableRow>
                ) : attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {new Date(record.attendance_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="font-medium uppercase">
                        {record.employees?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.employees?.role || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[record.status as keyof typeof statusColors]}
                        >
                          {statusLabels[record.status as keyof typeof statusLabels]}
                        </Badge>
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
                          <span className="font-semibold">{record.working_hours}h</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AttendanceForm
                            attendanceData={record}
                            mode="edit"
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </AttendanceForm>
                          <DeleteConfirmDialog
                            title="Delete Attendance Record"
                            description="Are you sure you want to delete this attendance record? This action cannot be undone."
                            onConfirm={() => handleDeleteAttendance(record.id)}
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This Month Summary</CardTitle>
            <CardDescription>Attendance overview for current month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Working Days</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Attendance</span>
              <span className="font-semibold">{attendanceSummary.attendance_percentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Leaves Taken</span>
              <span className="font-semibold">{thisMonthLeaves}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Absent Days</span>
              <span className="font-semibold">{thisMonthAbsent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Bulk attendance operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <UserCheck className="mr-2 h-4 w-4" />
              Mark All Present
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Apply Bulk Leave
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

