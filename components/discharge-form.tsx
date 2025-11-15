"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { patientsApi, operationsApi, dischargesApi, casesApi } from "@/lib/services/api"
import { useMasterData } from "@/hooks/use-master-data"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const dischargeFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  case_id: z.string().min(1, "Case is required"),
  admission_date: z.string().min(1, "Admission date is required"),
  discharge_date: z.string().min(1, "Discharge date is required"),
  discharge_summary: z.string().optional(),
  final_diagnosis: z.array(z.string()).optional(), // Changed to array
  treatment_given: z.array(z.string()).optional(), // Changed to array
  condition_on_discharge: z.string().optional(),
  instructions: z.string().optional(),
  follow_up_date: z.string().optional(),
  medications: z.array(z.string()).optional(), // Changed to array
  dosages: z.array(z.string()).optional(), // New field
  discharge_type: z.string().optional(),
  status: z.string().optional(),
})

interface DischargeFormProps {
  children: React.ReactNode
  dischargeData?: any
  mode?: "add" | "edit"
  onSuccess?: () => void
}

export function DischargeForm({ children, dischargeData, mode = "add", onSuccess }: DischargeFormProps) {
  const { toast } = useToast()
  const masterData = useMasterData()
  const [open, setOpen] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [cases, setCases] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingCases, setLoadingCases] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Master data options as MultiSelectOption arrays
  const diagnosisOptions: MultiSelectOption[] = React.useMemo(
    () => masterData.data.diagnosis.map(d => ({ value: d.value, label: d.label })),
    [masterData.data.diagnosis]
  )
  const treatmentOptions: MultiSelectOption[] = React.useMemo(
    () => masterData.data.treatments.map(t => ({ value: t.value, label: t.label })),
    [masterData.data.treatments]
  )
  const medicineOptions: MultiSelectOption[] = React.useMemo(
    () => masterData.data.medicines.map(m => ({ value: m.value, label: m.label })),
    [masterData.data.medicines]
  )
  const dosageOptions: MultiSelectOption[] = React.useMemo(
    () => masterData.data.dosages.map(d => ({ value: d.value, label: d.label })),
    [masterData.data.dosages]
  )

  const form = useForm<z.infer<typeof dischargeFormSchema>>({
    resolver: zodResolver(dischargeFormSchema),
    defaultValues: dischargeData ? {
      patient_id: dischargeData.patient_id || "",
      case_id: dischargeData.case_id || "",
      admission_date: dischargeData.admission_date || new Date().toISOString().split("T")[0],
      discharge_date: dischargeData.discharge_date || new Date().toISOString().split("T")[0],
      discharge_summary: dischargeData.discharge_summary || "",
      final_diagnosis: dischargeData.final_diagnosis?.ids || [],
      treatment_given: dischargeData.treatment_given?.ids || [],
      medications: dischargeData.medications?.medicines?.ids || [],
      dosages: dischargeData.medications?.dosages?.ids || [],
      condition_on_discharge: dischargeData.condition_on_discharge || "",
      instructions: dischargeData.instructions || "",
      follow_up_date: dischargeData.follow_up_date || "",
      discharge_type: dischargeData.discharge_type || "regular",
      status: dischargeData.status || "completed",
    } : {
      admission_date: new Date().toISOString().split("T")[0],
      discharge_date: new Date().toISOString().split("T")[0],
      discharge_type: "regular",
      status: "completed",
      final_diagnosis: [],
      treatment_given: [],
      medications: [],
      dosages: [],
    },
  })

  // Load master data when dialog opens
  React.useEffect(() => {
    if (open) {
      masterData.fetchMultiple(['diagnosis', 'treatments', 'medicines', 'dosages'])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Reset form with discharge data when dialog opens in edit mode
  React.useEffect(() => {
    if (open && mode === "edit" && dischargeData) {
      form.reset({
        patient_id: dischargeData.patient_id || "",
        case_id: dischargeData.case_id || "",
        admission_date: dischargeData.admission_date || new Date().toISOString().split("T")[0],
        discharge_date: dischargeData.discharge_date || new Date().toISOString().split("T")[0],
        discharge_summary: dischargeData.discharge_summary || "",
        final_diagnosis: dischargeData.final_diagnosis?.ids || [],
        treatment_given: dischargeData.treatment_given?.ids || [],
        medications: dischargeData.medications?.medicines?.ids || [],
        dosages: dischargeData.medications?.dosages?.ids || [],
        condition_on_discharge: dischargeData.condition_on_discharge || "",
        instructions: dischargeData.instructions || "",
        follow_up_date: dischargeData.follow_up_date || "",
        discharge_type: dischargeData.discharge_type || "regular",
        status: dischargeData.status || "completed",
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, dischargeData])

  // Load data when dialog opens
  React.useEffect(() => {
    const abortController = new AbortController()
    let cancelled = false

    const loadData = async () => {
      if (!open) return
      
      // Load patients
      setLoadingPatients(true)
      try {
        const response = await patientsApi.list({ limit: 1000, status: 'active' })
        if (cancelled) return
        
        if (response.success && response.data) {
          if (!cancelled) {
            setPatients(
              response.data.map((patient) => ({
                value: patient.id,
                label: `${patient.full_name} (${patient.patient_id})`,
              }))
            )
          }
        } else {
          if (!cancelled) {
            toast({
              title: "Failed to load patients",
              description: "Unable to fetch patient list. Please try again.",
              variant: "destructive",
            })
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Error loading patients:", error)
          toast({
            title: "Failed to load patients",
            description: error?.message ?? "An unexpected error occurred",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingPatients(false)
        }
      }

      // Load cases
      if (cancelled) return
      setLoadingCases(true)
      try {
        const response = await casesApi.list({ limit: 1000, sortBy: 'encounter_date', sortOrder: 'desc' })
        if (cancelled) return
        
        if (response.success && response.data) {
          const safeCases = response.data
            .filter((case_) => case_?.id)
            .map((case_) => ({
              value: case_.id,
              label: `${case_.case_no || 'Case'} - ${case_.patients?.full_name || 'N/A'}`,
            }))
          
          if (!cancelled) {
            setCases(safeCases)
          }
        } else {
          if (!cancelled) {
            toast({
              title: "Failed to load cases",
              description: "Unable to fetch cases list. Please try again.",
              variant: "destructive",
            })
          }
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Error loading cases:", error)
          toast({
            title: "Failed to load cases",
            description: error?.message ?? "An unexpected error occurred",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) {
          setLoadingCases(false)
        }
      }
    }
    
    loadData()

    return () => {
      cancelled = true
      abortController.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function onSubmit(values: z.infer<typeof dischargeFormSchema>) {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      // Convert arrays to JSONB format with both IDs and labels
      const diagnosisData = values.final_diagnosis && values.final_diagnosis.length > 0
        ? {
            ids: values.final_diagnosis,
            labels: diagnosisOptions
              .filter(d => values.final_diagnosis?.includes(d.value))
              .map(d => d.label)
          }
        : undefined

      const treatmentData = values.treatment_given && values.treatment_given.length > 0
        ? {
            ids: values.treatment_given,
            labels: treatmentOptions
              .filter(t => values.treatment_given?.includes(t.value))
              .map(t => t.label)
          }
        : undefined

      const medicationData = (values.medications && values.medications.length > 0) || 
                             (values.dosages && values.dosages.length > 0)
        ? {
            medicines: {
              ids: values.medications || [],
              labels: medicineOptions
                .filter(m => values.medications?.includes(m.value))
                .map(m => m.label)
            },
            dosages: {
              ids: values.dosages || [],
              labels: dosageOptions
                .filter(d => values.dosages?.includes(d.value))
                .map(d => d.label)
            }
          }
        : undefined

      const payload = {
        patient_id: values.patient_id,
        case_id: values.case_id,
        admission_date: values.admission_date,
        discharge_date: values.discharge_date,
        discharge_summary: values.discharge_summary || undefined,
        final_diagnosis: diagnosisData || null, // Store as JSONB with IDs and labels, null if empty
        treatment_given: treatmentData || null, // Store as JSONB with IDs and labels, null if empty
        condition_on_discharge: values.condition_on_discharge || undefined,
        instructions: values.instructions || undefined,
        follow_up_date: values.follow_up_date || undefined,
        medications: medicationData || null, // Store as JSONB with IDs and labels, null if empty
        discharge_type: (values.discharge_type as any) || 'regular',
        status: (values.status as any) || 'completed',
      }

      const response = mode === "edit" && dischargeData?.id
        ? await dischargesApi.update(dischargeData.id, payload)
        : await dischargesApi.create(payload)

      if (response.success) {
        toast({
          title: "Success",
          description: mode === "edit" ? "Discharge record updated successfully" : "Discharge record created successfully",
        })
        setOpen(false)
        form.reset()
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: response.error || `Failed to ${mode === "edit" ? "update" : "create"} discharge record`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error submitting discharge:", error)
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Discharge Record" : "Add Discharge Record"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update discharge summary with IPD details and advice" : "Create discharge summary with IPD details and advice"}
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
                        disabled={mode === "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={cases}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select case"
                        searchPlaceholder="Search cases..."
                        loading={loadingCases}
                        disabled={mode === "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                name="discharge_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discharge Date *</FormLabel>
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
              name="final_diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Final Diagnosis</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={diagnosisOptions}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Select diagnosis..."
                      searchPlaceholder="Search diagnosis..."
                      emptyText="No diagnosis found"
                      loading={masterData.loading.diagnosis}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discharge_summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discharge Summary</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Summary of treatment and discharge..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatment_given"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Given</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={treatmentOptions}
                      value={field.value || []}
                      onValueChange={field.onChange}
                      placeholder="Select treatments..."
                      searchPlaceholder="Search treatments..."
                      emptyText="No treatments found"
                      loading={masterData.loading.treatments}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition_on_discharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition on Discharge</FormLabel>
                  <FormControl>
                    <Input placeholder="Patient condition at discharge..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="medications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medications Prescribed</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={medicineOptions}
                        value={field.value || []}
                        onValueChange={field.onChange}
                        placeholder="Select medications..."
                        searchPlaceholder="Search medications..."
                        emptyText="No medications found"
                        loading={masterData.loading.medicines}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dosages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosages</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={dosageOptions}
                        value={field.value || []}
                        onValueChange={field.onChange}
                        placeholder="Select dosages..."
                        searchPlaceholder="Search dosages..."
                        emptyText="No dosages found"
                        loading={masterData.loading.dosages}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discharge Instructions</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Post-discharge care instructions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="follow_up_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (mode === "edit" ? "Updating..." : "Saving...") : (mode === "edit" ? "Update Discharge" : "Save Discharge")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

