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
import { RotateCw, X, Loader2, Edit } from "lucide-react"
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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { countries, getStatesForCountry } from "@/lib/utils/countries"
import type { Patient } from "@/lib/services/api"

const patientFormSchema = z.object({
  patient_id: z.string().optional(),
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

interface PatientDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
  onSubmit: (values: PatientFormValues) => Promise<void>
  loading?: boolean
  defaultEdit?: boolean // If true, opens in edit mode
}

// Helper component for premium label styling
const PremiumLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <FormLabel className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </FormLabel>
)

// Reusable DetailItem component for read-only view
const DetailItem = ({ label, value, className = "" }: { label: string; value: string | React.ReactNode; className?: string }) => (
  <div className={`p-3 bg-slate-50 rounded-lg border border-slate-100 ${className}`}>
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-1">{value || "--"}</p>
  </div>
)

// Helper function to calculate age
const calculateAge = (dateOfBirth: string | undefined): number | null => {
  if (!dateOfBirth) return null
  const today = new Date()
  const birth = new Date(dateOfBirth)
  if (isNaN(birth.getTime())) return null
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

export function PatientDetailModal({
  open,
  onOpenChange,
  patient,
  onSubmit,
  loading = false,
  defaultEdit = false
}: PatientDetailModalProps) {
  const [isEditing, setIsEditing] = React.useState(defaultEdit)

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

  // Reset form and editing state when dialog opens/closes or patient changes
  React.useEffect(() => {
    if (open && patient) {
      setIsEditing(defaultEdit)
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
    } else if (!open) {
      setIsEditing(defaultEdit)
    }
  }, [open, patient, form, defaultEdit])

  const handleFormSubmit = async (values: PatientFormValues) => {
    await onSubmit(values)
    // If opened directly in edit mode, close the modal after successful update
    // Otherwise, switch back to view mode
    if (defaultEdit) {
      onOpenChange(false)
    } else {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (patient) {
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
    }
    // If opened directly in edit mode, close the modal on cancel
    // Otherwise, switch back to view mode
    if (defaultEdit) {
      onOpenChange(false)
    } else {
      setIsEditing(false)
    }
  }

  if (!patient) return null

  const age = calculateAge(patient.date_of_birth)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-gray-900/50 backdrop-blur-sm" />
      <DialogContent
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
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
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Patient Details
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {isEditing ? "Update patient information below" : "View patient information"}
              </DialogDescription>
            </div>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {!isEditing ? (
          /* Read-Only View */
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient ID - Full Width */}
              <div className="md:col-span-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <p className="font-mono font-medium text-indigo-600 tracking-wider text-sm">
                      {patient.patient_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <DetailItem label="Full Name" value={patient.full_name} />
              <DetailItem 
                label="Date of Birth" 
                value={patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "--"} 
              />
              <DetailItem label="Gender" value={patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)} />
              <DetailItem label="Age" value={age !== null ? `${age} years` : "--"} />

              {/* Contact Info */}
              <DetailItem label="Email" value={patient.email || "--"} />
              <DetailItem label="Mobile Number" value={patient.mobile} />

              {/* Location */}
              <DetailItem label="Country" value={patient.country || "--"} />
              <DetailItem label="State" value={patient.state || "--"} />
              <DetailItem 
                label="Address" 
                value={patient.address || "--"} 
                className="md:col-span-2"
              />
              {patient.city && (
                <DetailItem label="City" value={patient.city} />
              )}
              {patient.postal_code && (
                <DetailItem label="Postal Code" value={patient.postal_code} />
              )}

              {/* Emergency Contact */}
              {patient.emergency_contact && (
                <DetailItem label="Emergency Contact Name" value={patient.emergency_contact} />
              )}
              {patient.emergency_phone && (
                <DetailItem label="Emergency Contact Phone" value={patient.emergency_phone} />
              )}

              {/* Medical Information */}
              {patient.medical_history && (
                <DetailItem 
                  label="Medical History" 
                  value={patient.medical_history} 
                  className="md:col-span-2"
                />
              )}
              {patient.current_medications && (
                <DetailItem 
                  label="Current Medications" 
                  value={patient.current_medications} 
                  className="md:col-span-2"
                />
              )}
              {patient.allergies && (
                <DetailItem 
                  label="Allergies" 
                  value={patient.allergies} 
                  className="md:col-span-2"
                />
              )}

              {/* Insurance Information */}
              {patient.insurance_provider && (
                <DetailItem label="Insurance Provider" value={patient.insurance_provider} />
              )}
              {patient.insurance_number && (
                <DetailItem label="Insurance Number" value={patient.insurance_number} />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 bg-white"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* Edit Mode - Same form as Add Patient */
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
                          className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          <SelectTrigger className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all">
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
                          className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                          className="resize-none bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="resize-none bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="resize-none bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="resize-none bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                            className="h-11 bg-white border-gray-200 rounded-lg text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
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
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 bg-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-900 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Patient"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

