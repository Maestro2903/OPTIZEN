"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, UserCheck, X } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

const reassignSchema = z.object({
  new_provider_id: z.string().min(1, "Please select a doctor"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
})

interface AppointmentReassignDialogProps {
  appointment: {
    id: string
    patient_name: string
    patient_code: string
    appointment_date: string
    start_time: string
    end_time: string
    provider_name: string
    type: string
    status: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface AvailableDoctor {
  id: string
  full_name: string
  role: string
  department: string | null
  available: boolean
  conflicts: any[] | null
}

export function AppointmentReassignDialog({
  appointment,
  open,
  onOpenChange,
  onSuccess,
}: AppointmentReassignDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [availableDoctors, setAvailableDoctors] = React.useState<AvailableDoctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = React.useState<AvailableDoctor | null>(null)

  const form = useForm<z.infer<typeof reassignSchema>>({
    resolver: zodResolver(reassignSchema),
    defaultValues: {
      new_provider_id: "",
      reason: "",
      notes: "",
    },
  })

  // Load available doctors when dialog opens
  React.useEffect(() => {
    if (!open) {
      form.reset()
      setAvailableDoctors([])
      setSelectedDoctor(null)
      return
    }

    const loadAvailableDoctors = async () => {
      setChecking(true)
      try {
        const params = new URLSearchParams({
          date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
        })

        const response = await fetch(`/api/doctors/available?${params.toString()}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load available doctors')
        }

        // Combine available and busy doctors
        const allDoctors = [
          ...(result.data.available || []),
          ...(result.data.busy || []),
        ]
        
        setAvailableDoctors(allDoctors)
      } catch (error) {
        console.error('Error loading doctors:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load available doctors"
        })
      } finally {
        setChecking(false)
      }
    }

    loadAvailableDoctors()
  }, [open, appointment, toast, form])

  // Update selected doctor when provider changes
  const watchProvider = form.watch('new_provider_id')
  React.useEffect(() => {
    if (watchProvider) {
      const doctor = availableDoctors.find(d => d.id === watchProvider)
      setSelectedDoctor(doctor || null)
    } else {
      setSelectedDoctor(null)
    }
  }, [watchProvider, availableDoctors])

  async function onSubmit(values: z.infer<typeof reassignSchema>) {
    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict error
          toast({
            variant: "destructive",
            title: "Scheduling Conflict",
            description: result.error || "Selected doctor has conflicting appointments"
          })
          return
        }
        throw new Error(result.error || 'Failed to reassign appointment')
      }

      toast({
        title: "Success",
        description: result.message || "Appointment reassigned successfully"
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error reassigning appointment:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reassign appointment"
      })
    } finally {
      setLoading(false)
    }
  }

  // Transform doctors to searchable select options
  const doctorOptions: SearchableSelectOption[] = availableDoctors.map(doctor => ({
    value: doctor.id,
    label: `${doctor.full_name} - ${doctor.role}${!doctor.available ? ' (Busy)' : ''}`,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reassign Appointment</DialogTitle>
          <DialogDescription>
            Transfer this appointment to another available doctor
          </DialogDescription>
        </DialogHeader>

        {/* Current Appointment Info */}
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Assignment</span>
            <Badge variant="secondary">{appointment.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Patient:</span>
              <p className="font-medium">{appointment.patient_name}</p>
              <p className="text-xs text-muted-foreground">{appointment.patient_code}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Current Doctor:</span>
              <p className="font-medium">{appointment.provider_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date & Time:</span>
              <p className="font-medium">
                {format(new Date(appointment.appointment_date), 'PPP')}
              </p>
              <p className="text-xs text-muted-foreground">
                {appointment.start_time} - {appointment.end_time}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium capitalize">{appointment.type}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* New Doctor Selection */}
            <FormField
              control={form.control}
              name="new_provider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Doctor *</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={doctorOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={checking ? "Loading doctors..." : "Search and select doctor"}
                      disabled={checking || loading}
                      searchPlaceholder="Search by name..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conflict Warning */}
            {selectedDoctor && !selectedDoctor.available && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900">
                    Scheduling Conflict
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    This doctor has {selectedDoctor.conflicts?.length || 0} conflicting appointment(s) at this time.
                    Please verify availability before reassigning.
                  </p>
                </div>
              </div>
            )}

            {/* Available Confirmation */}
            {selectedDoctor && selectedDoctor.available && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Doctor Available
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {selectedDoctor.full_name} is available at this time slot.
                  </p>
                </div>
              </div>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Reassignment *</FormLabel>
                  <Combobox value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <ComboboxTrigger>
                        <ComboboxValue placeholder="Select reason" />
                      </ComboboxTrigger>
                    </FormControl>
                    <ComboboxContent>
                      <ComboboxItem value="Emergency">Emergency</ComboboxItem>
                      <ComboboxItem value="Doctor on Leave">Doctor on Leave</ComboboxItem>
                      <ComboboxItem value="Specialist Required">Specialist Required</ComboboxItem>
                      <ComboboxItem value="Patient Request">Patient Request</ComboboxItem>
                      <ComboboxItem value="Schedule Conflict">Schedule Conflict</ComboboxItem>
                      <ComboboxItem value="Other">Other</ComboboxItem>
                    </ComboboxContent>
                  </Combobox>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || checking}>
                {loading ? "Reassigning..." : "Reassign Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
