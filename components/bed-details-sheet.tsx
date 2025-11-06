"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  CreditCard,
  LogOut,
  ArrowRight,
} from "lucide-react"

interface BedDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bedData: {
    bed_number: string
    ward_name: string
    ward_type: string
    floor_number: number
    room_number?: string
    status: string
    daily_rate: number
  } | null
  assignmentData?: {
    patient_name: string
    patient_age: number
    patient_mrn: string
    admission_date: string
    days_in_ward: number
    expected_discharge_date?: string
    surgery_scheduled_time?: string
    surgery_type?: string
    admission_reason: string
    doctor_name?: string
    notes?: string
  } | null
  onDischarge?: () => void
  onTransfer?: () => void
  onUpdate?: () => void
}

export function BedDetailsSheet({
  open,
  onOpenChange,
  bedData,
  assignmentData,
  onDischarge,
  onTransfer,
  onUpdate,
}: BedDetailsSheetProps) {
  if (!bedData) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'occupied':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'maintenance':
      case 'cleaning':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Bed {bedData.bed_number} Details</SheetTitle>
          <SheetDescription>
            {bedData.ward_name} Ward • Floor {bedData.floor_number}
            {bedData.room_number && ` • Room ${bedData.room_number}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Bed Status */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Bed Status</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(bedData.status)}>
                {bedData.status.charAt(0).toUpperCase() + bedData.status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                • ₹{bedData.daily_rate}/day
              </span>
            </div>
          </div>

          <Separator />

          {/* Patient Information */}
          {assignmentData && bedData.status === 'occupied' ? (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{assignmentData.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">MRN:</span>
                    <span className="text-sm font-medium font-mono">{assignmentData.patient_mrn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Age:</span>
                    <span className="text-sm font-medium">{assignmentData.patient_age} years</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Admission Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Admission Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Admission Date:</span>
                    <span className="text-sm font-medium">{formatDate(assignmentData.admission_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Days in Ward:</span>
                    <span className="text-sm font-medium">
                      {assignmentData.days_in_ward} {assignmentData.days_in_ward === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  {assignmentData.expected_discharge_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expected Discharge:</span>
                      <span className="text-sm font-medium">{formatDate(assignmentData.expected_discharge_date)}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Reason:</span>
                    <p className="text-sm font-medium mt-1">{assignmentData.admission_reason}</p>
                  </div>
                </div>
              </div>

              {assignmentData.surgery_scheduled_time && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Surgery Schedule
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span className="text-sm font-medium">{assignmentData.surgery_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Scheduled Time:</span>
                        <span className="text-sm font-medium">{formatDateTime(assignmentData.surgery_scheduled_time)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {assignmentData.doctor_name && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Assigned Doctor
                    </h3>
                    <p className="text-sm font-medium">{assignmentData.doctor_name}</p>
                  </div>
                </>
              )}

              {assignmentData.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </h3>
                    <p className="text-sm text-muted-foreground">{assignmentData.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Billing Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Daily Rate:</span>
                    <span className="text-sm font-medium">₹{bedData.daily_rate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Cost:</span>
                    <span className="text-sm font-bold">
                      ₹{(bedData.daily_rate * assignmentData.days_in_ward).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button variant="outline" className="w-full justify-between" onClick={onUpdate}>
                  Update Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={onTransfer}>
                  Transfer to Another Bed
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="destructive" className="w-full justify-between" onClick={onDischarge}>
                  Discharge Patient
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">This bed is currently {bedData.status}</p>
              {bedData.status === 'available' && (
                <Button className="mt-4" onClick={onUpdate}>
                  Assign Patient
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

