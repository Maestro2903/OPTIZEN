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

// Mock attendance data
const attendanceRecords = [
  {
    id: "1",
    date: "06/11/2025",
    staff_name: "Dr. Sarah Martinez",
    role: "Ophthalmologist",
    status: "present",
    check_in: "09:00 AM",
    check_out: "06:00 PM",
    hours: 9,
  },
  {
    id: "2",
    date: "06/11/2025",
    staff_name: "Dr. James Wilson",
    role: "Ophthalmologist",
    status: "present",
    check_in: "09:15 AM",
    check_out: "05:45 PM",
    hours: 8.5,
  },
  {
    id: "3",
    date: "06/11/2025",
    staff_name: "Nurse Priya Sharma",
    role: "Nurse",
    status: "present",
    check_in: "08:30 AM",
    check_out: "05:30 PM",
    hours: 9,
  },
  {
    id: "4",
    date: "06/11/2025",
    staff_name: "Rajesh Kumar",
    role: "Receptionist",
    status: "half_day",
    check_in: "09:00 AM",
    check_out: "01:00 PM",
    hours: 4,
  },
  {
    id: "5",
    date: "06/11/2025",
    staff_name: "Dr. Anita Desai",
    role: "Optometrist",
    status: "sick_leave",
    check_in: "-",
    check_out: "-",
    hours: 0,
  },
  {
    id: "6",
    date: "06/11/2025",
    staff_name: "Vikram Singh",
    role: "Technician",
    status: "present",
    check_in: "08:45 AM",
    check_out: "05:45 PM",
    hours: 9,
  },
  {
    id: "7",
    date: "05/11/2025",
    staff_name: "Dr. Sarah Martinez",
    role: "Ophthalmologist",
    status: "present",
    check_in: "09:00 AM",
    check_out: "06:15 PM",
    hours: 9.25,
  },
  {
    id: "8",
    date: "05/11/2025",
    staff_name: "Dr. James Wilson",
    role: "Ophthalmologist",
    status: "casual_leave",
    check_in: "-",
    check_out: "-",
    hours: 0,
  },
  {
    id: "9",
    date: "05/11/2025",
    staff_name: "Nurse Priya Sharma",
    role: "Nurse",
    status: "present",
    check_in: "08:30 AM",
    check_out: "05:30 PM",
    hours: 9,
  },
  {
    id: "10",
    date: "05/11/2025",
    staff_name: "Rajesh Kumar",
    role: "Receptionist",
    status: "present",
    check_in: "09:00 AM",
    check_out: "06:00 PM",
    hours: 9,
  },
]

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
  const today = new Date().toISOString().split("T")[0]
  const todayRecords = attendanceRecords.filter(r => r.date === "06/11/2025")
  
  const totalStaff = 24
  const presentToday = todayRecords.filter(r => r.status === "present" || r.status === "half_day").length
  const absentToday = todayRecords.filter(r => r.status === "absent").length
  const onLeave = todayRecords.filter(r => r.status.includes("leave")).length
  const attendancePercentage = ((presentToday / totalStaff) * 100).toFixed(1)

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
            <div className="text-2xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">all staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday}</div>
            <p className="text-xs text-muted-foreground">currently on duty</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onLeave}</div>
            <p className="text-xs text-muted-foreground">{thisMonthLeaves} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage}%</div>
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
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search staff..."
                  className="pl-8 w-[200px]"
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
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">{record.date}</TableCell>
                    <TableCell className="font-medium">{record.staff_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{record.role}</Badge>
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
                        {record.check_in !== "-" && <Clock className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-sm">{record.check_in}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {record.check_out !== "-" && <Clock className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-sm">{record.check_out}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.hours > 0 ? (
                        <span className="font-semibold">{record.hours}h</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AttendanceForm attendanceData={record} mode="edit">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </AttendanceForm>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
              <span className="font-semibold">22</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Attendance</span>
              <span className="font-semibold">91.2%</span>
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

