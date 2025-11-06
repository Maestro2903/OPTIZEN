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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const caseFormSchema = z.object({
  // 1. Register
  case_no: z.string().min(1, "Case number is required"),
  case_date: z.string().min(1, "Date is required"),
  patient_id: z.string().min(1, "Patient is required"),
  visit_type: z.enum(["First", "Follow-up-1", "Follow-up-2", "Follow-up-3"]),
  
  // 2. Case History
  chief_complaint: z.string().optional(),
  history_present_illness: z.string().optional(),
  
  // 3. Patient History
  past_history: z.string().optional(),
  treatment_history: z.string().optional(),
  family_history: z.string().optional(),
  
  // 4. Complaints
  complaints: z.string().optional(),
  
  // 5. Vision & Refraction
  vision_right_eye: z.string().optional(),
  vision_left_eye: z.string().optional(),
  refraction_right: z.string().optional(),
  refraction_left: z.string().optional(),
  
  // 6. Examination
  anterior_exam: z.string().optional(),
  posterior_exam: z.string().optional(),
  
  // 7. Blood Investigation
  blood_pressure: z.string().optional(),
  blood_sugar: z.string().optional(),
  
  // 8. Diagnosis
  diagnosis: z.string().optional(),
  
  // 9. Diagnostic Tests
  iop_right: z.string().optional(),
  iop_left: z.string().optional(),
  sac_test: z.string().optional(),
  
  // 10. Advice
  medicines: z.string().optional(),
  surgery_advised: z.string().optional(),
})

interface CaseFormProps {
  children: React.ReactNode
  caseData?: any
  mode?: "add" | "edit"
}

export function CaseForm({ children, caseData, mode = "add" }: CaseFormProps) {
  const [open, setOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState("register")

  const form = useForm<z.infer<typeof caseFormSchema>>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: caseData || {
      case_no: "OPT" + new Date().getFullYear() + "001",
      case_date: new Date().toISOString().split("T")[0],
      patient_id: "",
      visit_type: "First",
    },
  })

  function onSubmit(values: z.infer<typeof caseFormSchema>) {
    console.log(values)
    setOpen(false)
    form.reset()
  }

  const steps = [
    { id: "register", label: "Register", number: 1 },
    { id: "history", label: "Case History", number: 2 },
    { id: "patient-history", label: "Patient History", number: 3 },
    { id: "complaints", label: "Complaints", number: 4 },
    { id: "vision", label: "Vision", number: 5 },
    { id: "examination", label: "Examination", number: 6 },
    { id: "blood", label: "Blood Investigation", number: 7 },
    { id: "diagnosis", label: "Diagnosis", number: 8 },
    { id: "tests", label: "Tests", number: 9 },
    { id: "advice", label: "Advice", number: 10 },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Case" : "Add New Case"} - Multi-Step Registration</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update case information" : "Complete patient case registration with medical examination"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
              <TabsList className="h-auto grid grid-cols-5 lg:grid-cols-10 w-full p-1">
                {steps.map((step) => (
                  <TabsTrigger key={step.id} value={step.id} className="text-xs px-2 py-1.5">
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="min-h-[400px] mt-4">
                <TabsContent value="register" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">1. Register</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="case_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case No. *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="case_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patient_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PAT001">AARAV MEHTA</SelectItem>
                            <SelectItem value="PAT002">NISHANT KAREKAR</SelectItem>
                            <SelectItem value="PAT003">PRIYA NAIR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visit_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visit Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select visit type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="First">First Visit</SelectItem>
                            <SelectItem value="Follow-up-1">Follow-up 1</SelectItem>
                            <SelectItem value="Follow-up-2">Follow-up 2</SelectItem>
                            <SelectItem value="Follow-up-3">Follow-up 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">2. Case History</h3>
                <FormField
                  control={form.control}
                  name="chief_complaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chief Complaint</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Patient's main complaint..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="history_present_illness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>History of Present Illness</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Detailed history..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="patient-history" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">3. Patient History</h3>
                <FormField
                  control={form.control}
                  name="past_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Past Medical History</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Previous medical conditions..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="treatment_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Treatment History</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Previous treatments..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="family_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family History</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Family medical history..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="complaints" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">4. Complaints Form</h3>
                <FormField
                  control={form.control}
                  name="complaints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaints</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="List all complaints (Redness, Watering, Pain, Blurred Vision, etc.)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="vision" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">5. Vision & Refraction</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vision_right_eye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vision - Right Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="6/6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vision_left_eye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vision - Left Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="6/6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="refraction_right"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refraction - Right Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="Sph: -1.00, Cyl: -0.50, Axis: 90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refraction_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refraction - Left Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="Sph: -1.00, Cyl: -0.50, Axis: 90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="examination" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">6. Examination</h3>
                <FormField
                  control={form.control}
                  name="anterior_exam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anterior Segment Examination</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Lids, conjunctiva, cornea, anterior chamber, iris, lens..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="posterior_exam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posterior Segment Examination</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Vitreous, optic disc, macula, vessels, periphery..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="blood" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">7. Blood Investigation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="blood_pressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Pressure</FormLabel>
                        <FormControl>
                          <Input placeholder="120/80 mmHg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="blood_sugar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Sugar</FormLabel>
                        <FormControl>
                          <Input placeholder="100 mg/dL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="diagnosis" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">8. Diagnosis</h3>
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Final diagnosis..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="tests" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">9. Diagnostic Tests</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="iop_right"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IOP - Right Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="15 mmHg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iop_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IOP - Left Eye</FormLabel>
                        <FormControl>
                          <Input placeholder="15 mmHg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sac_test"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SAC Test</FormLabel>
                      <FormControl>
                        <Input placeholder="Regurgitation test results..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="advice" className="space-y-4 min-h-[350px]">
                <h3 className="font-semibold text-lg">10. Advice</h3>
                <FormField
                  control={form.control}
                  name="medicines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicines</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Prescribed medications..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surgery_advised"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surgery Advised</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Recommended surgical procedures..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentIndex = steps.findIndex((s) => s.id === currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1].id)
                  }
                }}
                disabled={currentStep === "register"}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                {currentStep !== "advice" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      const currentIndex = steps.findIndex((s) => s.id === currentStep)
                      if (currentIndex < steps.length - 1) {
                        setCurrentStep(steps[currentIndex + 1].id)
                      }
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{mode === "edit" ? "Update Case" : "Save Case"}</Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

