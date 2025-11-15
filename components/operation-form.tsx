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
import { useToast } from "@/hooks/use-toast"
import { patientsApi, casesApi, masterDataApi, operationsApi } from "@/lib/services/api"
import { useMasterData } from "@/hooks/use-master-data"
import { Checkbox } from "@/components/ui/checkbox"

const operationFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  case_id: z.string().optional(),
  operation_name: z.string().min(1, "Operation name is required"),
  operation_date: z.string().min(1, "Operation date is required"),
  begin_time: z.string().optional(),
  end_time: z.string().optional(),
  eye: z.string().optional(),
  sys_diagnosis: z.string().optional(),
  anesthesia: z.string().optional(),
  operation_notes: z.string().optional(),
  payment_mode: z.string().optional(),
  amount: z.string().optional(),
  iol_name: z.string().optional(),
  iol_power: z.string().optional(),
  print_notes: z.boolean().optional(),
  print_payment: z.boolean().optional(),
  print_iol: z.boolean().optional(),
  status: z.string().optional(),
  // Follow-up fields
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),
  follow_up_visit_type: z.string().optional(),
})

export interface OperationData {
  id?: string
  patient_id: string
  case_id?: string
  operation_name: string
  operation_date: string
  begin_time?: string
  end_time?: string
  eye?: string
  sys_diagnosis?: string
  anesthesia?: string
  operation_notes?: string
  payment_mode?: string
  amount?: number
  iol_name?: string
  iol_power?: string
  print_notes?: boolean
  print_payment?: boolean
  print_iol?: boolean
  status?: string
  follow_up_date?: string
  follow_up_notes?: string
  follow_up_visit_type?: string
}

interface OperationFormProps {
  children: React.ReactNode
  onSubmit?: (data: OperationData) => Promise<void>
  operationData?: OperationData
  mode?: "create" | "edit"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function OperationForm({ children, onSubmit, operationData, mode = "create", open: controlledOpen, onOpenChange }: OperationFormProps) {
  const { toast } = useToast()
  const masterData = useMasterData()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [cases, setCases] = React.useState<SearchableSelectOption[]>([])
  const [surgeryTypes, setSurgeryTypes] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingCases, setLoadingCases] = React.useState(false)
  const [loadingSurgeries, setLoadingSurgeries] = React.useState(false)
  const masterDataFetchedRef = React.useRef(false)

