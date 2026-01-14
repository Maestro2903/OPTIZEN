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
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { SimpleCombobox } from "@/components/ui/simple-combobox"
import { patientsApi, visionRecordsApi, type Patient, type VisionRecord } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { useMasterData } from "@/hooks/use-master-data"
import { X } from "lucide-react"

const inputClassName = "h-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200"

// Vision Record Schema
const visionRecordSchema = z.object({
  patient_id: z.string().optional(),
  record_date: z.string().min(1, "Record date is required"),
  record_time: z.string().optional(),
  record_number: z.string().min(1, "Record number is required"),
  
  // Vision Data
  visual_acuity_unaided_right: z.string().optional(),
  visual_acuity_unaided_left: z.string().optional(),
  pinhole_right: z.string().optional(),
  pinhole_left: z.string().optional(),
  visual_acuity_aided_right: z.string().optional(),
  visual_acuity_aided_left: z.string().optional(),
  near_visual_right: z.string().optional(),
  near_visual_left: z.string().optional(),
  
  // Refraction - Distant
  refraction_distant_sph_right: z.string().optional(),
  refraction_distant_cyl_right: z.string().optional(),
  refraction_distant_axis_right: z.string().optional(),
  refraction_distant_va_right: z.string().optional(),
  refraction_distant_sph_left: z.string().optional(),
  refraction_distant_cyl_left: z.string().optional(),
  refraction_distant_axis_left: z.string().optional(),
  refraction_distant_va_left: z.string().optional(),
  
  // Refraction - Near
  refraction_near_sph_right: z.string().optional(),
  refraction_near_cyl_right: z.string().optional(),
  refraction_near_axis_right: z.string().optional(),
  refraction_near_va_right: z.string().optional(),
  refraction_near_sph_left: z.string().optional(),
  refraction_near_cyl_left: z.string().optional(),
  refraction_near_axis_left: z.string().optional(),
  refraction_near_va_left: z.string().optional(),
  
  // Refraction - PG
  refraction_pg_sph_right: z.string().optional(),
  refraction_pg_cyl_right: z.string().optional(),
  refraction_pg_axis_right: z.string().optional(),
  refraction_pg_va_right: z.string().optional(),
  refraction_pg_sph_left: z.string().optional(),
  refraction_pg_cyl_left: z.string().optional(),
  refraction_pg_axis_left: z.string().optional(),
  refraction_pg_va_left: z.string().optional(),
  
  refraction_purpose: z.string().optional(),
  refraction_quality: z.string().optional(),
  refraction_remark: z.string().optional(),
  
  // Examination - Anterior Segment
  eyelids_right: z.string().optional(),
  eyelids_left: z.string().optional(),
  conjunctiva_right: z.string().optional(),
  conjunctiva_left: z.string().optional(),
  cornea_right: z.string().optional(),
  cornea_left: z.string().optional(),
  anterior_chamber_right: z.string().optional(),
  anterior_chamber_left: z.string().optional(),
  iris_right: z.string().optional(),
  iris_left: z.string().optional(),
  lens_right: z.string().optional(),
  lens_left: z.string().optional(),
  anterior_remarks: z.string().optional(),
  
  // Examination - Posterior Segment
  vitreous_right: z.string().optional(),
  vitreous_left: z.string().optional(),
  disc_right: z.string().optional(),
  disc_left: z.string().optional(),
  retina_right: z.string().optional(),
  retina_left: z.string().optional(),
  posterior_remarks: z.string().optional(),
  
  // Tests
  iop_right: z.string().optional(),
  iop_left: z.string().optional(),
  sac_test_right: z.string().optional(),
  sac_test_left: z.string().optional(),
  
  // Blood Investigation
  blood_pressure: z.string().optional(),
  blood_sugar: z.string().optional(),
  blood_tests: z.array(z.string()).optional(),
})

type VisionRecordFormValues = z.infer<typeof visionRecordSchema>

