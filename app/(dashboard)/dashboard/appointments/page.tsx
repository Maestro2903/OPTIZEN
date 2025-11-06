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

// Mock appointments data
const appointments = [
  {
    id: "1",
    date: "08/11/2025",
    time: "09:00 AM",
    patient_name: "AARAV MEHTA",
    patient_age: 45,
    doctor: "Dr. Sarah Martinez",
    type: "consult",
    status: "scheduled",
    room: "Room 1",
    duration: "30 min",
  },
  {
    id: "2",
    date: "08/11/2025",
    time: "10:00 AM",
    patient_name: "PRIYA NAIR",
    patient_age: 34,
    doctor: "Dr. James Wilson",
    type: "follow-up",
    status: "confirmed",
    room: "Room 2",
    duration: "20 min",
  },
  {
    id: "3",
    date: "08/11/2025",
    time: "11:30 AM",
    patient_name: "NISHANT KAREKAR",
    patient_age: 28,
    doctor: "Dr. Sarah Martinez",
    type: "refraction",
    status: "confirmed",
    room: "Room 1",
    duration: "45 min",
  },
  {
    id: "4",
    date: "08/11/2025",
    time: "02:00 PM",
    patient_name: "AISHABEN THAKIR",
    patient_age: 39,
    doctor: "Dr. Anita Desai",
    type: "consult",
    status: "scheduled",
    room: "Room 3",
    duration: "30 min",
  },
  {
    id: "5",
    date: "08/11/2025",
    time: "03:30 PM",
    patient_name: "KARAN SINGH",
    patient_age: 52,
    doctor: "Dr. James Wilson",
    type: "surgery",
    status: "confirmed",
    room: "OT 1",
    duration: "120 min",
  },
  {
    id: "6",
    date: "09/11/2025",
    time: "09:30 AM",
    patient_name: "ROHIT SHARMA",
    patient_age: 41,
    doctor: "Dr. Sarah Martinez",
    type: "follow-up",
    status: "scheduled",
    room: "Room 1",
    duration: "20 min",
  },
  {
    id: "7",
    date: "07/11/2025",
    time: "10:00 AM",
    patient_name: "SNEHA PATEL",
    patient_age: 29,
    doctor: "Dr. James Wilson",
    type: "consult",
    status: "completed",
    room: "Room 2",
    duration: "30 min",
  },
  {
    id: "8",
    date: "07/11/2025",
    time: "02:30 PM",
    patient_name: "ARJUN VERMA",
    patient_age: 38,
    doctor: "Dr. Anita Desai",
    type: "refraction",
    status: "completed",
    room: "Room 3",
    duration: "40 min",
  },
  {
    id: "9",
    date: "06/11/2025",
    time: "11:00 AM",
    patient_name: "MAYA IYER",
    patient_age: 55,
    doctor: "Dr. Sarah Martinez",
    type: "consult",
    status: "cancelled",
    room: "Room 1",
    duration: "30 min",
  },
]

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  "checked-in": "bg-purple-100 text-purple-700 border-purple-200",
  "in-progress": "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-orange-100 text-orange-700 border-orange-200",
}

const typeColors = {
  consult: "bg-blue-50 text-blue-700",
  "follow-up": "bg-green-50 text-green-700",
  surgery: "bg-red-50 text-red-700",
  refraction: "bg-purple-50 text-purple-700",
  other: "bg-gray-50 text-gray-700",
}

const typeLabels = {
  consult: "Consultation",
  "follow-up": "Follow-up",
  surgery: "Surgery",
  refraction: "Refraction",
  other: "Other",
}

export default function AppointmentsPage() {
  const today = new Date().toISOString().split("T")[0]
  
  const todayAppointments = appointments.filter(a => a.date === "08/11/2025")
  const thisWeekAppointments = appointments.filter(a => {
    const date = new Date(a.date.split("/").reverse().join("-"))
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return date >= now && date <= weekFromNow
  })
  
  const pendingConfirmations = appointments.filter(a => a.status === "scheduled").length
  const completedToday = appointments.filter(a => a.date === "08/11/2025" && a.status === "completed").length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Schedule and manage patient appointments
          </p>
        </div>
        <AppointmentForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Book Appointment
          </Button>
        </AppointmentForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">scheduled today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekAppointments.length}</div>
            <p className="text-xs text-muted-foreground">upcoming appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingConfirmations}</div>
            <p className="text-xs text-muted-foreground">awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">appointments done</p>
          </CardContent>
        </Card>
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
                  <TableHead>DATE & TIME</TableHead>
                  <TableHead>PATIENT</TableHead>
                  <TableHead>DOCTOR</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ROOM</TableHead>
                  <TableHead>DURATION</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appointment.date}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{appointment.patient_name}</div>
                        <div className="text-xs text-muted-foreground">{appointment.patient_age} years</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{appointment.doctor}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={typeColors[appointment.type as keyof typeof typeColors]}
                      >
                        {typeLabels[appointment.type as keyof typeof typeLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[appointment.status as keyof typeof statusColors]}
                      >
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{appointment.room}</TableCell>
                    <TableCell className="text-sm">{appointment.duration}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AppointmentForm appointmentData={appointment} mode="edit">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </AppointmentForm>
                        {appointment.status === "scheduled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            title="Confirm"
                            onClick={() => console.log("Confirm:", appointment.id)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {(appointment.status === "scheduled" || appointment.status === "confirmed") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600"
                            title="Cancel"
                            onClick={() => console.log("Cancel:", appointment.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
          <CardDescription>Appointments scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-blue-50 border border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600 mb-1" />
                    <span className="text-xs font-semibold text-blue-700">{appointment.time}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{appointment.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{typeLabels[appointment.type as keyof typeof typeLabels]} with {appointment.doctor}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{appointment.room} • {appointment.duration}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={statusColors[appointment.status as keyof typeof statusColors]}
                >
                  {appointment.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

