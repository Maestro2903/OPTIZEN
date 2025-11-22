"use client"

import * as React from "react"
import { Bed as BedIcon, User, Circle, CircleDot, Wrench, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface BedCardProps {
  bed: {
    id: string
    bed_number: string
    ward_name: string
    ward_type: string
    status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning'
    floor_number: number
    daily_rate: number
  }
  assignment?: {
    patient_name?: string
    patient_mrn?: string
    patient_age?: number
    admission_date?: string
    days_in_ward?: number
    surgery_scheduled_time?: string
    doctor_name?: string
    patient_gender?: string
  } | null
  onClickAction?: () => void
}

export function BedCard({ bed, assignment, onClickAction }: BedCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available',
          badge: 'bg-emerald-100 text-emerald-700',
          accent: 'text-emerald-600'
        }
      case 'occupied':
        return {
          label: 'Occupied',
          badge: 'bg-red-100 text-red-700',
          accent: 'text-red-600'
        }
      case 'reserved':
        return {
          label: 'Reserved',
          badge: 'bg-amber-100 text-amber-700',
          accent: 'text-amber-600'
        }
      case 'maintenance':
        return {
          label: 'Maintenance',
          badge: 'bg-slate-200 text-slate-700 border border-dashed border-slate-300',
          accent: 'text-slate-600'
        }
      case 'cleaning':
        return {
          label: 'Cleaning',
          badge: 'bg-sky-100 text-sky-700 border border-dashed border-sky-200',
          accent: 'text-sky-600'
        }
      default:
        return {
          label: status,
          badge: 'bg-gray-200 text-gray-700',
          accent: 'text-gray-600'
        }
    }
  }

  const isOutOfService = bed.status === 'maintenance' || bed.status === 'cleaning'
  const config = getStatusConfig(bed.status)
  const StatusIcon = bed.status === 'maintenance' ? Wrench : bed.status === 'cleaning' ? Sparkles : BedIcon

  const getGenderIcon = (gender?: string | null) => {
    if (!gender) return null
    const normalized = gender.toLowerCase()
    // Using CircleDot for male (Mars symbol alternative) and Circle for female (Venus symbol alternative)
    if (normalized.startsWith('m')) return CircleDot
    if (normalized.startsWith('f')) return Circle
    return null
  }

  const GenderIcon = getGenderIcon(assignment?.patient_gender)
  const getWardGender = (wardName?: string | null) => {
    if (!wardName) return null
    const normalized = wardName.toLowerCase()
    if (/(female|women|ladies|woman)/.test(normalized)) return "Female Ward"
    if (/(male|men|gents|gentlemen)/.test(normalized)) return "Male Ward"
    return null
  }
  const wardGenderLabel = getWardGender(bed.ward_name)

  return (
    <div
      className={cn(
        "flex min-h-[150px] flex-col rounded-lg border border-gray-200 p-4 shadow-sm transition-all",
        isOutOfService
          ? "border-dashed border-slate-200 bg-[repeating-linear-gradient(135deg,#f8fafc,#f8fafc_10px,#f1f5f9_10px,#f1f5f9_20px)]"
          : "bg-white",
        onClickAction ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : "cursor-default"
      )}
      onClick={onClickAction}
    >
      <div className={cn("mb-3 flex items-start justify-between", isOutOfService && "opacity-75")}>
        <div>
          <div className="text-lg font-bold text-gray-800">{bed.bed_number}</div>
          <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2">
            <span>{bed.ward_name}</span>
            {wardGenderLabel && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {wardGenderLabel}
              </span>
            )}
          </div>
        </div>
        <StatusIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className={cn("flex-1", isOutOfService && "opacity-75 text-slate-700")}>
        {bed.status === 'available' ? (
          <div className={cn("text-sm font-semibold", config.accent)}>
            ₹{bed.daily_rate.toLocaleString()}/day
          </div>
        ) : bed.status === 'occupied' && assignment ? (
          <div className="space-y-1.5">
            {assignment.patient_name || assignment.patient_mrn ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {assignment.patient_name && (
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {assignment.patient_name}
                      </div>
                    )}
                    {assignment.patient_mrn && (
                      <div className="text-xs font-mono text-gray-500 truncate">
                        ID: {assignment.patient_mrn}
                      </div>
                    )}
                  </div>
                </div>
                {GenderIcon && <GenderIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />}
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-600">Patient Assigned</div>
            )}
          </div>
        ) : (
          <div className="text-sm font-medium text-gray-600">{config.label}</div>
        )}
      </div>

      <div className={cn("mt-4 flex items-center justify-between", isOutOfService && "opacity-75")}>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", config.badge)}>
          {isOutOfService && <StatusIcon className="h-3.5 w-3.5" />}
          {config.label}
        </span>
        <span className="text-xs font-medium text-gray-500">Floor {bed.floor_number}</span>
      </div>
    </div>
  )
}

