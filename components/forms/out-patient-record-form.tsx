"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
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
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi, outPatientRecordsApi, type Patient, type OutPatientRecord } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { calculateAge } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
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

const inputClassName = "h-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200"
const textareaClassName = "min-h-[80px] bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200"

const outPatientRecordSchema = z.object({
  receipt_no: z.string().min(1, "Receipt number is required"),
  uhd_no: z.string().optional(),
  record_date: z.string().min(1, "Date is required"),
  record_time: z.string().optional(),
  patient_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(0).max(150).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  pain_assessment_scale: z.number().int().min(0).max(10).optional(),
  complaints: z.string().optional(),
  diagnosis: z.string().optional(),
  tension: z.string().optional(),
  fundus: z.string().optional(),
  eye_examination: z.object({
    right_eye: z.object({
      lids: z.string().optional(),
      lacrimal_ducts: z.string().optional(),
      conjunctiva: z.string().optional(),
      cornea: z.string().optional(),
      anterior_chamber: z.string().optional(),
      iris: z.string().optional(),
      pupil: z.string().optional(),
      lens: z.string().optional(),
      ocular_movements: z.string().optional(),
    }).optional(),
    left_eye: z.object({
      lids: z.string().optional(),
      lacrimal_ducts: z.string().optional(),
      conjunctiva: z.string().optional(),
      cornea: z.string().optional(),
      anterior_chamber: z.string().optional(),
      iris: z.string().optional(),
      pupil: z.string().optional(),
      lens: z.string().optional(),
      ocular_movements: z.string().optional(),
    }).optional(),
  }).optional(),
  vision_assessment: z.object({
    right_eye: z.object({
      vision_without_glasses_dv: z.string().optional(),
      vision_without_glasses_nv: z.string().optional(),
      vision_with_glasses_dv: z.string().optional(),
      vision_with_glasses_nv: z.string().optional(),
    }).optional(),
    left_eye: z.object({
      vision_without_glasses_dv: z.string().optional(),
      vision_without_glasses_nv: z.string().optional(),
      vision_with_glasses_dv: z.string().optional(),
      vision_with_glasses_nv: z.string().optional(),
    }).optional(),
  }).optional(),
  history: z.object({
    dm: z.boolean().optional(),
    htn: z.boolean().optional(),
    previous_surgery: z.boolean().optional(),
    vaccination: z.boolean().optional(),
    others: z.string().optional(),
  }).optional(),
  proposed_plan: z.string().optional(),
  rx: z.string().optional(),
  urine_albumin: z.string().optional(),
  urine_sugar: z.string().optional(),
  bp: z.string().optional(),
  weight: z.number().positive().optional(),
})

type OutPatientRecordFormValues = z.infer<typeof outPatientRecordSchema>

