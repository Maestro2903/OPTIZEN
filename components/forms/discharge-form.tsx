"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { FileSignature, Plus, Trash2 } from "lucide-react"
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
  medicationDosagePairs: z.array(
    z.object({
      medication: z.string().optional(),
      dosage: z.string().optional(),
    })
  ).optional(),
  discharge_type: z.string().optional(),
  status: z.string().optional(),
}).refine((data) => {
  // Compare ISO date strings lexicographically to avoid timezone issues
  // Ensure both dates are non-empty before comparison
  if (!data.admission_date || !data.discharge_date) {
    return true; // Let other validations handle empty dates
  }

  // Compare as ISO strings (YYYY-MM-DD) lexicographically
  return data.discharge_date >= data.admission_date;
}, {
  message: "Discharge date must be on or after admission date",
  path: ["discharge_date"], // This will show the error on the discharge_date field
});

interface DischargeFormProps {
  children: React.ReactNode
  dischargeData?: any
  mode?: "add" | "edit"
  onSuccess?: () => void
}

// Helper function to transform medication and dosage IDs into paired objects
const transformMedicationsToIdPairs = (medications: any) => {
  if (!medications?.medicines?.ids || !medications?.dosages?.ids) {
    return {
      pairs: [],
      unpairedMeds: [],
      unpairedDosages: [],
      warning: undefined
    };
  }

  const medIds = medications.medicines.ids;
  const dosageIds = medications.dosages.ids;

  // Calculate the minimum length to determine how many pairs can be created
  const minLength = Math.min(medIds.length, dosageIds.length);

  // Create pairs only up to the minimum length
  const pairs = medIds.slice(0, minLength).map((medId: string, index: number) => ({
    medication: medId,
    dosage: dosageIds[index] || ""
  }));

  // Collect remaining unpaired items
  const unpairedMeds = medIds.length > minLength ? medIds.slice(minLength) : [];
  const unpairedDosages = dosageIds.length > minLength ? dosageIds.slice(minLength) : [];

  // Create warning if arrays have different lengths
  let warning: string | undefined = undefined;
  if (medIds.length !== dosageIds.length) {
    warning = `Medication and dosage arrays have different lengths: ${medIds.length} medications vs ${dosageIds.length} dosages. Created ${pairs.length} pairs, with ${unpairedMeds.length} unpaired medication(s) and ${unpairedDosages.length} unpaired dosage(s).`;
  }

  return {
    pairs,
    unpairedMeds,
    unpairedDosages,
    warning
  };
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

  // Initialize form with default values
  const medicationResult = React.useMemo(() => {
    return dischargeData ? transformMedicationsToIdPairs(dischargeData.medications) : {
      pairs: [],
      unpairedMeds: [],
      unpairedDosages: [],
      warning: undefined
    };
  }, [dischargeData]);

  React.useEffect(() => {
    if (medicationResult.warning) {
      toast({
        title: "Data Warning",
        description: medicationResult.warning,
        variant: "destructive",
      });
    }
  }, [medicationResult.warning, toast]);

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
      medicationDosagePairs: medicationResult.pairs,
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
      medicationDosagePairs: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medicationDosagePairs"
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
      const medResult = transformMedicationsToIdPairs(dischargeData.medications);

      if (medResult.warning) {
        toast({
          title: "Data Warning",
          description: medResult.warning,
          variant: "destructive",
        });
      }

      form.reset({
        patient_id: dischargeData.patient_id || "",
        case_id: dischargeData.case_id || "",
        admission_date: dischargeData.admission_date || new Date().toISOString().split("T")[0],
        discharge_date: dischargeData.discharge_date || new Date().toISOString().split("T")[0],
        discharge_summary: dischargeData.discharge_summary || "",
        final_diagnosis: dischargeData.final_diagnosis?.ids || [],
        treatment_given: dischargeData.treatment_given?.ids || [],
        medicationDosagePairs: medResult.pairs,
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

    // Validate medication dosage pairs at submit time
    if (values.medicationDosagePairs) {
      for (let i = 0; i < values.medicationDosagePairs.length; i++) {
        const pair = values.medicationDosagePairs[i];
        const med = pair?.medication?.trim() ?? "";
        const dose = pair?.dosage?.trim() ?? "";

        // Skip rows where both medication and dosage are empty
        if (med === "" && dose === "") {
          continue;
        }

        // If exactly one is non-empty, show validation error
        if ((med !== "" && dose === "") || (med === "" && dose !== "")) {
          toast({
            title: "Validation Error",
            description: `Both medication and dosage must be filled in row ${i + 1}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

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

      const medicationData = values.medicationDosagePairs && values.medicationDosagePairs.length > 0
        ? (() => {
            // Filter out pairs where both medication and dosage are present
            const validPairs = values.medicationDosagePairs.filter(pair =>
              pair &&
              pair.medication &&
              pair.medication.trim() !== "" &&
              pair.dosage &&
              pair.dosage.trim() !== ""
            );

            // If no valid pairs, return undefined
            if (validPairs.length === 0) {
              return undefined;
            }

            // Map valid pairs to create medicine and dosage data
            const medicineLabels = validPairs.map(pair => {
              const option = medicineOptions.find(opt => opt.value === pair.medication);
              if (!option) {
                console.warn(`Missing medicine option for ID: ${pair.medication}`);
                return null; // Return null instead of the ID
              }
              return option.label;
            });

            // Check if any medicine label is null
            if (medicineLabels.some(label => label === null)) {
              toast({
                variant: "destructive",
                title: "Missing Master Data",
                description: "Some medicine options are missing from the system. Please refresh the page or contact support.",
              });
              return undefined;
            }

            const dosageLabels = validPairs.map(pair => {
              const option = dosageOptions.find(opt => opt.value === pair.dosage);
              if (!option) {
                console.warn(`Missing dosage option for ID: ${pair.dosage}`);
                return null; // Return null instead of the ID
              }
              return option.label;
            });

            // Check if any dosage label is null
            if (dosageLabels.some(label => label === null)) {
              toast({
                variant: "destructive",
                title: "Missing Master Data",
                description: "Some dosage options are missing from the system. Please refresh the page or contact support.",
              });
              return undefined;
            }

            return {
              medicines: {
                ids: validPairs.map(pair => pair.medication),
                labels: medicineLabels
              },
              dosages: {
                ids: validPairs.map(pair => pair.dosage),
                labels: dosageLabels
              }
            };
          })()
        : undefined

      // If medicationData is undefined due to missing master data, stop the submission
      if (values.medicationDosagePairs && values.medicationDosagePairs.length > 0 && medicationData === undefined) {
        setIsSubmitting(false);
        return; // Exit early to prevent API call with incomplete data
      }

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
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0" onCloseButtonClickOnly={true}>
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{mode === "edit" ? "Edit Discharge Record" : "Add Discharge Record"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update discharge summary with IPD details and advice" : "Create discharge summary with IPD details and advice"}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="discharge-form">
              <div className="grid grid-cols-12 gap-6">
                {/* Section 1: Patient & Timeline */}
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Patient *</FormLabel>
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
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Case *</FormLabel>
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
                <FormField
                  control={form.control}
                  name="admission_date"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Admission Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="bg-white border-gray-200 focus:border-gray-600 focus:ring-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discharge_date"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Discharge Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="bg-white border-gray-200 focus:border-gray-600 focus:ring-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Section 2: Clinical Summary */}
                <div className="col-span-12">
                  <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Clinical Summary</h3>
                </div>
                <FormField
                  control={form.control}
                  name="final_diagnosis"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Final Diagnosis</FormLabel>
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
                    <FormItem className="col-span-12">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Discharge Summary</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={4} 
                          placeholder="Summary of treatment and discharge..." 
                          className="resize-y p-3 bg-white border-gray-200 focus:border-gray-600 focus:ring-gray-200 rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="treatment_given"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Treatment Given</FormLabel>
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

                {/* Section 3: Post-Discharge Plan (Grey Box) */}
                <div className="col-span-12 bg-slate-50 border border-slate-200 rounded-xl p-6 grid grid-cols-12 gap-6">
                  <div className="col-span-12">
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Advice & Instructions</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="condition_on_discharge"
                    render={({ field }) => (
                      <FormItem className="col-span-12">
                        <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Condition on Discharge</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Patient condition at discharge..." 
                            className="bg-white border-gray-200 focus:border-gray-600 focus:ring-gray-200 rounded-lg"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-12">
                    <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">
                      Medications and Dosages
                    </FormLabel>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`medicationDosagePairs.${index}.medication`}
                            render={({ field }) => (
                              <FormItem className="col-span-8">
                                <FormControl>
                                  <SearchableSelect
                                    options={medicineOptions}
                                    value={field.value || ""}
                                    onValueChange={(val) => field.onChange(val)}
                                    placeholder="Select medication..."
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
                            name={`medicationDosagePairs.${index}.dosage`}
                            render={({ field }) => (
                              <FormItem className="col-span-3">
                                <FormControl>
                                  <SearchableSelect
                                    options={dosageOptions}
                                    value={field.value || ""}
                                    onValueChange={(val) => field.onChange(val)}
                                    placeholder="Select dosage..."
                                    searchPlaceholder="Search dosages..."
                                    emptyText="No dosages found"
                                    loading={masterData.loading.dosages}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="col-span-1 flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                              aria-label="Remove medication-dosage pair"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ medication: "", dosage: "" })}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medication-Dosage Pair
                      </Button>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem className="col-span-12">
                        <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={3} 
                            placeholder="Post-discharge care instructions..." 
                            className="resize-y p-3 bg-white border-gray-200 focus:border-gray-600 focus:ring-gray-200 rounded-lg"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="follow_up_date"
                    render={({ field }) => (
                      <FormItem className="col-span-6">
                        <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Follow-up Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="bg-white border-gray-200 focus:border-gray-600 focus:ring-gray-200 rounded-lg"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)} 
            disabled={isSubmitting}
            className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="discharge-form"
            disabled={isSubmitting}
            className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg"
          >
            {isSubmitting ? (
              mode === "edit" ? "Updating..." : "Saving..."
            ) : (
              <>
                <FileSignature className="mr-2 h-4 w-4" />
                {mode === "edit" ? "Update Discharge" : "Save Discharge"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

