"use client"

import * as React from "react"
import { Check, Wrench, User, Clock, Calendar, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BedCardProps {
  bed: {
    id: string
    bed_number: string
    ward_name: string
    ward_type: string
    status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning'
    floor_number: number
  }
  assignment?: {
    patient_name: string
    patient_age: number
    admission_date: string
    days_in_ward: number
    surgery_scheduled_time?: string
    doctor_name?: string
  }
  onClick?: () => void
}

export function BedCard({ bed, assignment, onClick }: BedCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-green-50 hover:bg-green-100 border-green-200',
          icon: Check,
          iconColor: 'text-green-600',
          label: 'Available',
          labelColor: 'text-green-700'
        }
      case 'occupied':
        return {
          bg: 'bg-red-50 hover:bg-red-100 border-red-200',
          icon: User,
          iconColor: 'text-red-600',
          label: 'Occupied',
          labelColor: 'text-red-700'
        }
      case 'maintenance':
      case 'cleaning':
        return {
          bg: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
          icon: Wrench,
          iconColor: 'text-gray-600',
          label: 'Maintenance',
          labelColor: 'text-gray-700'
        }
      case 'reserved':
        return {
          bg: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
          label: 'Reserved',
          labelColor: 'text-yellow-700'
        }
      default:
        return {
          bg: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
          icon: AlertCircle,
          iconColor: 'text-gray-600',
          label: status,
          labelColor: 'text-gray-700'
        }
    }
  }

  const config = getStatusConfig(bed.status)
  const Icon = config.icon

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  return (
    <div
      className={cn(
        "relative p-4 rounded-lg border-2 transition-all cursor-pointer min-h-[140px] flex flex-col justify-between",
        config.bg,
        onClick && "hover:shadow-md"
      )}
      onClick={onClick}
    >
      {/* Bed Number */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {bed.bed_number}
          </div>
          <div className="text-xs text-muted-foreground capitalize">
            {bed.ward_name}
          </div>
        </div>
        <Icon className={cn("h-5 w-5", config.iconColor)} />
      </div>

      {/* Content based on status */}
      <div className="flex-1">
        {bed.status === 'occupied' && assignment ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold text-sm truncate">
                {assignment.patient_name}
              </span>
              <span className="text-xs text-muted-foreground">({assignment.patient_age}y)</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{assignment.days_in_ward} {assignment.days_in_ward === 1 ? 'day' : 'days'}</span>
            </div>
            {assignment.surgery_scheduled_time && (
              <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
                <Clock className="h-3 w-3" />
                <span>Surgery: {formatTime(assignment.surgery_scheduled_time)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className={cn("text-sm font-medium", config.labelColor)}>
              {config.label}
            </span>
          </div>
        )}
      </div>

      {/* Floor indicator */}
      <div className="absolute top-2 right-2">
        <Badge variant="outline" className="text-xs">
          F{bed.floor_number}
        </Badge>
      </div>
    </div>
  )
}

