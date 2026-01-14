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
import { bloodAdviceApi, type BloodAdviceRecord } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { useMasterData } from "@/hooks/use-master-data"
import { patientsApi } from "@/lib/services/api"

const inputClassName = "h-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200"

// Blood test options fallback
const BLOOD_TEST_OPTIONS = [
  "CBC", "BT", "CT", "PT-INR", "RBS", "FBS", "PP2BS", "HIV", "HBSAG", "HCV",
  "ANA-PROFILE", "P-ANCA", "C-ANCA", "CSR", "CRP", "R.A.FACTOR",
  "T3 , T4, TSH, ANTI TPO", "S CREATININE", "S. SODIUM LEVELS"
]

// Blood Advice Schema
const bloodAdviceSchema = z.object({
  patient_id: z.string().optional(),
  record_date: z.string().min(1, "Record date is required"),
  record_time: z.string().optional(),
  record_number: z.string().min(1, "Record number is required"),
  
  // Blood Investigation
  blood_sugar: z.string().optional(),
  blood_tests: z.array(z.string()).optional(),
  
  // Advice
  advice_remarks: z.string().optional(),
})

type BloodAdviceFormValues = z.infer<typeof bloodAdviceSchema>

interface BloodAdviceFormProps {
  children?: React.ReactNode
  recordData?: BloodAdviceRecord
  mode?: "create" | "edit"
  onSubmit?: (data: BloodAdviceFormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BloodAdviceForm({
  children,
  recordData,
  mode = "create",
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: BloodAdviceFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const masterData = useMasterData()

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : open
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setOpen

  // Extract blood investigation data from recordData
  const bloodInvestigationData = recordData?.blood_investigation_data || {}

  const form = useForm<BloodAdviceFormValues>({
    resolver: zodResolver(bloodAdviceSchema),
    defaultValues: {
      patient_id: recordData?.patient_id || "",
      record_date: recordData?.record_date || new Date().toISOString().split('T')[0],
      record_time: recordData?.record_time || "",
      record_number: recordData?.record_number || "",
      
      // Blood Investigation
      blood_sugar: bloodInvestigationData.blood_sugar || "",
      blood_tests: bloodInvestigationData.blood_tests || [],
      
      // Advice
      advice_remarks: recordData?.advice_remarks || "",
    },
  })

  // Load master data when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Fetch blood tests master data
      masterData.fetchMultiple(['bloodTests'])
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
            const patientOptions: SearchableSelectOption[] = response.data.map((patient) => ({
              value: patient.id,
              label: `${patient.patient_id || ''} - ${patient.full_name || 'Unknown'}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleSubmit = async (values: BloodAdviceFormValues) => {
    if (!onSubmit) return

    setLoading(true)
    try {
      // Transform form data to API format
      const transformedData = {
        patient_id: values.patient_id || undefined,
        record_date: values.record_date,
        record_time: values.record_time || undefined,
        record_number: values.record_number,
        blood_investigation_data: {
          blood_sugar: values.blood_sugar || undefined,
          blood_tests: values.blood_tests || [],
        },
        advice_remarks: values.advice_remarks || undefined,
      }

      await onSubmit(transformedData as any)
      setIsOpen(false)
      form.reset()
    } catch (error: any) {
      // Error handling is done by the callback
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onCloseButtonClickOnly={true}>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Blood & Advice" : "Add Blood & Advice"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update blood investigation and advice information"
              : "Enter blood investigation and advice information for the patient"}
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
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search and select patient"
                      loading={loadingPatients}
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

            {/* Blood Investigation Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Blood Investigation</h3>
              
              {/* Blood Sugar */}
              <FormField
                control={form.control}
                name="blood_sugar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Sugar</FormLabel>
                    <FormControl>
                      <Input
                        className={inputClassName}
                        placeholder="Enter blood sugar value"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Blood Tests */}
              <FormField
                control={form.control}
                name="blood_tests"
                render={({ field }) => {
                  const selectedTests = field.value || []

                  // Group master data blood tests by category (if available)
                  let bloodTestCategories;
                  if (masterData.data.bloodTests && masterData.data.bloodTests.length > 0) {
                    const allTests = masterData.data.bloodTests.map(bt => ({
                      id: bt.value,
                      label: bt.label
                    }));

                    bloodTestCategories = [
                      {
                        name: "Blood Tests",
                        tests: allTests
                      }
                    ];
                  } else {
                    // Fallback to BLOOD_TEST_OPTIONS if master data is not available
                    const allTests = BLOOD_TEST_OPTIONS.map(test => ({ id: test, label: test }));

                    // Group tests by categories based on similar function/type
                    const generalTests = allTests.filter(t => ["CBC", "BT", "CT", "PT-INR"].includes(t.id));
                    const sugarTests = allTests.filter(t => ["RBS", "FBS", "PP2BS"].includes(t.id));
                    const serologyTests = allTests.filter(t => ["HIV", "HBSAG", "HCV"].includes(t.id));
                    const autoimmuneTests = allTests.filter(t => ["ANA-PROFILE", "P-ANCA", "C-ANCA", "R.A.FACTOR"].includes(t.id));
                    const hormoneTests = allTests.filter(t => ["T3 , T4, TSH, ANTI TPO", "S CREATININE", "S. SODIUM LEVELS"].includes(t.id));
                    const otherTests = allTests.filter(t =>
                      !["CBC", "BT", "CT", "PT-INR", "RBS", "FBS", "PP2BS", "HIV", "HBSAG", "HCV", "ANA-PROFILE", "P-ANCA", "C-ANCA", "R.A.FACTOR", "T3 , T4, TSH, ANTI TPO", "S CREATININE", "S. SODIUM LEVELS"].includes(t.id)
                    );

                    bloodTestCategories = [
                      ...(generalTests.length > 0 && [{ name: "General", tests: generalTests }]),
                      ...(sugarTests.length > 0 && [{ name: "Blood Sugar", tests: sugarTests }]),
                      ...(serologyTests.length > 0 && [{ name: "Serology", tests: serologyTests }]),
                      ...(autoimmuneTests.length > 0 && [{ name: "Autoimmune", tests: autoimmuneTests }]),
                      ...(hormoneTests.length > 0 && [{ name: "Hormones & Biochemistry", tests: hormoneTests }]),
                      ...(otherTests.length > 0 && [{ name: "Other", tests: otherTests }])
                    ];
                  }

                  const handleToggle = (testId: string) => {
                    const newSelected = selectedTests.includes(testId)
                      ? selectedTests.filter((id: string) => id !== testId)
                      : [...selectedTests, testId]
                    field.onChange(newSelected)
                  }

                  return (
                    <div className="space-y-6">
                      <FormLabel>Blood Tests</FormLabel>
                      {bloodTestCategories.map((category) => (
                        <div key={category.name} className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {category.name}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {category.tests.map((test) => {
                              const isSelected = selectedTests.includes(test.id)
                              return (
                                <div
                                  key={test.id}
                                  onClick={() => handleToggle(test.id)}
                                  className={`
                                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                    ${isSelected
                                      ? 'bg-gray-900 text-white border-gray-900'
                                      : 'bg-white border-gray-200 hover:border-gray-400'
                                    }
                                  `}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggle(test.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-4 w-4 cursor-pointer"
                                  />
                                  <label className="text-sm font-medium select-none cursor-pointer flex-1">
                                    {test.label}
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
            </div>

            {/* Advice Remarks Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Advice / Remarks</h3>
              
              <FormField
                control={form.control}
                name="advice_remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advice / Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter advice or remarks..."
                        rows={4}
                        className="bg-gray-50 w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {loading ? "Saving..." : mode === "edit" ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}