interface VisionRecordFormProps {
  children?: React.ReactNode
  recordData?: VisionRecord
  mode?: "create" | "edit"
  onSubmit?: (data: VisionRecordFormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function VisionRecordForm({
  children,
  recordData,
  mode = "create",
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: VisionRecordFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const masterData = useMasterData()

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : open
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setOpen

  // Extract vision and examination data from recordData
  const visionData = recordData?.vision_data || {}
  const examinationData = recordData?.examination_data || {}

  const form = useForm<VisionRecordFormValues>({
    resolver: zodResolver(visionRecordSchema),
    defaultValues: {
      patient_id: recordData?.patient_id || "",
      record_date: recordData?.record_date || new Date().toISOString().split('T')[0],
      record_time: recordData?.record_time || "",
      record_number: recordData?.record_number || "",
      
      // Vision Data
      visual_acuity_unaided_right: visionData.unaided?.right || "",
      visual_acuity_unaided_left: visionData.unaided?.left || "",
      pinhole_right: visionData.pinhole?.right || "",
      pinhole_left: visionData.pinhole?.left || "",
      visual_acuity_aided_right: visionData.aided?.right || "",
      visual_acuity_aided_left: visionData.aided?.left || "",
      near_visual_right: visionData.near?.right || "",
      near_visual_left: visionData.near?.left || "",
      
      // Refraction - Distant
      refraction_distant_sph_right: examinationData.refraction?.distant?.sph_right || "",
      refraction_distant_cyl_right: examinationData.refraction?.distant?.cyl_right || "",
      refraction_distant_axis_right: examinationData.refraction?.distant?.axis_right || "",
      refraction_distant_va_right: examinationData.refraction?.distant?.va_right || "",
      refraction_distant_sph_left: examinationData.refraction?.distant?.sph_left || "",
      refraction_distant_cyl_left: examinationData.refraction?.distant?.cyl_left || "",
      refraction_distant_axis_left: examinationData.refraction?.distant?.axis_left || "",
      refraction_distant_va_left: examinationData.refraction?.distant?.va_left || "",
      
      // Refraction - Near
      refraction_near_sph_right: examinationData.refraction?.near?.sph_right || "",
      refraction_near_cyl_right: examinationData.refraction?.near?.cyl_right || "",
      refraction_near_axis_right: examinationData.refraction?.near?.axis_right || "",
      refraction_near_va_right: examinationData.refraction?.near?.va_right || "",
      refraction_near_sph_left: examinationData.refraction?.near?.sph_left || "",
      refraction_near_cyl_left: examinationData.refraction?.near?.cyl_left || "",
      refraction_near_axis_left: examinationData.refraction?.near?.axis_left || "",
      refraction_near_va_left: examinationData.refraction?.near?.va_left || "",
      
      // Refraction - PG
      refraction_pg_sph_right: examinationData.refraction?.pg?.sph_right || "",
      refraction_pg_cyl_right: examinationData.refraction?.pg?.cyl_right || "",
      refraction_pg_axis_right: examinationData.refraction?.pg?.axis_right || "",
      refraction_pg_va_right: examinationData.refraction?.pg?.va_right || "",
      refraction_pg_sph_left: examinationData.refraction?.pg?.sph_left || "",
      refraction_pg_cyl_left: examinationData.refraction?.pg?.cyl_left || "",
      refraction_pg_axis_left: examinationData.refraction?.pg?.axis_left || "",
      refraction_pg_va_left: examinationData.refraction?.pg?.va_left || "",
      
      refraction_purpose: examinationData.refraction?.purpose || "",
      refraction_quality: examinationData.refraction?.quality || "",
      refraction_remark: examinationData.refraction?.remark || "",
      
      // Anterior Segment
      eyelids_right: examinationData.anterior_segment?.eyelids_right || "",
      eyelids_left: examinationData.anterior_segment?.eyelids_left || "",
      conjunctiva_right: examinationData.anterior_segment?.conjunctiva_right || "",
      conjunctiva_left: examinationData.anterior_segment?.conjunctiva_left || "",
      cornea_right: examinationData.anterior_segment?.cornea_right || "",
      cornea_left: examinationData.anterior_segment?.cornea_left || "",
      anterior_chamber_right: examinationData.anterior_segment?.anterior_chamber_right || "",
      anterior_chamber_left: examinationData.anterior_segment?.anterior_chamber_left || "",
      iris_right: examinationData.anterior_segment?.iris_right || "",
      iris_left: examinationData.anterior_segment?.iris_left || "",
      lens_right: examinationData.anterior_segment?.lens_right || "",
      lens_left: examinationData.anterior_segment?.lens_left || "",
      anterior_remarks: examinationData.anterior_segment?.remarks || "",
      
      // Posterior Segment
      vitreous_right: examinationData.posterior_segment?.vitreous_right || "",
      vitreous_left: examinationData.posterior_segment?.vitreous_left || "",
      disc_right: examinationData.posterior_segment?.disc_right || "",
      disc_left: examinationData.posterior_segment?.disc_left || "",
      retina_right: examinationData.posterior_segment?.retina_right || "",
      retina_left: examinationData.posterior_segment?.retina_left || "",
      posterior_remarks: examinationData.posterior_segment?.remarks || "",
      
      // Tests
      iop_right: examinationData.tests?.iop?.right?.id || "",
      iop_left: examinationData.tests?.iop?.left?.id || "",
      sac_test_right: typeof examinationData.tests?.sac_test === 'object' ? examinationData.tests.sac_test?.right || "" : "",
      sac_test_left: typeof examinationData.tests?.sac_test === 'object' ? examinationData.tests.sac_test?.left || "" : "",
      
      // Blood Investigation
      blood_pressure: examinationData.blood_investigation?.blood_pressure || "",
      blood_sugar: examinationData.blood_investigation?.blood_sugar || "",
      blood_tests: examinationData.blood_investigation?.blood_tests || [],
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

  const handleSubmit = async (values: VisionRecordFormValues) => {
    setLoading(true)
    try {
      // Transform form data to API format
      const visionData = {
        unaided: {
          right: values.visual_acuity_unaided_right || undefined,
          left: values.visual_acuity_unaided_left || undefined,
        },
        pinhole: {
          right: values.pinhole_right || undefined,
          left: values.pinhole_left || undefined,
        },
        aided: {
          right: values.visual_acuity_aided_right || undefined,
          left: values.visual_acuity_aided_left || undefined,
        },
        near: {
          right: values.near_visual_right || undefined,
          left: values.near_visual_left || undefined,
        },
      }

      const examinationData = {
        refraction: {
          distant: {
            sph_right: values.refraction_distant_sph_right || undefined,
            cyl_right: values.refraction_distant_cyl_right || undefined,
            axis_right: values.refraction_distant_axis_right || undefined,
            va_right: values.refraction_distant_va_right || undefined,
            sph_left: values.refraction_distant_sph_left || undefined,
            cyl_left: values.refraction_distant_cyl_left || undefined,
            axis_left: values.refraction_distant_axis_left || undefined,
            va_left: values.refraction_distant_va_left || undefined,
          },
          near: {
            sph_right: values.refraction_near_sph_right || undefined,
            cyl_right: values.refraction_near_cyl_right || undefined,
            axis_right: values.refraction_near_axis_right || undefined,
            va_right: values.refraction_near_va_right || undefined,
            sph_left: values.refraction_near_sph_left || undefined,
            cyl_left: values.refraction_near_cyl_left || undefined,
            axis_left: values.refraction_near_axis_left || undefined,
            va_left: values.refraction_near_va_left || undefined,
          },
          pg: {
            sph_right: values.refraction_pg_sph_right || undefined,
            cyl_right: values.refraction_pg_cyl_right || undefined,
            axis_right: values.refraction_pg_axis_right || undefined,
            va_right: values.refraction_pg_va_right || undefined,
            sph_left: values.refraction_pg_sph_left || undefined,
            cyl_left: values.refraction_pg_cyl_left || undefined,
            axis_left: values.refraction_pg_axis_left || undefined,
            va_left: values.refraction_pg_va_left || undefined,
          },
          purpose: values.refraction_purpose || undefined,
          quality: values.refraction_quality || undefined,
          remark: values.refraction_remark || undefined,
        },
        anterior_segment: {
          eyelids_right: values.eyelids_right || undefined,
          eyelids_left: values.eyelids_left || undefined,
          conjunctiva_right: values.conjunctiva_right || undefined,
          conjunctiva_left: values.conjunctiva_left || undefined,
          cornea_right: values.cornea_right || undefined,
          cornea_left: values.cornea_left || undefined,
          anterior_chamber_right: values.anterior_chamber_right || undefined,
          anterior_chamber_left: values.anterior_chamber_left || undefined,
          iris_right: values.iris_right || undefined,
          iris_left: values.iris_left || undefined,
          lens_right: values.lens_right || undefined,
          lens_left: values.lens_left || undefined,
          remarks: values.anterior_remarks || undefined,
        },
        posterior_segment: {
          vitreous_right: values.vitreous_right || undefined,
          vitreous_left: values.vitreous_left || undefined,
          disc_right: values.disc_right || undefined,
          disc_left: values.disc_left || undefined,
          retina_right: values.retina_right || undefined,
          retina_left: values.retina_left || undefined,
          remarks: values.posterior_remarks || undefined,
        },
        tests: {
          iop: values.iop_right || values.iop_left ? {
            right: values.iop_right ? { id: values.iop_right, value: masterData.data.iopRanges?.find((r: any) => r.value === values.iop_right)?.label || values.iop_right } : undefined,
            left: values.iop_left ? { id: values.iop_left, value: masterData.data.iopRanges?.find((r: any) => r.value === values.iop_left)?.label || values.iop_left } : undefined
          } : undefined,
          sac_test: values.sac_test_right || values.sac_test_left ? {
            right: values.sac_test_right || undefined,
            left: values.sac_test_left || undefined
          } : undefined
        },
        blood_investigation: {
          blood_pressure: values.blood_pressure || undefined,
          blood_sugar: values.blood_sugar || undefined,
          blood_tests: values.blood_tests || []
        }
      }

      const recordData = {
        patient_id: values.patient_id || null,
        record_date: values.record_date,
        record_time: values.record_time || null,
        record_number: values.record_number,
        vision_data: visionData,
        examination_data: examinationData,
      }

      if (onSubmit) {
        await onSubmit(recordData as any)
      } else {
        if (mode === "create") {
          const response = await visionRecordsApi.create(recordData as any)
          if (response.success) {
            toast({
              title: "Success",
              description: "Vision record created successfully",
            })
            setIsOpen(false)
            form.reset()
          } else {
            throw new Error(response.error || "Failed to create record")
          }
        } else if (mode === "edit" && recordData && recordData.id) {
          const response = await visionRecordsApi.update(recordData.id, recordData as any)
          if (response.success) {
            toast({
              title: "Success",
              description: "Vision record updated successfully",
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onCloseButtonClickOnly={true}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Vision Record" : "Edit Vision Record"}
          </DialogTitle>
          <DialogDescription>
            Fill in vision and examination data for the patient
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
                    <FormLabel>Select Patient</FormLabel>
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

            {/* Record Info */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="record_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Record Number *</FormLabel>
                    <FormControl>
                      <Input {...field} className={inputClassName} />
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
                    <FormLabel>Record Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className={inputClassName} />
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
                      <Input type="time" {...field} className={inputClassName} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Vision Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vision & Refraction</h3>
              
              {/* Vision Header */}
              <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                <div></div>
                <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
              </div>

              {/* Unaided Vision */}
              <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                <div className="text-right text-xs font-bold text-gray-500 uppercase">UNAIDED (VP)</div>
                <FormField control={form.control} name="visual_acuity_unaided_right" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
                <FormField control={form.control} name="visual_acuity_unaided_left" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
              </div>

              {/* Pinhole */}
              <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                <div className="text-right text-xs font-bold text-gray-500 uppercase">PIN-HOLE (VP)</div>
                <FormField control={form.control} name="pinhole_right" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
                <FormField control={form.control} name="pinhole_left" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
              </div>

              {/* Aided Vision */}
              <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                <div className="text-right text-xs font-bold text-gray-500 uppercase">AIDED (VP)</div>
                <FormField control={form.control} name="visual_acuity_aided_right" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
                <FormField control={form.control} name="visual_acuity_aided_left" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
              </div>

              {/* Near Vision */}
              <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                <div className="text-right text-xs font-bold text-gray-500 uppercase">NEAR VISUAL</div>
                <FormField control={form.control} name="near_visual_right" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
                <FormField control={form.control} name="near_visual_left" render={({ field }) => (
                  <SimpleCombobox
                    options={masterData.data.visualAcuity || []}
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Select VP"
                    className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                  />
                )} />
              </div>

              <Separator />

              {/* Refraction Section */}
              <div className="space-y-3">
                <h4 className="font-semibold text-md">REFRACTION</h4>
                
                {/* Sub-header for SPH, CYL, AXIS, VA */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div></div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium text-gray-600">
                    <div>SPH</div>
                    <div>CYL</div>
                    <div>AXIS</div>
                    <div>VA</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium text-gray-600">
                    <div>SPH</div>
                    <div>CYL</div>
                    <div>AXIS</div>
                    <div>VA</div>
                  </div>
                </div>

                {/* Distant */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">DISTANT</div>
                  <div className="grid grid-cols-4 gap-2">
                    <FormField control={form.control} name="refraction_distant_sph_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_distant_cyl_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_distant_axis_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_distant_va_right" render={({ field }) => (
                      <SimpleCombobox
                        options={masterData.data.visualAcuity || []}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="VP"
                        className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                      />
                    )} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <FormField control={form.control} name="refraction_distant_sph_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_distant_cyl_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_distant_axis_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_distant_va_left" render={({ field }) => (
                      <SimpleCombobox
                        options={masterData.data.visualAcuity || []}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="VP"
                        className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                      />
                    )} />
                  </div>
                </div>

                {/* Near */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">NEAR</div>
                  <div className="grid grid-cols-4 gap-2">
                    <FormField control={form.control} name="refraction_near_sph_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_near_cyl_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_near_axis_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_near_va_right" render={({ field }) => (
                      <SimpleCombobox
                        options={masterData.data.visualAcuity || []}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="VP"
                        className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                      />
                    )} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <FormField control={form.control} name="refraction_near_sph_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_near_cyl_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_near_axis_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_near_va_left" render={({ field }) => (
                      <SimpleCombobox
                        options={masterData.data.visualAcuity || []}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="VP"
                        className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                      />
                    )} />
                  </div>
                </div>

                {/* PG */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">PG</div>
                  <div className="grid grid-cols-4 gap-2">
                    <FormField control={form.control} name="refraction_pg_sph_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_pg_cyl_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_pg_axis_right" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_pg_va_right" render={({ field }) => (
                      <SimpleCombobox
                        options={masterData.data.visualAcuity || []}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="VP"
                        className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                      />
                    )} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <FormField control={form.control} name="refraction_pg_sph_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -2.25" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_pg_cyl_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. -0.5" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_pg_axis_left" render={({ field }) => (
                      <FormItem><FormControl><Input placeholder="e.g. 180" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="refraction_pg_va_left" render={({ field }) => (
                      <SimpleCombobox
                        options={masterData.data.visualAcuity || []}
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="VP"
                        className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                      />
                    )} />
                  </div>
                </div>

                {/* Purpose, Quality, Remark */}
                <div className="grid grid-cols-[150px_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">PURPOSE</div>
                  <FormField control={form.control} name="refraction_purpose" render={({ field }) => (
                    <FormItem><FormControl><Input placeholder="Constant Use" className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">QUALITY</div>
                  <FormField control={form.control} name="refraction_quality" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">REMARK</div>
                  <FormField control={form.control} name="refraction_remark" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Examination Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Examination</h3>
              
              {/* Anterior Segment */}
              <div className="space-y-3">
                <h4 className="font-semibold text-md">ANTERIOR SEGMENT</h4>
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div></div>
                  <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                  <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
                </div>

                {/* Eyelids */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">EYELIDS</div>
                  <FormField control={form.control} name="eyelids_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="eyelids_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Conjunctiva */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">CONJUNCTIVA</div>
                  <FormField control={form.control} name="conjunctiva_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="conjunctiva_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Cornea */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">CORNEA</div>
                  <FormField control={form.control} name="cornea_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="cornea_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Anterior Chamber */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">ANTERIOR CHAMBER</div>
                  <FormField control={form.control} name="anterior_chamber_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="anterior_chamber_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Iris */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">IRIS</div>
                  <FormField control={form.control} name="iris_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="iris_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Lens */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">LENS</div>
                  <FormField control={form.control} name="lens_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="lens_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Anterior Remarks */}
                <div className="grid grid-cols-[150px_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">REMARKS</div>
                  <FormField control={form.control} name="anterior_remarks" render={({ field }) => (
                    <FormItem><FormControl><Textarea className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Posterior Segment */}
              <div className="space-y-3">
                <h4 className="font-semibold text-md">POSTERIOR SEGMENT</h4>
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div></div>
                  <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                  <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
                </div>

                {/* Vitreous */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">VITREOUS</div>
                  <FormField control={form.control} name="vitreous_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="vitreous_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Disc */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">DISC</div>
                  <FormField control={form.control} name="disc_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="disc_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Retina */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">RETINA</div>
                  <FormField control={form.control} name="retina_right" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="retina_left" render={({ field }) => (
                    <FormItem><FormControl><Input className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                {/* Posterior Remarks */}
                <div className="grid grid-cols-[150px_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">REMARKS</div>
                  <FormField control={form.control} name="posterior_remarks" render={({ field }) => (
                    <FormItem><FormControl><Textarea className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              {/* Tests */}
              <div className="space-y-3">
                <h4 className="font-semibold text-md">TESTS</h4>
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div></div>
                  <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">RIGHT EYE (OD)</div>
                  <div className="text-center text-xs font-bold text-gray-900 bg-gray-50 py-2 rounded">LEFT EYE (OS)</div>
                </div>

                {/* IOP */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">IOP</div>
                  <FormField control={form.control} name="iop_right" render={({ field }) => (
                    <SimpleCombobox
                      options={masterData.data.iopRanges || []}
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select IOP"
                      className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                    />
                  )} />
                  <FormField control={form.control} name="iop_left" render={({ field }) => (
                    <SimpleCombobox
                      options={masterData.data.iopRanges || []}
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select IOP"
                      className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                    />
                  )} />
                </div>

                {/* SAC Test */}
                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 items-center">
                  <div className="text-right text-xs font-bold text-gray-500 uppercase">SAC TEST</div>
                  <FormField control={form.control} name="sac_test_right" render={({ field }) => (
                    <SimpleCombobox
                      options={masterData.data.sacStatus || []}
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select SAC"
                      className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                    />
                  )} />
                  <FormField control={form.control} name="sac_test_left" render={({ field }) => (
                    <SimpleCombobox
                      options={masterData.data.sacStatus || []}
                      value={field.value || ""}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Select SAC"
                      className="border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm"
                    />
                  )} />
                </div>
              </div>

              <Separator />

              {/* Blood Investigation */}
              <div className="space-y-3">
                <h4 className="font-semibold text-md">BLOOD INVESTIGATION</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="blood_pressure" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Pressure</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 120/80" className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="blood_sugar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Sugar</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 100 mg/dL" className={inputClassName} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {/* Blood Tests - simplified for now, can be enhanced with multi-select */}
                <FormField control={form.control} name="blood_tests" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Tests</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter blood tests (comma separated)" 
                        className={inputClassName}
                        value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                        onChange={(e) => {
                          const tests = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                          field.onChange(tests)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
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

