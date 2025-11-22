"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, Clock, TrendingUp, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface AttendanceStats {
  total_staff: number
  present: number
  absent: number
  on_leave: number
  attendance_percentage: number
  average_working_hours: number
}

interface AttendanceDashboardStatsProps {
  stats: AttendanceStats
  loading?: boolean
  date?: string
  dateRange?: { from: string, to: string }
}

export function AttendanceDashboardStats({ 
  stats, 
  loading = false,
  date,
  dateRange
}: AttendanceDashboardStatsProps) {
  const statCards = [
    {
      title: "Total Staff",
      value: stats.total_staff,
      icon: Users,
      description: "Active employees",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      borderColor: "border-t-blue-500",
    },
    {
      title: "Present",
      value: stats.present,
      icon: UserCheck,
      description: `${stats.attendance_percentage.toFixed(1)}% attendance`,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      borderColor: "border-t-emerald-500",
      trend: stats.attendance_percentage >= 80 ? "up" : "down"
    },
    {
      title: "Absent",
      value: stats.absent,
      icon: UserX,
      description: `${stats.total_staff > 0 ? ((stats.absent / stats.total_staff) * 100).toFixed(1) : 0}% of staff`,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-100",
      borderColor: "border-t-rose-500",
    },
    {
      title: "On Leave",
      value: stats.on_leave,
      icon: Calendar,
      description: "Sick, Casual, Paid",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
      borderColor: "border-t-amber-500",
    },
    {
      title: "Avg. Working Hours",
      value: stats.average_working_hours.toFixed(1),
      icon: Clock,
      description: "Hours per employee",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
      borderColor: "border-t-purple-500",
      suffix: "hrs"
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(date || dateRange) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span suppressHydrationWarning>
            {dateRange 
              ? `Showing stats for: ${new Date(dateRange.from).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} - ${new Date(dateRange.to).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}`
              : `Showing stats for: ${new Date(date!).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`
            }
          </span>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className={cn(
                "rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                "border-t-4",
                stat.borderColor
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", stat.iconBg)}>
                  <Icon className={cn("h-5 w-5", stat.iconColor)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-bold text-gray-800">
                    {stat.value}
                  </div>
                  {stat.suffix && (
                    <span className="text-sm text-gray-500">{stat.suffix}</span>
                  )}
                  {stat.trend && (
                    <TrendingUp className={cn(
                      "h-4 w-4 ml-auto",
                      stat.trend === "up" ? "text-green-600" : "text-red-600 rotate-180"
                    )} />
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
