"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi } from "@/lib/services/api"
import { useMasterData } from "@/hooks/use-master-data"
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
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fitnessCertSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  exam_date: z.string().min(1, "Date is required"),
  purpose: z.enum(["Employment", "Driving License", "School", "Sports"]),
  findings: z.string().optional(),
})

const medicalCertSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatment_period: z.string().optional(),
  recommendations: z.string().optional(),
})

const eyeTestCertSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  visual_acuity_right: z.string().optional(),
  visual_acuity_left: z.string().optional(),
  color_vision: z.string().optional(),
  driving_fitness: z.string().optional(),
})

const sickLeaveCertSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  illness: z.string().min(1, "Illness is required"),
  leave_from: z.string().min(1, "From date is required"),
  leave_to: z.string().min(1, "To date is required"),
  recommendations: z.string().optional(),
})

const customCertSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
})

interface CertificateFormsProps {
  children: React.ReactNode
}

export function CertificateForms({ children }: CertificateFormsProps) {
  const masterData = useMasterData()
  const [open, setOpen] = React.useState(false)
  const [certType, setCertType] = React.useState("fitness")
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)

  const fitnessForm = useForm<z.infer<typeof fitnessCertSchema>>({
    resolver: zodResolver(fitnessCertSchema),
    defaultValues: {
      patient_id: '',
      exam_date: new Date().toISOString().split("T")[0],
      purpose: "Employment",
      findings: '',
    },
  })

  const medicalForm = useForm<z.infer<typeof medicalCertSchema>>({
    resolver: zodResolver(medicalCertSchema),
    defaultValues: {
      patient_id: '',
      diagnosis: '',
      treatment_period: '',
      recommendations: '',
    },
  })

  const eyeTestForm = useForm<z.infer<typeof eyeTestCertSchema>>({
    resolver: zodResolver(eyeTestCertSchema),
    defaultValues: {
      patient_id: '',
      visual_acuity_right: '',
      visual_acuity_left: '',
      color_vision: '',
      driving_fitness: '',
    },
  })

  const sickLeaveForm = useForm<z.infer<typeof sickLeaveCertSchema>>({
    resolver: zodResolver(sickLeaveCertSchema),
    defaultValues: {
      patient_id: '',
      illness: '',
      leave_from: '',
      leave_to: '',
      recommendations: '',
    },
  })

  const customForm = useForm<z.infer<typeof customCertSchema>>({
    resolver: zodResolver(customCertSchema),
    defaultValues: {
      patient_id: '',
      title: '',
      content: '',
    },
  })

  // Load patients
  React.useEffect(() => {
    const loadPatients = async () => {
      if (!open) return
      setLoadingPatients(true)
      try {
        console.log("Fetching patients for certificates...")
        const response = await patientsApi.list({ limit: 1000 })
        console.log("Patients response:", response)
        if (response.success && response.data) {
          const patientOptions = response.data.map((patient) => ({
            value: patient.id,
            label: `${patient.full_name} (${patient.patient_id})`,
          }))
          console.log("Patient options:", patientOptions)
          setPatients(patientOptions)
        } else {
          console.error("Failed to load patients:", response.error)
        }
      } catch (error) {
        console.error("Error loading patients:", error)
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatients()
  }, [open])

  // Load master data for certificates
  React.useEffect(() => {
    if (open) {
      masterData.fetchMultiple(['visualAcuity', 'colorVisionTypes', 'drivingFitnessTypes', 'diagnosis'])
    }
  }, [open, masterData])

  function onSubmitFitness(values: z.infer<typeof fitnessCertSchema>) {
    console.log("Fitness:", values)
    setOpen(false)
  }

  function onSubmitMedical(values: z.infer<typeof medicalCertSchema>) {
    console.log("Medical:", values)
    setOpen(false)
  }

  function onSubmitEyeTest(values: z.infer<typeof eyeTestCertSchema>) {
    console.log("Eye Test:", values)
    setOpen(false)
  }

  function onSubmitSickLeave(values: z.infer<typeof sickLeaveCertSchema>) {
    console.log("Sick Leave:", values)
    setOpen(false)
  }

  function onSubmitCustom(values: z.infer<typeof customCertSchema>) {
    console.log("Custom:", values)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Certificate</DialogTitle>
          <DialogDescription>
            Create medical certificate using templates
          </DialogDescription>
        </DialogHeader>

        <Tabs value={certType} onValueChange={setCertType} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fitness">Fitness</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="eye">Eye Test</TabsTrigger>
            <TabsTrigger value="sick">Sick Leave</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="fitness">
            <Form {...fitnessForm}>
              <form onSubmit={fitnessForm.handleSubmit(onSubmitFitness)} className="space-y-4">
                <FormField
                  control={fitnessForm.control}
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
                  control={fitnessForm.control}
                  name="exam_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Examination Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={fitnessForm.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose *</FormLabel>
                      <Combobox value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <ComboboxTrigger>
                            <ComboboxValue placeholder="Select purpose" />
                          </ComboboxTrigger>
                        </FormControl>
                        <ComboboxContent>
                          <ComboboxItem value="Employment">Employment</ComboboxItem>
                          <ComboboxItem value="Driving License">Driving License</ComboboxItem>
                          <ComboboxItem value="School">School</ComboboxItem>
                          <ComboboxItem value="Sports">Sports</ComboboxItem>
                        </ComboboxContent>
                      </Combobox>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={fitnessForm.control}
                  name="findings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Findings</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Examination findings..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Generate Certificate</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="medical">
            <Form {...medicalForm}>
              <form onSubmit={medicalForm.handleSubmit(onSubmitMedical)} className="space-y-4">
                <FormField
                  control={medicalForm.control}
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
                  control={medicalForm.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={masterData.data.diagnosis || []}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select diagnosis"
                          searchPlaceholder="Search diagnosis..."
                          loading={masterData.loading.diagnosis}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={medicalForm.control}
                  name="treatment_period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment Period</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2 weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={medicalForm.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Doctor's recommendations..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Generate Certificate</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="eye">
            <Form {...eyeTestForm}>
              <form onSubmit={eyeTestForm.handleSubmit(onSubmitEyeTest)} className="space-y-4">
                <FormField
                  control={eyeTestForm.control}
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={eyeTestForm.control}
                    name="visual_acuity_right"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visual Acuity - Right</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={masterData.data.visualAcuity || []}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Select visual acuity"
                            searchPlaceholder="Search acuity..."
                            loading={masterData.loading.visualAcuity}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={eyeTestForm.control}
                    name="visual_acuity_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visual Acuity - Left</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={masterData.data.visualAcuity || []}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Select visual acuity"
                            searchPlaceholder="Search acuity..."
                            loading={masterData.loading.visualAcuity}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={eyeTestForm.control}
                  name="color_vision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Vision</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={masterData.data.colorVisionTypes || []}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select color vision"
                          searchPlaceholder="Search..."
                          loading={masterData.loading.colorVisionTypes}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={eyeTestForm.control}
                  name="driving_fitness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driving Fitness</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={masterData.data.drivingFitnessTypes || []}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select driving fitness"
                          searchPlaceholder="Search..."
                          loading={masterData.loading.drivingFitnessTypes}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Generate Certificate</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="sick">
            <Form {...sickLeaveForm}>
              <form onSubmit={sickLeaveForm.handleSubmit(onSubmitSickLeave)} className="space-y-4">
                <FormField
                  control={sickLeaveForm.control}
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
                  control={sickLeaveForm.control}
                  name="illness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Illness *</FormLabel>
                      <FormControl>
                        <Input placeholder="Illness description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={sickLeaveForm.control}
                    name="leave_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave From *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sickLeaveForm.control}
                    name="leave_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave To *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={sickLeaveForm.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Doctor's recommendations..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Generate Certificate</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="custom">
            <Form {...customForm}>
              <form onSubmit={customForm.handleSubmit(onSubmitCustom)} className="space-y-4">
                <FormField
                  control={customForm.control}
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
                  control={customForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Medical Clearance Certificate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={customForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Content *</FormLabel>
                      <FormControl>
                        <Textarea rows={8} placeholder="Certificate content..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Generate Certificate</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

