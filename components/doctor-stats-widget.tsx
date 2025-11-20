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
      borderColor: "border-blue-100",
    },
    {
      label: "Scheduled",
      value: stats.scheduled,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-100",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
    },
    {
      label: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-100",
    },
    {
      label: "No Show",
      value: stats.noShow,
      icon: UserX,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-100",
    },
    {
      label: "Reassigned",
      value: stats.reassigned,
      icon: ArrowRightLeft,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card
            key={item.label}
            className={`rounded-xl border ${item.borderColor} ${item.bgColor} shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {item.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bgColor} ${item.borderColor} border`}>
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
