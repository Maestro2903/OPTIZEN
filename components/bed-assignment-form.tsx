"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi, masterDataApi, employeesApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const bedAssignmentSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  bed_id: z.string().min(1, "Bed is required"),
  admission_date: z.string().min(1, "Admission date is required"),
  expected_discharge_date: z.string().optional(),
  surgery_scheduled_time: z.string().optional(),
  surgery_type: z.string().optional(),
  admission_reason: z.string().min(1, "Admission reason is required"),
  assigned_doctor_id: z.string().optional(),
  notes: z.string().optional(),
})

interface BedAssignmentFormProps {
  children: React.ReactNode
  assignmentData?: any
  mode?: "create" | "edit"
}

// Mock data - in real app, fetch from database
const patients = [
  { id: "1", name: "AARAV MEHTA", mrn: "MRN001", age: 45 },
  { id: "2", name: "NISHANT KAREKAR", mrn: "MRN002", age: 28 },
  { id: "3", name: "PRIYA NAIR", mrn: "MRN003", age: 34 },
  { id: "4", name: "AISHABEN THAKIR", mrn: "MRN004", age: 39 },
]

const availableBeds = [
  { id: "1", bed_number: "101", ward: "General", ward_type: "general", floor: 1, daily_rate: 1500 },
  { id: "2", bed_number: "105", ward: "General", ward_type: "general", floor: 1, daily_rate: 1500 },
  { id: "3", bed_number: "203", ward: "ICU", ward_type: "icu", floor: 2, daily_rate: 5000 },
  { id: "4", bed_number: "301", ward: "Private", ward_type: "private", floor: 3, daily_rate: 3500 },
]

const doctors = [
  { id: "1", name: "Dr. Sarah Martinez", specialty: "Ophthalmologist" },
  { id: "2", name: "Dr. James Wilson", specialty: "Ophthalmologist" },
  { id: "3", name: "Dr. Anita Desai", specialty: "Optometrist" },
]

export function BedAssignmentForm({ children, assignmentData, mode = "create" }: BedAssignmentFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedBedInfo, setSelectedBedInfo] = React.useState<{
    rate: number | null
    ward_type: string | null
    ward_name: string | null
  }>({ rate: null, ward_type: null, ward_name: null })
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [doctors, setDoctors] = React.useState<SearchableSelectOption[]>([])
  const [surgeryTypes, setSurgeryTypes] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingDoctors, setLoadingDoctors] = React.useState(false)
  const [loadingSurgeryTypes, setLoadingSurgeryTypes] = React.useState(false)

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
              label: `${patient.full_name} (${patient.patient_id})`,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading patients:", error)
      } finally {
        setLoadingPatients(false)
      }

      // Load doctors
      setLoadingDoctors(true)
      try {
        const response = await employeesApi.list({ role: 'Doctor', limit: 500 })
        if (response.success && response.data) {
          setDoctors(
            response.data.map((doctor) => ({
              value: doctor.id,
              label: `Dr. ${doctor.full_name} (${doctor.employee_id})`,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading doctors:", error)
      } finally {
        setLoadingDoctors(false)
      }

      // Load surgery types
      setLoadingSurgeryTypes(true)
      try {
        const response = await masterDataApi.list({ category: 'surgery_types', limit: 100 })
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
      } finally {
        setLoadingSurgeryTypes(false)
      }
    }
    loadData()
  }, [isOpen])

  const handleBedChange = (bedId: string) => {
    const selectedBed = availableBeds.find(b => b.id === bedId)
    if (selectedBed) {
      setSelectedBedInfo({
        rate: selectedBed.daily_rate,
        ward_type: selectedBed.ward_type,
        ward_name: selectedBed.ward
      })
    }
  }

  function onSubmit(values: z.infer<typeof bedAssignmentSchema>) {
    console.log(mode === "edit" ? "Update:" : "Assign:", values)
    setIsOpen(false)
    form.reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Update Bed Assignment" : "Assign Patient to Bed"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update patient bed assignment details" : "Assign a patient to an available bed"}
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
                name="bed_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleBedChange(value)
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBeds.map((bed) => (
                          <SelectItem key={bed.id} value={bed.id}>
                            Bed {bed.bed_number} - {bed.ward} (Floor {bed.floor}) - ₹{bed.daily_rate}/day
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="admission_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission Reason *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cataract Surgery, Post-operative Care" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedBedInfo.rate && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Ward Type:</span>
                    <Badge variant="secondary" className="capitalize">
                      {selectedBedInfo.ward_name}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedBedInfo.ward_type === 'icu' && 'Intensive Care Unit - 24/7 monitoring'}
                    {selectedBedInfo.ward_type === 'private' && 'Private room - Enhanced privacy & comfort'}
                    {selectedBedInfo.ward_type === 'general' && 'General ward - Standard care'}
                    {selectedBedInfo.ward_type === 'semi_private' && 'Semi-private - Shared room (2-4 beds)'}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Rate:</span>
                    <span className="text-lg font-bold">₹{selectedBedInfo.rate.toLocaleString()}/day</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This rate will be applied for billing purposes
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="admission_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expected_discharge_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Discharge Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assigned_doctor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Doctor</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={doctors}
                      value={field.value || ""}
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

            <div className="space-y-2">
              <div className="text-sm font-medium">Surgery Details (Optional)</div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="surgery_scheduled_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surgery Scheduled Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surgery_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surgery Type</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={surgeryTypes}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select surgery type"
                          searchPlaceholder="Search surgery types..."
                          loading={loadingSurgeryTypes}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <Button type="submit">{mode === "edit" ? "Update Assignment" : "Assign Bed"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

