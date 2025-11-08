"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { patientsApi, operationsApi } from "@/lib/services/api"
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
  ipd_number: z.string().min(1, "IPD number is required"),
  patient_id: z.string().min(1, "Patient is required"),
  operation_id: z.string().optional(),
  admission_date: z.string().min(1, "Admission date is required"),
  admission_time: z.string().min(1, "Admission time is required"),
  discharge_date: z.string().min(1, "Discharge date is required"),
  discharge_time: z.string().min(1, "Discharge time is required"),
  diagnosis: z.string().optional(),
  operation_details: z.string().optional(),
  anesthesia: z.string().optional(),
  treatment: z.string().optional(),
  advice: z.string().optional(),
  medicines: z.string().optional(),
})

interface DischargeFormProps {
  children: React.ReactNode
}

export function DischargeForm({ children }: DischargeFormProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [operations, setOperations] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingOperations, setLoadingOperations] = React.useState(false)

  const form = useForm<z.infer<typeof dischargeFormSchema>>({
    resolver: zodResolver(dischargeFormSchema),
    defaultValues: {
      ipd_number: "IPD" + new Date().getFullYear() + "001",
      admission_date: new Date().toISOString().split("T")[0],
      discharge_date: new Date().toISOString().split("T")[0],
    },
  })

  // Load data when dialog opens
  React.useEffect(() => {
    const loadData = async () => {
      if (!open) return
      
      // Load patients
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
      } finally {
        setLoadingPatients(false)
      }

      // Load operations
      setLoadingOperations(true)
      try {
        const response = await operationsApi.list({ limit: 500 })
        if (response.success && response.data) {
          setOperations(
            response.data.map((operation) => ({
              value: operation.id,
              label: `${operation.operation_name || 'Operation'} - ${operation.operation_date || 'N/A'}`,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading operations:", error)
      } finally {
        setLoadingOperations(false)
      }
    }
    loadData()
  }, [open])

  function onSubmit(values: z.infer<typeof dischargeFormSchema>) {
    console.log(values)
    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Discharge Record</DialogTitle>
          <DialogDescription>
            Create discharge summary with IPD details and advice
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ipd_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IPD Number *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <FormField
              control={form.control}
              name="operation_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Operation</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={operations}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder="Select operation (optional)"
                      searchPlaceholder="Search operations..."
                      loading={loadingOperations}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                name="admission_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="discharge_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discharge Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Final diagnosis..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operation_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Details</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Surgical procedure details..." {...field} />
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
                    <Textarea rows={2} placeholder="Anesthesia details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Given</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Treatment details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="advice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discharge Advice</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Post-discharge instructions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicines Prescribed</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="List of medicines with dosage..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Discharge</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

