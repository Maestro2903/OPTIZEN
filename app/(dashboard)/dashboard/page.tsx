"use client"

import * as React from "react"
import {
  Users,
  FolderOpen,
  Stethoscope,
  FileText,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowRight,
  Activity,
  DollarSign,
  Award,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  const kpis = [
    {
      title: "Total Patients",
      value: "2,847",
      change: "+12.5%",
      changeLabel: "vs last month",
      trend: "up",
      icon: Users,
      color: "blue-600",
      gradient: "from-blue-600 to-blue-700",
    },
    {
      title: "Active Cases",
      value: "245",
      change: "+8.3%",
      changeLabel: "this month",
      trend: "up",
      icon: FolderOpen,
      color: "green-600",
      gradient: "from-green-600 to-green-700",
    },
    {
      title: "Operations",
      value: "38",
      change: "+5.2%",
      changeLabel: "scheduled",
      trend: "up",
      icon: Stethoscope,
      color: "purple-600",
      gradient: "from-purple-600 to-purple-700",
    },
    {
      title: "Revenue",
      value: "₹12.45L",
      change: "+15.8%",
      changeLabel: "this month",
      trend: "up",
      icon: DollarSign,
      color: "amber-600",
      gradient: "from-amber-600 to-amber-700",
    },
  ]

  const todayAppointments = [
    {
      id: 1,
      time: "09:00 AM",
      patient: "AARAV MEHTA",
      type: "Follow-up Consultation",
      doctor: "Dr. Sarah Martinez",
      status: "confirmed",
    },
    {
      id: 2,
      time: "10:30 AM",
      patient: "PRIYA NAIR",
      type: "Eye Examination",
      doctor: "Dr. James Wilson",
      status: "confirmed",
    },
    {
      id: 3,
      time: "02:00 PM",
      patient: "NISHANT KAREKAR",
      type: "LASIK Consultation",
      doctor: "Dr. Sarah Martinez",
      status: "pending",
    },
    {
      id: 4,
      time: "03:30 PM",
      patient: "AISHABEN THAKIR",
      type: "Post-Op Checkup",
      doctor: "Dr. James Wilson",
      status: "confirmed",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: "New case registered",
      patient: "KARAN SINGH",
      time: "10 minutes ago",
      type: "case",
    },
    {
      id: 2,
      action: "Operation completed",
      patient: "ARJUN VERMA",
      time: "1 hour ago",
      type: "operation",
    },
    {
      id: 3,
      action: "Patient discharged",
      patient: "ROHIT SHARMA",
      time: "2 hours ago",
      type: "discharge",
    },
    {
      id: 4,
      action: "Invoice generated",
      patient: "SNEHA PATEL",
      time: "3 hours ago",
      type: "billing",
    },
  ]

  const statusColors = {
    confirmed: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your OpticNauts overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <div className={`p-3 rounded-xl bg-${kpi.color.split('-')[0]}-50 shadow-md`}>
                <kpi.icon className={`h-5 w-5 text-${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={kpi.trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                >
                      {kpi.change}
                </Badge>
                <span className="text-xs text-muted-foreground">{kpi.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Today's Appointments */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today&apos;s Appointments</CardTitle>
                <CardDescription>You have {todayAppointments.length} appointments today</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.map((appointment) => (
                <div
                key={appointment.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-blue-50 border border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600 mb-1" />
                    <span className="text-xs font-semibold text-blue-700">{appointment.time}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{appointment.patient}</p>
                    <p className="text-xs text-muted-foreground">{appointment.type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">with {appointment.doctor}</p>
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
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-300 transition-smooth text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">New Patient</p>
                <p className="text-xs text-slate-600">Register patient</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-300 transition-smooth text-left">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">New Case</p>
                <p className="text-xs text-slate-600">Create case record</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-300 transition-smooth text-left">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Schedule Operation</p>
                <p className="text-xs text-slate-600">Book surgery slot</p>
            </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-300 transition-smooth text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
          </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Create Invoice</p>
                <p className="text-xs text-slate-600">Generate billing</p>
        </div>
            </button>
          </CardContent>
        </Card>
            </div>
            
      {/* Bottom Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
              {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.patient}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                <Badge variant="secondary" className="text-xs">
                  {activity.type}
                </Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Monthly overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Patient Growth</span>
                <span className="font-semibold">82%</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Operation Success</span>
                <span className="font-semibold">98%</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Revenue Target</span>
                <span className="font-semibold">76%</span>
                </div>
              <Progress value={76} className="h-2" />
                </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Patient Satisfaction</span>
                <span className="font-semibold">94%</span>
                </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
