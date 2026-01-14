"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { SimpleCombobox } from "@/components/ui/simple-combobox"
import { treatmentMedicationsApi, type TreatmentMedicationRecord } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { useMasterData } from "@/hooks/use-master-data"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { X, Check, Trash2, Pill } from "lucide-react"
import { patientsApi } from "@/lib/services/api"

const inputClassName = "h-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200"

// Treatment Medication Schema
const treatmentMedicationSchema = z.object({
  patient_id: z.string().optional(),
  record_date: z.string().min(1, "Record date is required"),
  record_time: z.string().optional(),
  record_number: z.string().min(1, "Record number is required"),
  
  // Current Medications
  medications: z.array(z.object({
    drug_name: z.string().min(1, "Drug is required"),
    eye: z.string().optional(),
    dosage: z.string().optional(),
    route: z.string().optional(),
    duration: z.string().optional(),
    quantity: z.string().optional(),
  })).optional(),
  
  // Past History Medications
  past_medications: z.array(z.object({
    medicine_id: z.string().optional(),
    medicine_name: z.string().min(1, "Medicine name is required"),
    type: z.string().optional(),
    advice: z.string().optional(),
    duration: z.string().optional(),
    eye: z.string().optional(),
  })).optional(),
  
  // Past History Treatments
  past_treatments: z.array(z.object({
    treatment: z.string().min(1, "Treatment is required"),
    years: z.string().optional(),
  })).optional(),
  
  // Surgeries
  surgeries: z.array(z.object({
    eye: z.string().min(1, "Eye is required"),
    surgery_name: z.string().min(1, "Surgery name is required"),
    anesthesia: z.string().optional(),
  })).optional(),
  
  // General Treatments
  treatments: z.array(z.string()).optional(),
})

type TreatmentMedicationFormValues = z.infer<typeof treatmentMedicationSchema>