interface OutPatientRecordFormProps {
  children?: React.ReactNode
  recordData?: OutPatientRecord
  mode?: "create" | "edit"
  onSubmit?: (data: OutPatientRecordFormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function OutPatientRecordForm({
  children,
  recordData,
  mode = "create",
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: OutPatientRecordFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : open
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setOpen

  const form = useForm<OutPatientRecordFormValues>({
    resolver: zodResolver(outPatientRecordSchema),
    defaultValues: {
      receipt_no: recordData?.receipt_no || "",
      uhd_no: recordData?.uhd_no || "",
      record_date: recordData?.record_date || new Date().toISOString().split('T')[0],
      record_time: recordData?.record_time || "",
      patient_id: recordData?.patient_id || "",
      name: recordData?.name || "",
      age: recordData?.age || undefined,
      sex: recordData?.sex || undefined,
      address: recordData?.address || "",
      pain_assessment_scale: recordData?.pain_assessment_scale || undefined,
      complaints: recordData?.complaints || "",
      diagnosis: recordData?.diagnosis || "",
      tension: recordData?.tension || "",
      fundus: recordData?.fundus || "",
      eye_examination: recordData?.eye_examination || {
        right_eye: {},
        left_eye: {},
      },
      vision_assessment: recordData?.vision_assessment || {
        right_eye: {},
        left_eye: {},
      },
      history: recordData?.history || {
        dm: false,
        htn: false,
        previous_surgery: false,
        vaccination: false,
        others: "",
      },
      proposed_plan: recordData?.proposed_plan || "",
      rx: recordData?.rx || "",
      urine_albumin: recordData?.urine_albumin || "",
      urine_sugar: recordData?.urine_sugar || "",
      bp: recordData?.bp || "",
      weight: recordData?.weight || undefined,
    },
  })

  // Load patients when dialog opens
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
          title: "Failed to load patients",
          description: "Please try again",
          variant: "destructive",
        })
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatients()
  }, [isOpen, toast])

  // Load patient details when patient_id changes
  React.useEffect(() => {
    const loadPatientDetails = async () => {
      const patientId = form.watch('patient_id')
      if (!patientId) {
        setSelectedPatient(null)
        return
      }

      try {
        const response = await patientsApi.get(patientId)
        if (response.success && response.data) {
          const patient = response.data
          setSelectedPatient(patient)
          
          // Auto-populate form fields
          form.setValue('name', patient.full_name)
          form.setValue('sex', patient.gender as 'male' | 'female' | 'other' | undefined)
          form.setValue('address', patient.address || '')
          
          // Calculate age from date of birth
          if (patient.date_of_birth) {
            const age = calculateAge(patient.date_of_birth)
            if (age !== null) {
              form.setValue('age', age)
            }
          }
        }
      } catch (error) {
        console.error("Error loading patient details:", error)
      }
    }
    loadPatientDetails()
  }, [form.watch('patient_id'), form])

  const handleSubmit = async (values: OutPatientRecordFormValues) => {
    setLoading(true)
    try {
      if (onSubmit) {
        await onSubmit(values)
      } else {
        if (mode === "create") {
          const response = await outPatientRecordsApi.create(values as any)
          if (response.success) {
            toast({
              title: "Success",
              description: "Out patient record created successfully",
            })
            setIsOpen(false)
            form.reset()
          } else {
            throw new Error(response.error || "Failed to create record")
          }
        } else if (recordData?.id) {
          const response = await outPatientRecordsApi.update(recordData.id, values as any)
          if (response.success) {
            toast({
              title: "Success",
              description: "Out patient record updated successfully",
            })
            setIsOpen(false)
          } else {
            throw new Error(response.error || "Failed to update record")
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save record",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const painScaleOptions = [
    { value: 0, label: "0: No Pain" },
    { value: 1, label: "1-3: Mild" },
    { value: 2, label: "1-3: Mild" },
    { value: 3, label: "1-3: Mild" },
    { value: 4, label: "4-6: Moderate" },
    { value: 5, label: "4-6: Moderate" },
    { value: 6, label: "4-6: Moderate" },
    { value: 7, label: "7-9: Severe" },
    { value: 8, label: "7-9: Severe" },
    { value: 9, label: "7-9: Severe" },
    { value: 10, label: "10: Worst Pain" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onCloseButtonClickOnly={true}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Out Patient Record" : "Edit Out Patient Record"}
          </DialogTitle>
          <DialogDescription>
            Fill in all the required information for the out patient record
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Patient Information</h3>
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Patient *</FormLabel>
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
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">OUT PATIENT RECORD</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="receipt_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt No. *</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uhd_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UHD No.</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} />
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
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className={inputClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="record_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className={inputClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className={inputClassName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <FormControl>
                        <Combobox
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <ComboboxTrigger className={inputClassName}>
                            <ComboboxValue placeholder="Select" />
                          </ComboboxTrigger>
                          <ComboboxContent>
                            <ComboboxItem value="male">Male</ComboboxItem>
                            <ComboboxItem value="female">Female</ComboboxItem>
                            <ComboboxItem value="other">Other</ComboboxItem>
                          </ComboboxContent>
                        </Combobox>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Pain Assessment Scale */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">PAIN ASSESSMENT SCALE (0–10)</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  <p>0: No Pain | 1–3: Mild | 4–6: Moderate | 7–9: Severe | 10: Worst Pain</p>
                </div>
                <FormField
                  control={form.control}
                  name="pain_assessment_scale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pain Level</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger className={inputClassName}>
                            <SelectValue placeholder="Select pain level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {painScaleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Complaints and Diagnosis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="complaints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complaints</FormLabel>
                    <FormControl>
                      <Textarea {...field} className={textareaClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Textarea {...field} className={textareaClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Eye Examination Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Eye Examination</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Structure</th>
                      <th className="border border-gray-300 p-2 text-left">Right Eye</th>
                      <th className="border border-gray-300 p-2 text-left">Left Eye</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['lids', 'lacrimal_ducts', 'conjunctiva', 'cornea', 'anterior_chamber', 'iris', 'pupil', 'lens', 'ocular_movements'].map((structure) => (
                      <tr key={structure}>
                        <td className="border border-gray-300 p-2 font-medium capitalize">
                          {structure.replace('_', ' ')}
                        </td>
                        <td className="border border-gray-300 p-2">
                          <FormField
                            control={form.control}
                            name={`eye_examination.right_eye.${structure as any}`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                className="h-9 border-0 focus:ring-1"
                                placeholder=""
                              />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <FormField
                            control={form.control}
                            name={`eye_examination.left_eye.${structure as any}`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                className="h-9 border-0 focus:ring-1"
                                placeholder=""
                              />
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Vision Assessment Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vision Assessment</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Test</th>
                      <th className="border border-gray-300 p-2 text-left">Right Eye</th>
                      <th className="border border-gray-300 p-2 text-left">Left Eye</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Vision without Glasses – D.V.</td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.right_eye.vision_without_glasses_dv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.left_eye.vision_without_glasses_dv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Vision without Glasses – N.V.</td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.right_eye.vision_without_glasses_nv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.left_eye.vision_without_glasses_nv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Vision with Glasses – D.V.</td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.right_eye.vision_with_glasses_dv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.left_eye.vision_with_glasses_dv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Vision with Glasses – N.V.</td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.right_eye.vision_with_glasses_nv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <FormField
                          control={form.control}
                          name="vision_assessment.left_eye.vision_with_glasses_nv"
                          render={({ field }) => (
                            <Input {...field} className="h-9 border-0 focus:ring-1" />
                          )}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Tension and Fundus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tension"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tension</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fundus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fundus</FormLabel>
                    <FormControl>
                      <Textarea {...field} className={textareaClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* History Checkboxes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">History</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="history.dm"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">DM</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="history.htn"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">HTN</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="history.previous_surgery"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Previous Surgery</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="history.vaccination"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Vaccination (Paediatrics)</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="history.others"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Others</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} placeholder="Specify..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Proposed Plan and Rx */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proposed_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Plan</FormLabel>
                    <FormControl>
                      <Textarea {...field} className={textareaClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rx"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rx</FormLabel>
                    <FormControl>
                      <Textarea {...field} className={textareaClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Urine Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Urine Test</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="urine_albumin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Albumin</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="urine_sugar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sugar</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Vitals */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>B.P.</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClassName} placeholder="e.g., 120/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className={inputClassName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "create" ? "Create Record" : "Update Record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

