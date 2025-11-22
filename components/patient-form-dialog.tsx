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
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RotateCw, X, Loader2 } from "lucide-react"
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

// Helper component for premium label styling
const PremiumLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </FormLabel>
)

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
        <DialogOverlay className="bg-gray-900/50 backdrop-blur-sm" />
        <DialogContent
          className="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
          hideCloseButton={true}
        >
          {/* Custom Close Button */}
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

          {/* Header */}
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {patient ? "Edit Patient" : "Add New Patient"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {patient
                ? "Update patient information below"
                : "Enter the details below to register a new patient."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Main Form Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient ID - Full Width */}
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-1">
                        <div className="flex items-center gap-2 px-2 py-1">
                          <FormControl>
                            <Input 
                              {...field} 
                              readOnly 
                              className="font-mono font-medium text-indigo-600 tracking-wider bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                            />
                          </FormControl>
                          {!patient && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-transparent"
                                    onClick={() => {
                                      const newId = generatePatientId()
                                      form.setValue("patient_id", newId)
                                    }}
                                  >
                                    <RotateCw className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Regenerate ID</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Name - Full Width */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel required>Full Name</PremiumLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full name" 
                          className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth & Gender - Split */}
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <PremiumLabel>Date of Birth</PremiumLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all">
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

                {/* Email & Phone - Split */}
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
                          className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country & State - Split */}
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
                          className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          options={getStatesForCountry(selectedCountry)}
                          placeholder="Select state"
                          className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address - Full Width */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <PremiumLabel>Address</PremiumLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter full address"
                          rows={3}
                          className="resize-none border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Address Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <PremiumLabel>City</PremiumLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter city" 
                            className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                        <PremiumLabel>Contact Name</PremiumLabel>
                        <FormControl>
                          <Input 
                            placeholder="Emergency contact name" 
                            className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                        <PremiumLabel>Contact Phone</PremiumLabel>
                        <FormControl>
                          <PhoneNumberInput 
                            className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            {...field} 
                          />
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
                        <PremiumLabel>Medical History</PremiumLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter medical history"
                            className="resize-none border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                        <PremiumLabel>Current Medications</PremiumLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter current medications"
                            className="resize-none border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                        <PremiumLabel>Allergies</PremiumLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter known allergies"
                            className="resize-none border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                        <PremiumLabel>Insurance Provider</PremiumLabel>
                        <FormControl>
                          <Input 
                            placeholder="Insurance provider name" 
                            className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 bg-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {patient ? "Updating..." : "Adding Patient..."}
                    </>
                  ) : (
                    patient ? "Update Patient" : "Add Patient"
                  )}
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
