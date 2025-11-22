"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Eye,
  ArrowRightLeft,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react"

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "checked-in": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "in-progress": "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-gray-100 text-gray-700 border-gray-200",
}

const typeColors = {
  consult: "bg-blue-50 text-blue-700",
  "follow-up": "bg-green-50 text-green-700",
  surgery: "bg-red-50 text-red-700",
  refraction: "bg-purple-50 text-purple-700",
  other: "bg-gray-50 text-gray-700",
}

interface DoctorAppointmentCardProps {
  appointment: {
    id: string
    patient_name: string
    patient_code: string
    patient_mobile: string
    start_time: string
    end_time: string
    type: string
    status: string
    room: string | null
    is_reassigned: boolean
    original_provider_name: string | null
    reassignment_reason: string | null
    duration_minutes: number
  }
  onView: (appointment: any) => void
  onReassign: (appointment: any) => void
}

export function DoctorAppointmentCard({
  appointment,
  onView,
  onReassign,
}: DoctorAppointmentCardProps) {
  const canReassign = !['completed', 'cancelled', 'no-show'].includes(appointment.status)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {/* Header with Patient Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{appointment.patient_name}</h3>
                  {appointment.is_reassigned && (
                    <Badge variant="outline" className="text-xs">
                      Reassigned
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{appointment.patient_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={statusColors[appointment.status as keyof typeof statusColors]}>
                  {appointment.status.replace(/-/g, ' ')}
                </Badge>
                <Badge variant="secondary" className={typeColors[appointment.type as keyof typeof typeColors]}>
                  {appointment.type}
                </Badge>
              </div>
            </div>

            {/* Time and Duration */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{appointment.start_time}</span>
                <span className="text-muted-foreground">-</span>
                <span className="font-medium">{appointment.end_time}</span>
              </div>
              <span className="text-muted-foreground">
                ({appointment.duration_minutes} min)
              </span>
              {appointment.room && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.room}</span>
                </div>
              )}
            </div>

            {/* Contact Info */}
            {appointment.patient_mobile && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{appointment.patient_mobile}</span>
              </div>
            )}

            {/* Reassignment Info */}
            {appointment.is_reassigned && appointment.original_provider_name && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-medium">Originally assigned to: {appointment.original_provider_name}</p>
                  {appointment.reassignment_reason && (
                    <p className="text-amber-700 mt-0.5">Reason: {appointment.reassignment_reason}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onView(appointment)}
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            {canReassign && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onReassign(appointment)}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Reassign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