  const form = useForm<z.infer<typeof operationFormSchema>>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: {
      patient_id: "",
      case_id: "",
      operation_name: "",
      operation_date: new Date().toISOString().split('T')[0],
      begin_time: "",
      end_time: "",
      eye: "",
      sys_diagnosis: "",
      anesthesia: "",
      operation_notes: "",
      payment_mode: "",
      amount: "",
      iol_name: "",
      iol_power: "",
      print_notes: false,
      print_payment: false,
      print_iol: false,
      status: "",
    },
  })

  const selectedPatientId = form.watch("patient_id")

  // Reset form when dialog opens or operationData changes
  React.useEffect(() => {
    if (open && operationData) {
      form.reset({
        patient_id: operationData.patient_id || "",
        case_id: operationData.case_id || "",
        operation_name: operationData.operation_name || "",
        operation_date: operationData.operation_date || new Date().toISOString().split('T')[0],
        begin_time: operationData.begin_time || "",
        end_time: operationData.end_time || "",
        eye: operationData.eye || "",
        sys_diagnosis: operationData.sys_diagnosis || "",
        anesthesia: operationData.anesthesia || "",
        operation_notes: operationData.operation_notes || "",
        payment_mode: operationData.payment_mode || "",
        amount: operationData.amount?.toString() || "",
        iol_name: operationData.iol_name || "",
        iol_power: operationData.iol_power || "",
        print_notes: operationData.print_notes || false,
        print_payment: operationData.print_payment || false,
        print_iol: operationData.print_iol || false,
        status: operationData.status || (mode === "edit" ? "scheduled" : ""),
        follow_up_date: operationData.follow_up_date || "",
        follow_up_notes: operationData.follow_up_notes || "",
        follow_up_visit_type: operationData.follow_up_visit_type || "",
      })
    } else if (open && mode === "create") {
      // Reset to defaults for create mode
      form.reset({
        patient_id: "",
        case_id: "",
        operation_name: "",
        operation_date: new Date().toISOString().split('T')[0],
        begin_time: "",
        end_time: "",
        eye: "",
        sys_diagnosis: "",
        anesthesia: "",
        operation_notes: "",
        payment_mode: "",
        amount: "",
        iol_name: "",
        iol_power: "",
        print_notes: false,
        print_payment: false,
        print_iol: false,
        status: "",
        follow_up_date: "",
        follow_up_notes: "",
        follow_up_visit_type: "",
      })
    }
  }, [open, operationData, form, mode])

  // Load patients
  React.useEffect(() => {
    const loadPatients = async () => {
      if (!open) return
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
      } catch (error: any) {
        console.error("Error loading patients:", error)
        toast({
          title: "Failed to load patients",
          description: error?.message ?? "Please try again",
          variant: "destructive",
        })
      } finally {
        setLoadingPatients(false)
      }
    }
    loadPatients()
  }, [open, toast])

  // Load cases for selected patient
  React.useEffect(() => {
    const loadCases = async () => {
      if (!selectedPatientId) {
        setCases([])
        return
      }
      setLoadingCases(true)
      try {
        const response = await casesApi.list({ patient_id: selectedPatientId })
        if (response.success && response.data) {
          setCases(
            response.data
              .filter((caseItem) => caseItem?.id && caseItem?.case_no)
              .map((caseItem) => ({
                value: caseItem.id,
                label: `${caseItem.case_no} - ${caseItem.diagnosis || 'No diagnosis'}`,
              }))
          )
        } else {
          toast({
            title: "Failed to load cases",
            description: "Unable to fetch cases for this patient.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error loading cases:", error)
        toast({
          title: "Failed to load cases",
          description: error?.message ?? "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setLoadingCases(false)
      }
    }
    if (open && selectedPatientId) {
      loadCases()
    }
  }, [selectedPatientId, open, toast])

  // Load master data (diagnosis, anesthesia, eyeSelection) when dialog opens
  // Only fetch once per dialog open session to prevent excessive API calls
  React.useEffect(() => {
    if (!open) {
      // Reset ref when dialog closes
      masterDataFetchedRef.current = false
      return
    }

    // Skip if we've already fetched in this session
    if (masterDataFetchedRef.current) {
      return
    }

    // Check if data already exists (from previous session or shared context)
    const hasDiagnosis = masterData.data.diagnosis.length > 0
    const hasAnesthesia = masterData.data.anesthesiaTypes.length > 0
    const hasEyeSelection = masterData.data.eyeSelection.length > 0
    const isLoadingDiagnosis = masterData.loading.diagnosis
    const isLoadingAnesthesia = masterData.loading.anesthesiaTypes
    const isLoadingEyeSelection = masterData.loading.eyeSelection

    // Check for visit types (for follow-up)
    const hasVisitTypes = masterData.data.visitTypes.length > 0
    const isLoadingVisitTypes = masterData.loading.visitTypes

    // If data exists or is currently loading, mark as fetched and don't fetch again
    if ((hasDiagnosis || isLoadingDiagnosis) && (hasAnesthesia || isLoadingAnesthesia) && (hasEyeSelection || isLoadingEyeSelection) && (hasVisitTypes || isLoadingVisitTypes)) {
      masterDataFetchedRef.current = true
      return
    }

    // Fetch missing categories
    masterDataFetchedRef.current = true
    const categoriesToFetch: Array<'diagnosis' | 'anesthesiaTypes' | 'eyeSelection' | 'visitTypes'> = []
    if (!hasDiagnosis && !isLoadingDiagnosis) {
      categoriesToFetch.push('diagnosis')
    }
    if (!hasAnesthesia && !isLoadingAnesthesia) {
      categoriesToFetch.push('anesthesiaTypes')
    }
    if (!hasEyeSelection && !isLoadingEyeSelection) {
      categoriesToFetch.push('eyeSelection')
    }
    if (!hasVisitTypes && !isLoadingVisitTypes) {
      categoriesToFetch.push('visitTypes')
    }

    if (categoriesToFetch.length > 0) {
      masterData.fetchMultiple(categoriesToFetch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]) // Only depend on open to prevent infinite loops. masterData.fetchMultiple is stable (memoized)

  // Load surgery types from master data
  React.useEffect(() => {
    const loadSurgeryTypes = async () => {
      setLoadingSurgeries(true)
      try {
        const response = await masterDataApi.list({ category: 'surgery_types' })
        if (response.success && response.data) {
          setSurgeryTypes(
            response.data
              .filter((item) => item?.name)
              .map((item) => ({
                value: item.name,
                label: item.name,
              }))
          )
        } else {
          toast({
            title: "Failed to load surgery types",
            description: "Unable to fetch surgery types. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error loading surgery types:", error)
        toast({
          title: "Failed to load surgery types",
          description: error?.message ?? "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setLoadingSurgeries(false)
      }
    }
    if (open) {
      loadSurgeryTypes()
    }
  }, [open, toast])

  async function handleSubmit(values: z.infer<typeof operationFormSchema>) {
    try {
      const parsedAmount = values.amount ? parseFloat(values.amount) : undefined
      
      // Validate amount if provided
      if (values.amount && !Number.isFinite(parsedAmount)) {
        toast({
          variant: "destructive",
          title: "Invalid Amount",
          description: "Please enter a valid amount.",
        })
        return
      }

      const submitData: OperationData = {
        ...values,
        amount: parsedAmount,
        // Preserve existing status for edits, default to 'scheduled' for new operations
        status: values.status || operationData?.status || 'scheduled',
      }
      
      if (onSubmit) {
        await onSubmit(submitData)
      } else {
        // If no onSubmit handler, show success message
        toast({
          title: "Success",
          description: mode === "create" ? "Operation scheduled successfully." : "Operation updated successfully.",
        })
      }
      
      // Close dialog and reset form
      setOpen(false)
      // Only reset if not controlled (internal state)
      if (controlledOpen === undefined) {
        form.reset()
      }
    } catch (error: any) {
      console.error("Error submitting operation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: mode === "create" 
          ? "Failed to schedule operation. Please try again."
          : "Failed to update operation. Please try again.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Schedule Operation" : "Edit Operation"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Schedule a new surgical operation" : "Update operation details"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                name="case_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case (Optional)</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={cases}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select case"
                        searchPlaceholder="Search cases..."
                        loading={loadingCases}
                        disabled={!selectedPatientId}
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
                name="operation_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Type *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={surgeryTypes}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select operation type"
                        searchPlaceholder="Search surgeries..."
                        loading={loadingSurgeries}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="begin_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Begin Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eye"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eye</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={masterData.data.eyeSelection || []}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select eye"
                        searchPlaceholder="Search eye..."
                        emptyText="No options found."
                        loading={masterData.loading.eyeSelection}
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
                name="sys_diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={masterData.data.diagnosis || []}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select diagnosis"
                        searchPlaceholder="Search diagnosis..."
                        emptyText="No diagnosis found."
                        loading={masterData.loading.diagnosis}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="anesthesia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anesthesia</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={masterData.data.anesthesiaTypes || []}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select anesthesia type"
                        searchPlaceholder="Search anesthesia..."
                        emptyText="No anesthesia types found."
                        loading={masterData.loading.anesthesiaTypes}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="iol_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IOL Name</FormLabel>
                    <FormControl>
                      <Input placeholder="IOL name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iol_power"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IOL Power</FormLabel>
                    <FormControl>
                      <Input placeholder="IOL power" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="payment_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Mode</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={[
                        { value: "Cash", label: "Cash" },
                        { value: "Card", label: "Card" },
                        { value: "UPI", label: "UPI" },
                        { value: "Cheque", label: "Cheque" },
                        { value: "Insurance", label: "Insurance" },
                      ]}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Select payment mode"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operation_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter operation notes..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="print_notes"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Print Notes</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="print_payment"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Print Payment</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="print_iol"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Print IOL</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Follow-up Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg">Follow-up Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="follow_up_visit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Visit Type</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={masterData.data.visitTypes || []}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select follow-up visit type"
                          searchPlaceholder="Search visit types..."
                          emptyText="No visit types found."
                          loading={masterData.loading.visitTypes}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="follow_up_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter follow-up notes or instructions..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === "create" ? "Schedule Operation" : "Update Operation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
