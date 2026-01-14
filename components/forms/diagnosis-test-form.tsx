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
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { SimpleCombobox } from "@/components/ui/simple-combobox"
import { diagnosisTestsApi, type DiagnosisTestRecord } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { useMasterData } from "@/hooks/use-master-data"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { X } from "lucide-react"
import { patientsApi } from "@/lib/services/api"

const inputClassName = "h-11 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-gray-600 focus:ring-2 focus:ring-gray-200"

// Diagnosis Test Schema
const diagnosisTestSchema = z.object({
  patient_id: z.string().optional(),
  record_date: z.string().min(1, "Record date is required"),
  record_time: z.string().optional(),
  record_number: z.string().min(1, "Record number is required"),
  
  // Diagnosis
  diagnosis: z.array(z.string()).optional(),
  
  // Diagnostic Tests
  sac_test_right: z.string().optional(),
  sac_test_left: z.string().optional(),
  iop_right: z.string().optional(),
  iop_left: z.string().optional(),
  
  // Additional Diagnostic Tests
  diagnostic_tests: z.array(z.object({
    test_id: z.string().min(1, "Test is required"),
    eye: z.string().optional(),
    type: z.string().optional(),
    problem: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
})

type DiagnosisTestFormValues = z.infer<typeof diagnosisTestSchema>

interface DiagnosisTestFormProps {
  children?: React.ReactNode
  recordData?: DiagnosisTestRecord
  mode?: "create" | "edit"
  onSubmit?: (data: DiagnosisTestFormValues) => Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DiagnosisTestForm({
  children,
  recordData,
  mode = "create",
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DiagnosisTestFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const masterData = useMasterData()

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : open
  const setIsOpen = isControlled ? controlledOnOpenChange || (() => {}) : setOpen

  // Extract diagnosis and tests data from recordData
  const diagnosisData = recordData?.diagnosis_data || {}
  const testsData = recordData?.tests_data || {}

  // State for additional diagnostic tests
  const [newTestId, setNewTestId] = React.useState("")
  const [newTestEye, setNewTestEye] = React.useState("")
  const [newTestType, setNewTestType] = React.useState("")
  const [newTestProblem, setNewTestProblem] = React.useState("")
  const [newTestNotes, setNewTestNotes] = React.useState("")

  const form = useForm<DiagnosisTestFormValues>({
    resolver: zodResolver(diagnosisTestSchema),
    defaultValues: {
      patient_id: recordData?.patient_id || "",
      record_date: recordData?.record_date || new Date().toISOString().split('T')[0],
      record_time: recordData?.record_time || "",
      record_number: recordData?.record_number || "",
      
      // Diagnosis
      diagnosis: diagnosisData.diagnosis || [],
      
      // Diagnostic Tests
      sac_test_right: testsData.sac_test?.right || "",
      sac_test_left: testsData.sac_test?.left || "",
      iop_right: testsData.iop?.right?.value || "",
      iop_left: testsData.iop?.left?.value || "",
      
      // Additional Diagnostic Tests
      diagnostic_tests: testsData.diagnostic_tests || [],
    },
  })

  const { fields: diagnosticTestFields, append: appendDiagnosticTest, remove: removeDiagnosticTest } = useFieldArray({
    control: form.control,
    name: "diagnostic_tests",
  })

  // Load master data when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Fetch all required master data categories for dropdowns
      masterData.fetchMultiple([
        'diagnosis',
        'sacStatus',
        'iopRanges',
        'diagnosticTests',
        'eyeSelection'
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

  // Handle add diagnostic test
  const handleAddDiagnosticTest = () => {
    if (!newTestId) {
      toast({
        title: "Error",
        description: "Test Type is required",
        variant: "destructive",
      })
      return
    }

    appendDiagnosticTest({
      test_id: newTestId,
      eye: newTestEye || undefined,
      type: newTestType || undefined,
      problem: newTestProblem || undefined,
      notes: newTestNotes || undefined,
    })

    // Reset form
    setNewTestId("")
    setNewTestEye("")
    setNewTestType("")
    setNewTestProblem("")
    setNewTestNotes("")
  }

  const handleSubmit = async (values: DiagnosisTestFormValues) => {
    if (!onSubmit) return

    setLoading(true)
    try {
      // Transform form data to API format
      const transformedData = {
        patient_id: values.patient_id || undefined,
        record_date: values.record_date,
        record_time: values.record_time || undefined,
        record_number: values.record_number,
        diagnosis_data: {
          diagnosis: values.diagnosis || [],
        },
        tests_data: {
          sac_test: {
            right: values.sac_test_right || undefined,
            left: values.sac_test_left || undefined,
          },
          iop: {
            right: values.iop_right ? { id: values.iop_right, value: values.iop_right } : undefined,
            left: values.iop_left ? { id: values.iop_left, value: values.iop_left } : undefined,
          },
          diagnostic_tests: values.diagnostic_tests || [],
        },
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
            {mode === "edit" ? "Edit Diagnosis & Tests" : "Add Diagnosis & Tests"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update diagnosis and diagnostic test information"
              : "Enter diagnosis and diagnostic test information for the patient"}
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

            {/* Diagnosis & Diagnostic Tests Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Diagnosis & Diagnostic Tests</h3>
              
              {/* Diagnosis */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => {
                    const selectedDiagnoses = field.value || []
                    const diagnosisOptions = (masterData.data.diagnosis || []).map(d => ({
                      value: d.value,
                      label: d.label
                    }))
                    
                    // Get selected options including custom values (values not in master data)
                    const selectedOptions = selectedDiagnoses.map((val: string) => {
                      const option = diagnosisOptions.find(opt => opt.value === val)
                      return option || { value: val, label: val } // Custom value
                    })

                    const handleRemove = (valueToRemove: string) => {
                      const newValue = selectedDiagnoses.filter((v: string) => v !== valueToRemove)
                      field.onChange(newValue)
                    }

                    return (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <MultiSelect
                              options={diagnosisOptions}
                              value={field.value as any}
                              onValueChange={field.onChange}
                              placeholder="Search and select diagnosis"
                              searchPlaceholder="Search diagnoses..."
                              className="h-12 text-lg"
                              searchInputSize="large"
                            />
                            
                            {/* Selected Tags/Chips */}
                            {selectedOptions.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {selectedOptions.map((option) => (
                                  <div
                                    key={option.value}
                                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                                  >
                                    <span>{option.label}</span>
                                    <X
                                      className="h-4 w-4 hover:text-red-600 cursor-pointer transition-colors"
                                      onClick={() => handleRemove(option.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              {/* Diagnostic Tests */}
              <div className="space-y-4 border-t pt-4">

              {/* SAC SYRINGING Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">SAC SYRINGING</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="text-center text-sm font-medium text-muted-foreground">RIGHT EYE</div>
                    <FormField
                      control={form.control}
                      name="sac_test_right"
                      render={({ field }) => (
                        <SimpleCombobox
                          options={masterData.data.sacStatus || []}
                          value={field.value || ""}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Select status"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="text-center text-sm font-medium text-muted-foreground">LEFT EYE</div>
                    <FormField
                      control={form.control}
                      name="sac_test_left"
                      render={({ field }) => (
                        <SimpleCombobox
                          options={masterData.data.sacStatus || []}
                          value={field.value || ""}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Select status"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* I.O.P. Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">I.O.P.</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-center text-sm font-medium text-muted-foreground">RIGHT EYE</div>
                    <FormField
                      control={form.control}
                      name="iop_right"
                      render={({ field }) => (
                        <SimpleCombobox
                          options={masterData.data.iopRanges || []}
                          value={field.value || ""}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Select I.O.P. Right"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-center text-sm font-medium text-muted-foreground">LEFT EYE</div>
                    <FormField
                      control={form.control}
                      name="iop_left"
                      render={({ field }) => (
                        <SimpleCombobox
                          options={masterData.data.iopRanges || []}
                          value={field.value || ""}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Select I.O.P. Left"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Diagnostic Tests Section */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium text-sm">Additional Diagnostic Tests</h4>
                
                {/* Add Test Form */}
                <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <h5 className="text-sm font-semibold">Add Diagnostic Test</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm font-medium block mb-1.5">Test Type *</label>
                      <SimpleCombobox
                        options={masterData.data.diagnosticTests || []}
                        value={newTestId}
                        onChange={(value) => setNewTestId(value)}
                        placeholder="Select diagnostic test"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Eye</label>
                      <SimpleCombobox
                        options={masterData.data.eyeSelection || []}
                        value={newTestEye}
                        onChange={(value) => setNewTestEye(value)}
                        placeholder="Select eye"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Type/Category</label>
                      <Input
                        placeholder="e.g., Routine, Urgent"
                        value={newTestType}
                        onChange={(e) => setNewTestType(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">Problem/Indication</label>
                      <Input
                        placeholder="e.g., Glaucoma check"
                        value={newTestProblem}
                        onChange={(e) => setNewTestProblem(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium block mb-1.5">Notes</label>
                      <Input
                        placeholder="Additional details"
                        value={newTestNotes}
                        onChange={(e) => setNewTestNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddDiagnosticTest}
                    disabled={!newTestId}
                  >
                    Add Test
                  </Button>
                </div>

                {/* Diagnostic Tests Table */}
                {diagnosticTestFields.length > 0 && (
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">TEST</th>
                          <th className="text-left p-3 text-sm font-medium">EYE</th>
                          <th className="text-left p-3 text-sm font-medium">TYPE</th>
                          <th className="text-left p-3 text-sm font-medium">PROBLEM</th>
                          <th className="text-left p-3 text-sm font-medium">NOTES</th>
                          <th className="text-left p-3 text-sm font-medium">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diagnosticTestFields.map((field, index) => {
                          const test = masterData.data.diagnosticTests?.find(
                            t => t.value === (field as any).test_id
                          )
                          const eyeOption = masterData.data.eyeSelection?.find(
                            e => e.value === (field as any).eye
                          )
                          
                          const isUUID = (val: string | undefined | null): boolean => {
                            if (!val || typeof val !== 'string') return false
                            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
                          }
                          
                          const testLabel = test?.label || ((field as any).test_id && !isUUID((field as any).test_id) ? (field as any).test_id : 'N/A')
                          const eyeLabel = eyeOption?.label || ((field as any).eye && !isUUID((field as any).eye) ? (field as any).eye : 'N/A')
                          
                          return (
                            <tr key={field.id} className="border-b">
                              <td className="p-3 text-sm">{testLabel}</td>
                              <td className="p-3 text-sm">{eyeLabel}</td>
                              <td className="p-3 text-sm">{(field as any).type || '-'}</td>
                              <td className="p-3 text-sm">{(field as any).problem || '-'}</td>
                              <td className="p-3 text-sm">{(field as any).notes || '-'}</td>
                              <td className="p-3 text-sm">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDiagnosticTest(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
                {loading ? "Saving..." : mode === "edit" ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

