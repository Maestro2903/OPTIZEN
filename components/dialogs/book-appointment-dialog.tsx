"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogOverlay,
  DialogTrigger,
} from "@/components/ui/dialog"
import { X, Loader2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { countries, getStatesForCountry } from "@/lib/utils/countries"

const bookAppointmentSchema = z.object({
  // Patient information
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  date_of_birth: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().min(10, "Mobile number is required"),
  gender: z.enum(["male", "female", "other"]),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
  // Appointment information
  appointment_date: z.string().min(1, "Appointment date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  type: z.enum(["consult", "follow-up", "surgery", "refraction", "other"]),
  provider_id: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const startMatch = data.start_time.match(/^(\d{1,2}):(\d{2})$/);
    if (!startMatch) return false;
    const [, startHoursStr, startMinutesStr] = startMatch;
    const startHours = Number(startHoursStr);
    const startMinutes = Number(startMinutesStr);
    if (startHours < 0 || startHours > 23 || startMinutes < 0 || startMinutes > 59) return false;

    const endMatch = data.end_time.match(/^(\d{1,2}):(\d{2})$/);
    if (!endMatch) return false;
    const [, endHoursStr, endMinutesStr] = endMatch;
    const endHours = Number(endHoursStr);
    const endMinutes = Number(endMinutesStr);
    if (endHours < 0 || endHours > 23 || endMinutes < 0 || endMinutes > 59) return false;

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes > startTotalMinutes;
  },
  {
    message: "End time must be after start time",
    path: ["end_time"],
  }
);

type BookAppointmentFormValues = z.infer<typeof bookAppointmentSchema>

interface BookAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BookAppointmentFormValues) => Promise<void>
  loading?: boolean
  children?: React.ReactNode
}

const PremiumLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </FormLabel>
)

