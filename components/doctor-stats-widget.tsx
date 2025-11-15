"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  ArrowRightLeft,
} from "lucide-react"

interface DoctorStatsWidgetProps {
  stats: {
    total: number
    scheduled: number
    completed: number
    cancelled: number
    noShow: number
    reassigned: number
  }
}

export function DoctorStatsWidget({ stats }: DoctorStatsWidgetProps) {
  const statItems = [
    {
      label: "Total",
      value: stats.total,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Scheduled",
      value: stats.scheduled,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "No Show",
      value: stats.noShow,
      icon: UserX,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      label: "Reassigned",
      value: stats.reassigned,
      icon: ArrowRightLeft,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bgColor}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
