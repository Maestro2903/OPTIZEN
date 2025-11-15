"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, ClockIcon, UserIcon, MapPinIcon, FileTextIcon } from "lucide-react"

interface AppointmentViewDialogProps {
  appointment: {
    id: string
    patient_name?: string
    patient_id: string // This should be the readable patient_id (e.g., "PAT-20251110-UCR50T"), not UUID
    provider_name?: string
    appointment_date: string
    start_time: string
    end_time: string
    type: string
    status: string
    room?: string
    notes?: string
    created_at: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "checked-in": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "in-progress": "bg-orange-100 text-orange-700 border-orange-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-gray-100 text-gray-700 border-gray-200",
}

const typeColors: Record<string, string> = {
  consult: "bg-blue-50 text-blue-700 border-blue-200",
  "follow-up": "bg-green-50 text-green-700 border-green-200",
  surgery: "bg-red-50 text-red-700 border-red-200",
  refraction: "bg-purple-50 text-purple-700 border-purple-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
}

export function AppointmentViewDialog({
  appointment,
  open,
  onOpenChange,
}: AppointmentViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Appointment Details</DialogTitle>
          <DialogDescription>
            Complete information about this appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Type Badges */}
          <div className="flex items-center gap-2">
            <Badge className={`capitalize ${statusColors[appointment.status] || ''}`}>
              {appointment.status}
            </Badge>
            <Badge variant="outline" className={`capitalize ${typeColors[appointment.type] || ''}`}>
              {appointment.type}
            </Badge>
          </div>

          <Separator />

          {/* Patient Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Patient Information
            </h3>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{appointment.patient_name || 'Unknown Patient'}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Patient ID: {appointment.patient_id}
            </div>
          </div>

          <Separator />

          {/* Doctor/Provider Information */}
          {appointment.provider_name && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Provider
                </h3>
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{appointment.provider_name}</span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Appointment Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Date
              </h3>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Time
              </h3>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.start_time} - {appointment.end_time}</span>
              </div>
            </div>
          </div>

          {/* Room */}
          {appointment.room && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Room
                </h3>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.room}</span>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Notes
                </h3>
                <div className="flex gap-2">
                  <FileTextIcon className="h-4 w-4 text-muted-foreground mt-1" />
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            Created: {new Date(appointment.created_at).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
