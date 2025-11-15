"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { DuplicatePatientDetector } from "@/components/duplicate-patient-detector"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { countries, getStatesForCountry } from "@/lib/utils/countries"
import type { Patient } from "@/lib/services/api"

const patientFormSchema = z.object({
  patient_id: z.string().optional(), // Added for display purposes
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
})

type PatientFormValues = z.infer<typeof patientFormSchema>

interface PatientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: Patient | null
  onSubmit: (values: PatientFormValues) => Promise<void>
  loading?: boolean
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSubmit,
  loading = false
}: PatientFormDialogProps) {
  const [showDuplicateDialog, setShowDuplicateDialog] = React.useState(false)
  const [pendingFormData, setPendingFormData] = React.useState<PatientFormValues | null>(null)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      patient_id: "",
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
    },
  })

  // Watch country to update states
  const selectedCountry = form.watch("country")

  // Generate patient ID when creating new patient
  const generatePatientId = React.useCallback(() => {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `PAT-${dateStr}-${randomStr}`
  }, [])

  // Reset form when dialog opens/closes or patient changes
  React.useEffect(() => {
    if (open) {
      if (patient) {
        // Editing existing patient
        form.reset({
          patient_id: patient.patient_id || "",
          full_name: patient.full_name || "",
          date_of_birth: patient.date_of_birth || "",
          email: patient.email || "",
          mobile: patient.mobile || "",
          gender: patient.gender || "male",
          country: patient.country || "India",
          state: patient.state || "",
          address: patient.address || "",
          city: patient.city || "",
          postal_code: patient.postal_code || "",
          emergency_contact: patient.emergency_contact || "",
          emergency_phone: patient.emergency_phone || "",
          medical_history: patient.medical_history || "",
          current_medications: patient.current_medications || "",
          allergies: patient.allergies || "",
          insurance_provider: patient.insurance_provider || "",
          insurance_number: patient.insurance_number || "",
        })
      } else {
        // New patient - generate patient ID
        const newPatientId = generatePatientId()
        form.reset({
          patient_id: newPatientId,
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
        })
      }
    }
  }, [open, patient, form, generatePatientId])

  const handleFormSubmit = async (values: PatientFormValues) => {
    // If editing existing patient, skip duplicate check
    if (patient) {
      await onSubmit(values)
      return
    }

    // For new patients, check for duplicates
    setPendingFormData(values)
    setShowDuplicateDialog(true)
  }

  const handleSelectExistingPatient = (existingPatient: Patient) => {
    // Close both dialogs
    setShowDuplicateDialog(false)
    onOpenChange(false)
    setPendingFormData(null)
    
    // You could emit an event or callback here to handle the existing patient
    // For now, we'll just show a message
    console.log("Selected existing patient:", existingPatient)
  }

  const handleConfirmNewPatient = async () => {
    if (pendingFormData) {
      await onSubmit(pendingFormData)
      setPendingFormData(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {patient ? "Edit Patient" : "Add New Patient"}
            </DialogTitle>
            <DialogDescription>
              {patient
                ? "Update patient information below"
                : "Enter patient details to create a new record"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient ID Field */}
                  <FormField
                    control={form.control}
                    name="patient_id"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Patient ID</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input 
                              {...field} 
                              readOnly 
                              className="font-mono font-bold text-primary bg-primary/5 border-primary/20"
                            />
                          </FormControl>
                          {!patient && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newId = generatePatientId()
                                form.setValue("patient_id", newId)
                              }}
                            >
                              Regenerate
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Mobile Number *</FormLabel>
                        <FormControl>
                          <PhoneNumberInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
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
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={countries}
                          placeholder="Select country"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={getStatesForCountry(selectedCountry)}
                          placeholder="Select state"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
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
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter postal code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter full address"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact name" {...field} />
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
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <PhoneNumberInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Medical Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="medical_history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter medical history"
                            className="resize-none"
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
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter current medications"
                            className="resize-none"
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
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter known allergies"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Insurance Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Insurance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="insurance_provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="Insurance provider name" {...field} />
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
                        <FormLabel>Insurance Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Insurance policy number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : patient ? "Update Patient" : "Create Patient"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Detection Dialog */}
      {pendingFormData && (
        <DuplicatePatientDetector
          mobile={pendingFormData.mobile}
          fullName={pendingFormData.full_name}
          onSelectExisting={handleSelectExistingPatient}
          onConfirmNew={handleConfirmNewPatient}
          isOpen={showDuplicateDialog}
          onOpenChange={setShowDuplicateDialog}
        />
      )}
    </>
  )
}
