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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { patientsApi, employeesApi, masterDataApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  provider_id: z.string().min(1, "Doctor is required"),
  appointment_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  type: z.enum(["consult", "follow-up", "surgery", "refraction", "other"]),
  room: z.string().optional(),
  notes: z.string().optional(),
})

interface AppointmentFormProps {
  children?: React.ReactNode
  appointmentData?: any
  mode?: "create" | "edit"
  onSubmit?: (data: any) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AppointmentForm({ 
  children, 
  appointmentData, 
  mode = "create", 
  onSubmit: onSubmitProp,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: AppointmentFormProps) {
  const { toast } = useToast()
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = controlledOnOpenChange || setInternalOpen
  
  // State for searchable dropdowns
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [doctors, setDoctors] = React.useState<SearchableSelectOption[]>([])
  const [rooms, setRooms] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingDoctors, setLoadingDoctors] = React.useState(false)
  const [loadingRooms, setLoadingRooms] = React.useState(false)

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: appointmentData?.patient_id || "",
      provider_id: appointmentData?.provider_id || "",
      appointment_date: appointmentData?.appointment_date || "",
      start_time: appointmentData?.start_time || "",
      end_time: appointmentData?.end_time || "",
      type: appointmentData?.type || "consult",
      room: appointmentData?.room || "",
      notes: appointmentData?.notes || "",
    },
  })

  // Load patients from backend
  React.useEffect(() => {
    const loadPatients = async () => {
      if (!isOpen) return
      setLoadingPatients(true)
      try {
        const response = await patientsApi.list({ limit: 1000, status: 'active' })
        if (response.success && response.data) {
          setPatients(
            response.data.map((patient) => ({
              value: patient.id,
              label: `${patient.full_name} (${patient.patient_id})`,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading patients:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load patients list."
        })
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatients()
  }, [isOpen, toast])

  // Load doctors from employees (all active staff members)
  React.useEffect(() => {
    const controller = new AbortController()

    const loadDoctors = async () => {
      if (!isOpen) return
      setLoadingDoctors(true)
      try {
        // Load all active employees - staff includes all roles
        const response = await employeesApi.list({ limit: 1000, status: 'active' })
        if (response.success && response.data && !controller.signal.aborted) {
          setDoctors(
            response.data.map((employee) => ({
              value: employee.id,
              label: `${employee.full_name} - ${employee.role}`,
            }))
          )
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return
        console.error("Error loading staff:", error)
        if (!controller.signal.aborted) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load staff list."
          })
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDoctors(false)
        }
      }
    }

    loadDoctors()

    return () => {
      controller.abort()
    }
  }, [isOpen, toast])

  // Load room types from master data
  React.useEffect(() => {
    const controller = new AbortController()

    const loadRooms = async () => {
      if (!isOpen) return
      setLoadingRooms(true)
      try {
        const response = await masterDataApi.list({ category: 'room_types', limit: 100 })
        if (response.success && response.data && !controller.signal.aborted) {
          setRooms(
            response.data.map((room) => ({
              value: room.name,
              label: room.name,
            }))
          )
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return
        console.error("Error loading rooms:", error)
        // Non-critical, don't show error toast
      } finally {
        setLoadingRooms(false)
      }
    }

    loadRooms()

    return () => {
      controller.abort()
    }
  }, [isOpen])

  async function onSubmit(values: z.infer<typeof appointmentSchema>) {
    try {
      if (!onSubmitProp) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No submission handler provided."
        })
        return
      }

      console.log('Form submitting with values:', values)
      await onSubmitProp(values)
      
      // Only close dialog and reset form if submission was successful
      setIsOpen(false)

      // Reset form to original values in edit mode, defaults in create mode
      if (mode === "edit" && appointmentData) {
        form.reset({
          patient_id: appointmentData.patient_id || "",
          provider_id: appointmentData.provider_id || "",
          appointment_date: appointmentData.appointment_date || "",
          start_time: appointmentData.start_time || "",
          end_time: appointmentData.end_time || "",
          type: appointmentData.type || "consult",
          room: appointmentData.room || "",
          notes: appointmentData.notes || "",
        })
      } else {
        form.reset()
      }

      // Success toast is shown by the page component's onSuccess callback
    } catch (error: any) {
      console.error("Error submitting appointment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || error?.error || "Failed to save appointment. Please try again."
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Appointment" : "Book New Appointment"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update appointment details" : "Schedule a new appointment for a patient"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={patients}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select patient"
                        searchPlaceholder="Search patients..."
                        loading={loadingPatients}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={doctors}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select doctor"
                        searchPlaceholder="Search doctors..."
                        loading={loadingDoctors}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="appointment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appointment Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consult">Consultation</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="refraction">Refraction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={rooms}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select room"
                        searchPlaceholder="Search rooms..."
                        loading={loadingRooms}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional information..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === "edit" ? "Update Appointment" : "Book Appointment"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