export function BookAppointmentDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  children
}: BookAppointmentDialogProps) {
  const [doctors, setDoctors] = React.useState<Array<{ id: string; name: string }>>([])
  const [loadingDoctors, setLoadingDoctors] = React.useState(false)

  const form = useForm<BookAppointmentFormValues>({
    resolver: zodResolver(bookAppointmentSchema),
    defaultValues: {
      full_name: "",
      date_of_birth: "",
      email: "",
      mobile: "",
      gender: "male",
      country: "India",
      state: "",
      address: "",
      city: "",
      postal_code: "",
      emergency_contact: "",
      emergency_phone: "",
      medical_history: "",
      current_medications: "",
      allergies: "",
      insurance_provider: "",
      insurance_number: "",
      appointment_date: "",
      start_time: "",
      end_time: "",
      type: "consult",
      provider_id: "none",
      reason: "",
      notes: "",
    },
  })

  // Watch country to update states
  const selectedCountry = form.watch("country")

  // Load doctors
  React.useEffect(() => {
    if (open) {
      const loadDoctors = async () => {
        setLoadingDoctors(true)
        try {
          const response = await fetch('/api/employees?limit=100&status=active')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              setDoctors(
                data.data
                  .filter((emp: any) => 
                    ['optometrist', 'ophthalmologist', 'doctor'].includes(emp.role?.toLowerCase())
                  )
                  .map((emp: any) => ({
                    id: emp.id,
                    name: `${emp.full_name} - ${emp.role}`,
                  }))
              )
            }
          }
        } catch (error) {
          console.error("Error loading doctors:", error)
        } finally {
          setLoadingDoctors(false)
        }
      }
      loadDoctors()
    }
  }, [open])

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        full_name: "",
        date_of_birth: "",
        email: "",
        mobile: "",
        gender: "male",
        country: "India",
        state: "",
        address: "",
        city: "",
        postal_code: "",
        emergency_contact: "",
        emergency_phone: "",
        medical_history: "",
        current_medications: "",
        allergies: "",
        insurance_provider: "",
        insurance_number: "",
        appointment_date: "",
        start_time: "",
        end_time: "",
        type: "consult",
        provider_id: "",
        reason: "",
        notes: "",
      })
    }
  }, [open, form])

  const handleFormSubmit = async (values: BookAppointmentFormValues) => {
    // Convert "none" to empty string for provider_id
    const submitValues = {
      ...values,
      provider_id: values.provider_id === "none" ? "" : values.provider_id,
    }
    await onSubmit(submitValues)
  }

  const availableStates = React.useMemo(() => {
    if (!selectedCountry) return []
    return getStatesForCountry(selectedCountry)
  }, [selectedCountry])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogOverlay className="bg-gray-900/50 backdrop-blur-sm" />
      <DialogContent
        className="w-full max-w-[900px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        hideCloseButton={true}
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            className="absolute right-4 top-4 w-8 h-8 rounded p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogClose>

        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Book Appointment
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Enter patient and appointment details to create a booking request
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Patient Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Patient Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel required>Full Name</PremiumLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full name" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth & Gender */}
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Date of Birth</PremiumLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel required>Gender</PremiumLabel>
                      <Combobox value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <ComboboxTrigger className="h-11 border-gray-200 rounded-lg">
                            <ComboboxValue placeholder="Select gender" />
                          </ComboboxTrigger>
                        </FormControl>
                        <ComboboxContent>
                          <ComboboxItem value="male">Male</ComboboxItem>
                          <ComboboxItem value="female">Female</ComboboxItem>
                          <ComboboxItem value="other">Other</ComboboxItem>
                        </ComboboxContent>
                      </Combobox>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email & Mobile */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Email</PremiumLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="email@example.com" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel required>Mobile Number</PremiumLabel>
                      <FormControl>
                        <PhoneNumberInput
                          value={field.value}
                          onChange={field.onChange}
                          defaultCountry="IN"
                          className="h-11 border-gray-200 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country & State */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel required>Country</PremiumLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={countries}
                          placeholder="Select country"
                          className="h-11 border-gray-200 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel required>State</PremiumLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={availableStates}
                          placeholder="Select state"
                          className="h-11 border-gray-200 rounded-lg"
                          disabled={!selectedCountry || availableStates.length === 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Address</PremiumLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter full address" 
                          rows={2}
                          className="border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City & Postal Code */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>City</PremiumLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter city" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Postal Code</PremiumLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter postal code" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Emergency Contact */}
                <FormField
                  control={form.control}
                  name="emergency_contact"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Emergency Contact Name</PremiumLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contact name" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergency_phone"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Emergency Contact Phone</PremiumLabel>
                      <FormControl>
                        <PhoneNumberInput
                          value={field.value}
                          onChange={field.onChange}
                          defaultCountry="IN"
                          className="h-11 border-gray-200 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Medical Information */}
                <FormField
                  control={form.control}
                  name="medical_history"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Medical History</PremiumLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter medical history" 
                          rows={3}
                          className="border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_medications"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Current Medications</PremiumLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter current medications" 
                          rows={2}
                          className="border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Allergies</PremiumLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter known allergies" 
                          rows={2}
                          className="border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Insurance Information */}
                <FormField
                  control={form.control}
                  name="insurance_provider"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Insurance Provider</PremiumLabel>
                      <FormControl>
                        <Input 
                          placeholder="Insurance provider name" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insurance_number"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Insurance Number</PremiumLabel>
                      <FormControl>
                        <Input 
                          placeholder="Insurance policy number" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Appointment Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Appointment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Appointment Date & Type */}
                <FormField
                  control={form.control}
                  name="appointment_date"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel required>Appointment Date</PremiumLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]}
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel required>Appointment Type</PremiumLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-gray-200 rounded-lg">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consult">Consultation</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="refraction">Refraction</SelectItem>
                          <SelectItem value="surgery">Surgery</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Time & End Time */}
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel required>Start Time</PremiumLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
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
                    <FormItem>
                      <PremiumLabel required>End Time</PremiumLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="h-11 border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Provider */}
                <FormField
                  control={form.control}
                  name="provider_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Preferred Doctor</PremiumLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || "none"} 
                        disabled={loadingDoctors}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 border-gray-200 rounded-lg">
                            <SelectValue placeholder={loadingDoctors ? "Loading doctors..." : "Select a doctor (optional)"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Any Available Doctor</SelectItem>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reason & Notes */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Reason for Visit</PremiumLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the concern..." 
                          rows={3}
                          className="border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Additional Notes</PremiumLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information..." 
                          rows={2}
                          className="border-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Booking Request"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

