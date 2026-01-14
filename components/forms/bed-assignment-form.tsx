"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi, masterDataApi, employeesApi, bedsApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { UserCheck } from "lucide-react"
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
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Tailwind class for SearchableSelect styling
const searchableSelectWrapperClass = "[&>div>button]:bg-white [&>div>button]:border-gray-200 [&>div>button]:focus:border-gray-600 [&>div>button]:text-sm [&>div>button]:rounded-lg [&>div>button]:h-11"

const bedAssignmentSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  bed_id: z.string().min(1, "Bed is required"),
  admission_date: z.string().min(1, "Admission date is required"),
  expected_discharge_date: z.string().optional(),
  surgery_scheduled_time: z.string().optional(),
  surgery_type: z.string().optional(),
  admission_reason: z.string().min(1, "Admission reason is required"),
  assigned_doctor_id: z.string().optional(),
  assigned_nurse_id: z.string().optional(),
  notes: z.string().optional(),
})

interface BedAssignmentFormProps {
  children: React.ReactNode
  assignmentData?: any
  mode?: "create" | "edit"
  onSuccessAction?: () => void
}



export function BedAssignmentForm({ children, assignmentData, mode = "create", onSuccessAction }: BedAssignmentFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedBedInfo, setSelectedBedInfo] = React.useState<{
    rate: number | null
    ward_type: string | null
    ward_name: string | null
  }>({ rate: null, ward_type: null, ward_name: null })
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [doctors, setDoctors] = React.useState<SearchableSelectOption[]>([])
  const [nurses, setNurses] = React.useState<SearchableSelectOption[]>([])
  const [surgeryTypes, setSurgeryTypes] = React.useState<SearchableSelectOption[]>([])
  const [availableBeds, setAvailableBeds] = React.useState<any[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingDoctors, setLoadingDoctors] = React.useState(false)
  const [loadingNurses, setLoadingNurses] = React.useState(false)
  const [loadingSurgeryTypes, setLoadingSurgeryTypes] = React.useState(false)
  const [loadingBeds, setLoadingBeds] = React.useState(false)

  const form = useForm<z.infer<typeof bedAssignmentSchema>>({
    resolver: zodResolver(bedAssignmentSchema),
    defaultValues: {
      patient_id: assignmentData?.patient_id || "",
      bed_id: assignmentData?.bed_id || "",
      admission_date: assignmentData?.admission_date || new Date().toISOString().split("T")[0],
      expected_discharge_date: assignmentData?.expected_discharge_date || "",
      surgery_scheduled_time: assignmentData?.surgery_scheduled_time || "",
      surgery_type: assignmentData?.surgery_type || "",
      admission_reason: assignmentData?.admission_reason || "",
      assigned_doctor_id: assignmentData?.assigned_doctor_id || "",
      assigned_nurse_id: assignmentData?.assigned_nurse_id || "",
      notes: assignmentData?.notes || "",
    },
  })

  // Load data when dialog opens
  React.useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return
      
      // Load patients
      setLoadingPatients(true)
      try {
        const response = await patientsApi.list({ limit: 1000, status: 'active' })
        if (response.success && response.data) {
          setPatients(
            response.data.map((patient) => ({
              value: patient.id,
              label: `${patient?.full_name || 'Unknown'} (${patient?.patient_id || 'N/A'})`,
            })).filter(item => item.value) // Filter out invalid entries
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

      // Load doctors from users table
      setLoadingDoctors(true)
      try {
        const response = await employeesApi.list({ 
          limit: 1000, 
          status: 'active',
          role: 'doctor,ophthalmologist,optometrist'
        })
        if (response.success && response.data) {
          const doctorsList = response.data.filter(emp => 
            ['doctor', 'ophthalmologist', 'optometrist'].includes(emp.role?.toLowerCase() || '')
          )
          setDoctors(
            doctorsList.map((emp) => ({
              value: emp.id,
              label: `Dr. ${emp.full_name}`,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading doctors:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load doctors from users table."
        })
      } finally {
        setLoadingDoctors(false)
      }

      // Load nurses from users table
      setLoadingNurses(true)
      try {
        const response = await employeesApi.list({ 
          limit: 1000, 
          status: 'active',
          role: 'nurse'
        })
        if (response.success && response.data) {
          const nursesList = response.data.filter(emp => 
            emp.role?.toLowerCase() === 'nurse'
          )
          setNurses(
            nursesList.map((emp) => ({
              value: emp.id,
              label: emp.full_name,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading nurses:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load nurses from users table."
        })
      } finally {
        setLoadingNurses(false)
      }

      // Load surgery types
      setLoadingSurgeryTypes(true)
      try {
        const response = await masterDataApi.list({ category: 'surgery_types' })
        if (response.success && response.data) {
          setSurgeryTypes(
            response.data.map((item) => ({
              value: item.name,
              label: item.name,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading surgery types:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load surgery types."
        })
      } finally {
        setLoadingSurgeryTypes(false)
      }

      // Load available beds from master_data
      setLoadingBeds(true)
      try {
        const response = await masterDataApi.list({ 
          category: 'beds',
          limit: 1000
        })
        if (response.success && response.data) {
          setAvailableBeds(
            response.data
              .filter(bed => bed.is_active)
              .map((bed) => ({
                id: bed.id,
                bed_number: bed.bed_number || bed.name,
                name: bed.name,
                description: bed.description,
              }))
          )
        }
      } catch (error) {
        console.error("Error loading beds:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load available beds."
        })
      } finally {
        setLoadingBeds(false)
      }
    }
    loadData()
  }, [isOpen, toast])

  const handleBedChange = (bedId: string) => {
    const selectedBed = availableBeds.find(b => b.id === bedId)
    if (selectedBed) {
      setSelectedBedInfo({
        rate: null, // From master_data, we don't have rate info
        ward_type: null,
        ward_name: selectedBed.name
      })
    }
  }

  async function onSubmit(values: z.infer<typeof bedAssignmentSchema>) {
    try {
      // Create bed assignment via API (POST to /api/bed-assignments)
      const response = await fetch('/api/bed-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        // Show detailed error message if available
        const errorMessage = data.details 
          ? `${data.error || "Failed to assign bed"}: ${data.details}`
          : data.error || "Failed to assign bed"
        throw new Error(errorMessage)
      }
      
      toast({
        title: "Success",
        description: data.message || "Bed assigned to patient successfully",
      })
      setIsOpen(false)
      form.reset()
      onSuccessAction?.() // Refresh beds list
    } catch (error) {
      console.error("Error assigning bed:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign bed to patient"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0" onCloseButtonClickOnly={true}>
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{mode === "edit" ? "Update Bed Assignment" : "Assign Patient to Bed"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update patient bed assignment details" : "Assign a patient to an available bed"}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="bed-assignment-form">
              <div className="grid grid-cols-12 gap-6">
                {/* Section 1: Assignment Basics */}
                {/* Patient */}
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Patient *</FormLabel>
                      <FormControl>
                        <div className={searchableSelectWrapperClass}>
                          <SearchableSelect
                            options={patients}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Select patient"
                            searchPlaceholder="Search patients..."
                            loading={loadingPatients}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Bed */}
                <FormField
                  control={form.control}
                  name="bed_id"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Bed *</FormLabel>
                      <Combobox
                        onValueChange={(value) => {
                          if (value === "no-beds") return
                          field.onChange(value)
                          handleBedChange(value)
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <ComboboxTrigger className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11" disabled={loadingBeds}>
                            <ComboboxValue placeholder={loadingBeds ? "Loading beds..." : "Select bed"} />
                          </ComboboxTrigger>
                        </FormControl>
                        <ComboboxContent>
                          {availableBeds.length === 0 ? (
                            <ComboboxItem value="no-beds" disabled>
                              No available beds
                            </ComboboxItem>
                          ) : (
                            availableBeds.map((bed) => (
                              <ComboboxItem key={bed.id} value={bed.id}>
                                {bed.bed_number} - {bed.name}
                                {bed.description && ` (${bed.description})`}
                              </ComboboxItem>
                            ))
                          )}
                        </ComboboxContent>
                      </Combobox>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Admission Date */}
                <FormField
                  control={form.control}
                  name="admission_date"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Admission Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Expected Discharge */}
                <FormField
                  control={form.control}
                  name="expected_discharge_date"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Expected Discharge</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Section 2: Clinical Context (Grey Box) */}
                <div className="col-span-12 bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <div className="text-xs font-bold uppercase text-gray-500 mb-4">Clinical Context</div>
                  
                  {/* Admission Reason */}
                  <FormField
                    control={form.control}
                    name="admission_reason"
                    render={({ field }) => (
                      <FormItem className="col-span-12 mb-4">
                        <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Admission Reason *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Cataract Surgery, Post-operative Care" 
                            className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Surgery Details */}
                  <div className="grid grid-cols-12 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="surgery_scheduled_time"
                      render={({ field }) => (
                        <FormItem className="col-span-6">
                          <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Surgery Scheduled Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="surgery_type"
                      render={({ field }) => (
                        <FormItem className="col-span-6">
                          <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Surgery Type</FormLabel>
                          <FormControl>
                            <div className={searchableSelectWrapperClass}>
                              <SearchableSelect
                                options={surgeryTypes}
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder="Select surgery type"
                                searchPlaceholder="Search surgery types..."
                                loading={loadingSurgeryTypes}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Staff */}
                  <div className="grid grid-cols-12 gap-4">
                    <FormField
                      control={form.control}
                      name="assigned_doctor_id"
                      render={({ field }) => (
                        <FormItem className="col-span-6">
                          <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Assigned Doctor</FormLabel>
                          <FormControl>
                            <div className={searchableSelectWrapperClass}>
                              <SearchableSelect
                                options={doctors}
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder="Select doctor"
                                searchPlaceholder="Search doctors..."
                                loading={loadingDoctors}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assigned_nurse_id"
                      render={({ field }) => (
                        <FormItem className="col-span-6">
                          <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nurse</FormLabel>
                          <FormControl>
                            <div className={searchableSelectWrapperClass}>
                              <SearchableSelect
                                options={nurses}
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                placeholder="Select nurse"
                                searchPlaceholder="Search nurses..."
                                loading={loadingNurses}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional information..." 
                          rows={3} 
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="bed-assignment-form"
            className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            {mode === "edit" ? "Update Assignment" : "Assign Bed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

