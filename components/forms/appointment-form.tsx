"use client"

import * as React from "react"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
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
import { patientsApi, employeesApi, masterDataApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

// Shared class names for consistent styling
const inputClassName = "h-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 focus:outline-none focus:ring-offset-0 focus-visible:border-gray-600 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none focus-visible:ring-offset-0"
const textareaClassName = "h-auto bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 focus:outline-none focus:ring-offset-0 focus-visible:border-gray-600 focus-visible:ring-2 focus-visible:ring-gray-200 focus-visible:outline-none focus-visible:ring-offset-0"

const appointmentSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  provider_id: z.string().min(1, "Doctor is required"),
  appointment_date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  type: z.enum(["consult", "follow-up", "surgery", "refraction", "other"]),
  room: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Validate start_time format and range
    const startMatch = data.start_time.match(/^(\d{1,2}):(\d{2})$/);
    if (!startMatch) return false;
    const [, startHoursStr, startMinutesStr] = startMatch;
    const startHours = Number(startHoursStr);
    const startMinutes = Number(startMinutesStr);

    // Validate hour and minute ranges for start time
    if (startHours < 0 || startHours > 23 || startMinutes < 0 || startMinutes > 59) return false;

    // Validate end_time format and range
    const endMatch = data.end_time.match(/^(\d{1,2}):(\d{2})$/);
    if (!endMatch) return false;
    const [, endHoursStr, endMinutesStr] = endMatch;
    const endHours = Number(endHoursStr);
    const endMinutes = Number(endMinutesStr);

    // Validate hour and minute ranges for end time
    if (endHours < 0 || endHours > 23 || endMinutes < 0 || endMinutes > 59) return false;

    // Convert to total minutes since midnight for comparison
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    // Check if end time is after start time
    return endTotalMinutes > startTotalMinutes;
  },
  {
    message: "End time must be after start time",
    path: ["end_time"], // Attach error to the end_time field
  }
);

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

  // Helper function to format date for date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return ""
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
      }
      // Otherwise, parse and format
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return ""
    }
  }

  // Reset form when dialog opens in edit mode or when appointmentData changes
  React.useEffect(() => {
    if (isOpen && appointmentData) {
      form.reset({
        patient_id: appointmentData.patient_id || "",
        provider_id: appointmentData.provider_id || "",
        appointment_date: formatDateForInput(appointmentData.appointment_date),
        start_time: appointmentData.start_time || "",
        end_time: appointmentData.end_time || "",
        type: appointmentData.type || "consult",
        room: appointmentData.room || "",
        notes: appointmentData.notes || "",
      })
    } else if (isOpen && mode === "create") {
      // Reset to defaults for create mode
      form.reset({
        patient_id: "",
        provider_id: "",
        appointment_date: "",
        start_time: "",
        end_time: "",
        type: "consult",
        room: "",
        notes: "",
      })
    }
  }, [isOpen, appointmentData, mode, form])

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
      <DialogOverlay className="bg-gray-900/50 backdrop-blur-sm" />
      <DialogContent
        className="max-w-2xl rounded-2xl bg-white shadow-2xl"
        onCloseButtonClickOnly={true}
      >
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {mode === "edit" ? "Edit Appointment" : "Book Appointment"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {mode === "edit" ? "Update appointment details" : "Schedule a new consultation or procedure."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1: People */}
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Patient *
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={patients}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select patient"
                        searchPlaceholder="Search patients..."
                        loading={loadingPatients}
                        className={inputClassName}
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
                    <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Doctor *
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={doctors}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select doctor"
                        searchPlaceholder="Search doctors..."
                        loading={loadingDoctors}
                        className={inputClassName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 2: Timing */}
              <FormField
                control={form.control}
                name="appointment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Appointment Date *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className={inputClassName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <fieldset className="space-y-2">
                <legend className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Time Slot *
                </legend>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">Start Time *</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            aria-label="Start time"
                            className={inputClassName}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="sr-only">End Time *</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            aria-label="End time"
                            className={inputClassName}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>

              {/* Row 3: Details */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Appointment Type *
                    </FormLabel>
                    <Combobox value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <ComboboxTrigger className={inputClassName}>
                          <ComboboxValue placeholder="Select type" />
                        </ComboboxTrigger>
                      </FormControl>
                      <ComboboxContent>
                        <ComboboxItem value="consult">Consultation</ComboboxItem>
                        <ComboboxItem value="follow-up">Follow-up</ComboboxItem>
                        <ComboboxItem value="surgery">Surgery</ComboboxItem>
                        <ComboboxItem value="refraction">Refraction</ComboboxItem>
                        <ComboboxItem value="other">Other</ComboboxItem>
                      </ComboboxContent>
                    </Combobox>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Room
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={rooms}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select room"
                        searchPlaceholder="Search rooms..."
                        loading={loadingRooms}
                        className={inputClassName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 4: Notes (Full Width) */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional information..."
                        rows={3}
                        {...field}
                        className={textareaClassName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
              <Button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="px-6 py-2.5 rounded-lg shadow-md font-medium transition-colors bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                {mode === "edit" ? "Update Appointment" : "Book Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