interface TreatmentMedicationFormProps {
  children?: React.ReactNode
  recordData?: TreatmentMedicationRecord
  mode?: "create" | "edit"
  onSubmit?: (data: TreatmentMedicationFormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TreatmentMedicationForm({
  children,
  recordData,
  mode = "create",
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TreatmentMedicationFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const masterData = useMasterData()

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : open
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setOpen

  // Extract data from recordData
  const medicationsData = recordData?.medications_data || {}
  const pastMedicationsData = recordData?.past_medications_data || {}
  const pastTreatmentsData = recordData?.past_treatments_data || {}
  const surgeriesData = recordData?.surgeries_data || {}
  const treatmentsData = recordData?.treatments_data || {}

  // State for adding new items
  const [newMedicineDrug, setNewMedicineDrug] = React.useState("")
  const [newMedicineEye, setNewMedicineEye] = React.useState("")
  const [newMedicineDosage, setNewMedicineDosage] = React.useState("")
  const [newMedicineRoute, setNewMedicineRoute] = React.useState("")
  const [newMedicineDuration, setNewMedicineDuration] = React.useState("")
  const [newMedicineQuantity, setNewMedicineQuantity] = React.useState("")
  const [showMedicineForm, setShowMedicineForm] = React.useState(false)

  const [newPastMedicineName, setNewPastMedicineName] = React.useState("")
  const [newPastMedicineType, setNewPastMedicineType] = React.useState("")
  const [newPastMedicineAdvice, setNewPastMedicineAdvice] = React.useState("")
  const [newPastMedicineDuration, setNewPastMedicineDuration] = React.useState("")
  const [newPastMedicineEye, setNewPastMedicineEye] = React.useState("")
  const [showPastMedicineForm, setShowPastMedicineForm] = React.useState(false)

  const [newTreatment, setNewTreatment] = React.useState("")
  const [newTreatmentYears, setNewTreatmentYears] = React.useState("")
  const [showTreatmentForm, setShowTreatmentForm] = React.useState(false)

  const [newSurgeryEye, setNewSurgeryEye] = React.useState("")
  const [newSurgeryName, setNewSurgeryName] = React.useState("")
  const [newSurgeryAnesthesia, setNewSurgeryAnesthesia] = React.useState("")
  const [showSurgeryForm, setShowSurgeryForm] = React.useState(false)

  const form = useForm<TreatmentMedicationFormValues>({
    resolver: zodResolver(treatmentMedicationSchema),
    defaultValues: {
      patient_id: recordData?.patient_id || "",
      record_date: recordData?.record_date || new Date().toISOString().split('T')[0],
      record_time: recordData?.record_time || "",
      record_number: recordData?.record_number || "",
      
      // Current Medications
      medications: medicationsData.medications || [],
      
      // Past History Medications
      past_medications: pastMedicationsData.medications || [],
      
      // Past History Treatments
      past_treatments: pastTreatmentsData.treatments || [],
      
      // Surgeries
      surgeries: surgeriesData.surgeries || [],
      
      // General Treatments
      treatments: treatmentsData.treatments || [],
    },
  })

  const { fields: medicationFields, append: appendMedication, remove: removeMedication } = useFieldArray({
    control: form.control,
    name: "medications",
  })

  const { fields: pastMedicationFields, append: appendPastMedication, remove: removePastMedication } = useFieldArray({
    control: form.control,
    name: "past_medications",
  })

  const { fields: pastTreatmentFields, append: appendPastTreatment, remove: removePastTreatment } = useFieldArray({
    control: form.control,
    name: "past_treatments",
  })

  const { fields: surgeryFields, append: appendSurgery, remove: removeSurgery } = useFieldArray({
    control: form.control,
    name: "surgeries",
  })

  // Load master data when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      masterData.fetchMultiple([
        'medicines',
        'dosages',
        'routes',
        'eyeSelection',
        'surgeries',
        'anesthesiaTypes',
        'treatments'
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Load patients when dialog opens
  React.useEffect(() => {
    if (isOpen && patients.length === 0 && !loadingPatients) {
      setLoadingPatients(true)
      patientsApi
        .list({ limit: 1000 })
        .then((response) => {
          if (response.success && response.data) {
            const patientOptions: SearchableSelectOption[] = response.data.map((p) => ({
              value: p.id,
              label: `${p.patient_id} - ${p.full_name || 'Unknown'}`,
            }))
            setPatients(patientOptions)
          }
        })
        .catch((error) => {
          console.error("Error loading patients:", error)
          toast({
            title: "Error",
            description: "Failed to load patients",
            variant: "destructive",
          })
        })
        .finally(() => {
          setLoadingPatients(false)
        })
    }
  }, [isOpen, patients.length, loadingPatients, toast])

  // Handle add current medication
  const handleAddMedication = () => {
    if (!newMedicineDrug) {
      toast({
        title: "Error",
        description: "Drug name is required",
        variant: "destructive",
      })
      return
    }

    appendMedication({
      drug_name: newMedicineDrug,
      eye: newMedicineEye || undefined,
      dosage: newMedicineDosage || undefined,
      route: newMedicineRoute || undefined,
      duration: newMedicineDuration || undefined,
      quantity: newMedicineQuantity || undefined,
    })

    // Reset form
    setNewMedicineDrug("")
    setNewMedicineEye("")
    setNewMedicineDosage("")
    setNewMedicineRoute("")
    setNewMedicineDuration("")
    setNewMedicineQuantity("")
    setShowMedicineForm(false)
  }

  // Handle add past medication
  const handleAddPastMedication = () => {
    if (!newPastMedicineName) {
      toast({
        title: "Error",
        description: "Medicine name is required",
        variant: "destructive",
      })
      return
    }

    appendPastMedication({
      medicine_name: newPastMedicineName,
      type: newPastMedicineType || undefined,
      advice: newPastMedicineAdvice || undefined,
      duration: newPastMedicineDuration || undefined,
      eye: newPastMedicineEye || undefined,
    })

    // Reset form
    setNewPastMedicineName("")
    setNewPastMedicineType("")
    setNewPastMedicineAdvice("")
    setNewPastMedicineDuration("")
    setNewPastMedicineEye("")
    setShowPastMedicineForm(false)
  }

  // Handle add past treatment
  const handleAddPastTreatment = () => {
    if (!newTreatment) {
      toast({
        title: "Error",
        description: "Treatment is required",
        variant: "destructive",
      })
      return
    }

    appendPastTreatment({
      treatment: newTreatment,
      years: newTreatmentYears || undefined,
    })

    // Reset form
    setNewTreatment("")
    setNewTreatmentYears("")
    setShowTreatmentForm(false)
  }

  // Handle add surgery
  const handleAddSurgery = () => {
    if (!newSurgeryEye || !newSurgeryName) {
      toast({
        title: "Error",
        description: "Eye and Surgery name are required",
        variant: "destructive",
      })
      return
    }

    appendSurgery({
      eye: newSurgeryEye,
      surgery_name: newSurgeryName,
      anesthesia: newSurgeryAnesthesia || undefined,
    })

    // Reset form
    setNewSurgeryEye("")
    setNewSurgeryName("")
    setNewSurgeryAnesthesia("")
    setShowSurgeryForm(false)
  }

  const handleSubmit = async (values: TreatmentMedicationFormValues) => {
    if (!onSubmit) return

    setLoading(true)
    try {
      // Transform form data to API format
      const transformedData = {
        patient_id: values.patient_id || undefined,
        record_date: values.record_date,
        record_time: values.record_time || undefined,
        record_number: values.record_number,
        medications_data: {
          medications: values.medications?.map(m => ({
            drug_id: m.drug_name,
            eye: m.eye || undefined,
            dosage_id: m.dosage || undefined,
            route_id: m.route || undefined,
            duration: m.duration || undefined,
            quantity: m.quantity || undefined,
          })) || [],
        },
        past_medications_data: {
          medications: values.past_medications?.map(m => ({
            medicine_id: m.medicine_id || undefined,
            medicine_name: m.medicine_name,
            type: m.type || undefined,
            advice: m.advice || undefined,
            duration: m.duration || undefined,
            eye: m.eye || undefined,
          })) || [],
        },
        past_treatments_data: {
          treatments: values.past_treatments?.map(t => ({
            treatment: t.treatment,
            years: t.years || undefined,
          })) || [],
        },
        surgeries_data: {
          surgeries: values.surgeries?.map(s => ({
            eye: s.eye,
            surgery_name: s.surgery_name,
            anesthesia: s.anesthesia || undefined,
          })) || [],
        },
        treatments_data: {
          treatments: values.treatments || [],
        },
      }

      await onSubmit(transformedData as any)
      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper to check if value is UUID
  const isUUID = (val: string | undefined | null): boolean => {
    if (!val || typeof val !== 'string') return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onCloseButtonClickOnly={true}>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Treatment & Medication Record" : "Add Treatment & Medication Record"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Update the treatment and medication record details."
              : "Create a new treatment and medication record for the patient."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={patients}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Select patient..."
                      searchPlaceholder="Search patients..."
                      emptyText="No patients found."
                      loading={loadingPatients}
                      className={inputClassName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Record Details */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="record_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record Date *</FormLabel>
                    <FormControl>
                      <Input type="date" className={inputClassName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="record_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record Time</FormLabel>
                    <FormControl>
                      <Input type="time" className={inputClassName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="record_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record Number *</FormLabel>
                    <FormControl>
                      <Input className={inputClassName} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Current Medications Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Current Medications</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMedicineForm(!showMedicineForm)}
                >
                  {showMedicineForm ? "Cancel" : "Add Medication"}
                </Button>
              </div>

              {showMedicineForm && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormItem>
                      <FormLabel>Drug Name *</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.medicines || []}
                        value={newMedicineDrug}
                        onChange={setNewMedicineDrug}
                        placeholder="Select drug"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Eye</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.eyeSelection || []}
                        value={newMedicineEye}
                        onChange={setNewMedicineEye}
                        placeholder="Select eye"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.dosages || []}
                        value={newMedicineDosage}
                        onChange={setNewMedicineDosage}
                        placeholder="Select dosage"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.routes || []}
                        value={newMedicineRoute}
                        onChange={setNewMedicineRoute}
                        placeholder="Select route"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Input
                        placeholder="e.g., 7 days"
                        value={newMedicineDuration}
                        onChange={(e) => setNewMedicineDuration(e.target.value)}
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <Input
                        placeholder="Quantity"
                        value={newMedicineQuantity}
                        onChange={(e) => setNewMedicineQuantity(e.target.value)}
                      />
                    </FormItem>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleAddMedication} disabled={!newMedicineDrug}>
                      Add Medication
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMedicineForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {medicationFields.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground text-sm">No medications added.</div>
              ) : (
                <div className="space-y-2">
                  {medicationFields.map((field, index) => {
                    const drug = masterData.data.medicines?.find(m => m.value === (field as any).drug_name)
                    const eye = masterData.data.eyeSelection?.find(e => e.value === (field as any).eye)
                    const dosage = masterData.data.dosages?.find(d => d.value === (field as any).dosage)
                    const route = masterData.data.routes?.find(r => r.value === (field as any).route)
                    
                    const drugName = drug?.label || ((field as any).drug_name && !isUUID((field as any).drug_name) ? (field as any).drug_name : "N/A")
                    const eyeLabel = eye?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                    
                    return (
                      <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{drugName}</div>
                          <div className="text-xs text-gray-500 space-x-2">
                            <span>{eyeLabel}</span>
                            {dosage?.label && <span>• {dosage.label}</span>}
                            {route?.label && <span>• {route.label}</span>}
                            {(field as any).duration && <span>• {(field as any).duration}</span>}
                            {(field as any).quantity && <span>• Qty: {(field as any).quantity}</span>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Past History Medications Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Past History Medications</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPastMedicineForm(!showPastMedicineForm)}
                >
                  {showPastMedicineForm ? "Cancel" : "Add Past Medication"}
                </Button>
              </div>

              {showPastMedicineForm && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormItem>
                      <FormLabel>Medicine Name *</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.medicines || []}
                        value={newPastMedicineName}
                        onChange={setNewPastMedicineName}
                        placeholder="Select medicine"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Type/Frequency</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.dosages || []}
                        value={newPastMedicineType}
                        onChange={setNewPastMedicineType}
                        placeholder="Select type"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Eye</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.eyeSelection || []}
                        value={newPastMedicineEye}
                        onChange={setNewPastMedicineEye}
                        placeholder="Select eye"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Input
                        placeholder="e.g., 2 years"
                        value={newPastMedicineDuration}
                        onChange={(e) => setNewPastMedicineDuration(e.target.value)}
                      />
                    </FormItem>

                    <FormItem className="col-span-2">
                      <FormLabel>Advice</FormLabel>
                      <Textarea
                        placeholder="Additional advice..."
                        value={newPastMedicineAdvice}
                        onChange={(e) => setNewPastMedicineAdvice(e.target.value)}
                        rows={2}
                      />
                    </FormItem>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleAddPastMedication} disabled={!newPastMedicineName}>
                      Add Past Medication
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowPastMedicineForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {pastMedicationFields.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground text-sm">No past medications added.</div>
              ) : (
                <div className="space-y-2">
                  {pastMedicationFields.map((field, index) => {
                    const medicine = masterData.data.medicines?.find(m => m.value === (field as any).medicine_name)
                    const dosage = masterData.data.dosages?.find(d => d.value === (field as any).type)
                    const eye = masterData.data.eyeSelection?.find(e => e.value === (field as any).eye)
                    
                    const medicineName = medicine?.label || ((field as any).medicine_name && !isUUID((field as any).medicine_name) ? (field as any).medicine_name : "N/A")
                    const eyeLabel = eye?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                    
                    return (
                      <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{medicineName}</div>
                          <div className="text-xs text-gray-500 space-x-2">
                            {dosage?.label && <span>• {dosage.label}</span>}
                            <span>• {eyeLabel}</span>
                            {(field as any).duration && <span>• {(field as any).duration}</span>}
                            {(field as any).advice && <span>• {(field as any).advice}</span>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePastMedication(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Past History Treatments Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Past History Treatments</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTreatmentForm(!showTreatmentForm)}
                >
                  {showTreatmentForm ? "Cancel" : "Add Past Treatment"}
                </Button>
              </div>

              {showTreatmentForm && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Treatment *</FormLabel>
                      <SearchableSelect
                        options={masterData.data.treatments || []}
                        value={newTreatment}
                        onValueChange={setNewTreatment}
                        placeholder="Select treatment"
                        searchPlaceholder="Search treatments..."
                        emptyText="No treatments found."
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Years</FormLabel>
                      <Input
                        placeholder="e.g., 2 years"
                        value={newTreatmentYears}
                        onChange={(e) => setNewTreatmentYears(e.target.value)}
                      />
                    </FormItem>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleAddPastTreatment} disabled={!newTreatment}>
                      Add Past Treatment
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowTreatmentForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {pastTreatmentFields.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground text-sm">No past treatments added.</div>
              ) : (
                <div className="space-y-2">
                  {pastTreatmentFields.map((field, index) => {
                    const treatment = masterData.data.treatments?.find(t => t.value === (field as any).treatment)
                    const treatmentName = treatment?.label || ((field as any).treatment && !isUUID((field as any).treatment) ? (field as any).treatment : "N/A")
                    
                    return (
                      <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{treatmentName}</div>
                          {(field as any).years && (
                            <div className="text-xs text-gray-500">{(field as any).years}</div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePastTreatment(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Surgeries Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Surgeries</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSurgeryForm(!showSurgeryForm)}
                >
                  {showSurgeryForm ? "Cancel" : "Add Surgery"}
                </Button>
              </div>

              {showSurgeryForm && (
                <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormItem>
                      <FormLabel>Eye *</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.eyeSelection || []}
                        value={newSurgeryEye}
                        onChange={setNewSurgeryEye}
                        placeholder="Select eye"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Surgery Name *</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.surgeries || []}
                        value={newSurgeryName}
                        onChange={setNewSurgeryName}
                        placeholder="Select surgery"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>Anesthesia</FormLabel>
                      <SimpleCombobox
                        options={masterData.data.anesthesiaTypes || []}
                        value={newSurgeryAnesthesia}
                        onChange={setNewSurgeryAnesthesia}
                        placeholder="Select anesthesia"
                      />
                    </FormItem>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleAddSurgery} disabled={!newSurgeryEye || !newSurgeryName}>
                      Add Surgery
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowSurgeryForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {surgeryFields.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground text-sm">No surgeries added.</div>
              ) : (
                <div className="space-y-2">
                  {surgeryFields.map((field, index) => {
                    const eye = masterData.data.eyeSelection?.find(e => e.value === (field as any).eye)
                    const surgery = masterData.data.surgeries?.find(s => s.value === (field as any).surgery_name)
                    const anesthesia = masterData.data.anesthesiaTypes?.find(a => a.value === (field as any).anesthesia)
                    
                    const eyeLabel = eye?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                    const surgeryName = surgery?.label || ((field as any).surgery_name && !isUUID((field as any).surgery_name) ? (field as any).surgery_name : "N/A")
                    
                    return (
                      <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{surgeryName}</div>
                          <div className="text-xs text-gray-500 space-x-2">
                            <span>{eyeLabel}</span>
                            {anesthesia?.label && <span>• {anesthesia.label}</span>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSurgery(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* General Treatments Section */}
            <div className="space-y-4 border-t pt-4">
              <FormField
                control={form.control}
                name="treatments"
                render={({ field }) => {
                  const treatmentOptions: MultiSelectOption[] = (masterData.data.treatments || []).map(t => ({
                    value: t.value,
                    label: t.label,
                  }))

                  return (
                    <FormItem>
                      <FormLabel>General Treatments</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={treatmentOptions}
                          value={field.value || []}
                          onValueChange={field.onChange}
                          placeholder="Select treatments..."
                          searchPlaceholder="Search treatments..."
                          emptyText="No treatments found."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "edit" ? "Update Record" : "Create Record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}











