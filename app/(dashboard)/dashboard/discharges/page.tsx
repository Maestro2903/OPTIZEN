"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Trash2,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DischargeForm } from "@/components/discharge-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { DischargePrint } from "@/components/discharge-print"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

interface Discharge {
  id: string
  patient_name: string
  admission_date: string
  discharge_date: string
  notes?: string
}

// Sample data removed for production - should be fetched from API
const discharges: Discharge[] = [
  // This should be populated from the discharges API
  // Example: const discharges = await fetchDischarges()
]

export default function DischargesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [dischargeList, setDischargeList] = React.useState<Discharge[]>(discharges)
  const [isLoading, setIsLoading] = React.useState(false)

  // Function to handle delete with API integration
  const handleDelete = async (dischargeId: string) => {
    // Prevent concurrent deletes
    if (isLoading) return

    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API call when endpoint is ready
      // const response = await fetch(`/api/discharges/${dischargeId}`, { method: 'DELETE' })
      // if (!response.ok) {
      //   throw new Error('Failed to delete discharge')
      // }
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Only update local state after successful API response
      setDischargeList(prev => prev.filter(d => d.id !== dischargeId))
      
      // TODO: Show success toast/notification to user
      // toast({ title: 'Success', description: 'Discharge deleted successfully' })
    } catch (error) {
      console.error("Error deleting discharge:", error)
      // TODO: Show error toast/notification to user
      // toast({ title: 'Error', description: 'Failed to delete discharge', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Computed statistics from discharge data
  const stats = React.useMemo(() => {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    const thisMonthDischarges = dischargeList.filter(d =>
      new Date(d.discharge_date) >= thisMonth
    ).length

    const thisWeekDischarges = dischargeList.filter(d =>
      new Date(d.discharge_date) >= thisWeek
    ).length

    // Calculate average stay length in days
    const avgStay = dischargeList.length > 0 ?
      dischargeList.reduce((total, d) => {
        const admission = new Date(d.admission_date)
        const discharge = new Date(d.discharge_date)

        // Log warning for invalid date ranges
        if (discharge.getTime() < admission.getTime()) {
          console.warn('Invalid discharge data: discharge_date is before admission_date', {
            id: d.id,
            admission_date: d.admission_date,
            discharge_date: d.discharge_date
          })
        }

        const stayDays = Math.max(0, (discharge.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24))
        return total + stayDays
      }, 0) / dischargeList.length : 0

    return {
      total: dischargeList.length,
      thisMonth: thisMonthDischarges,
      thisWeek: thisWeekDischarges,
      avgStay: Number(avgStay.toFixed(1))
    }
  }, [dischargeList])

  const filteredDischarges = React.useMemo(() => {
    if (!searchTerm.trim()) return dischargeList
    const q = searchTerm.trim().toLowerCase()
    return dischargeList.filter(d =>
      (d.patient_name || '').toLowerCase().includes(q) ||
      (d.admission_date || '').toLowerCase().includes(q) ||
      (d.discharge_date || '').toLowerCase().includes(q) ||
      (d.notes || '').toLowerCase().includes(q)
    )
  }, [searchTerm, dischargeList])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discharges</h1>
          <p className="text-muted-foreground">Manage patient discharge records</p>
        </div>
        <DischargeForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Discharge
          </Button>
        </DischargeForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Discharge Records</CardTitle>
              <CardDescription>View and manage all patient discharges</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search discharges..."
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SR. NO.</TableHead>
                  <TableHead>DATE OF ADMISSION</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>DATE OF DISCHARGE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDischarges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No discharge records yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDischarges.map((discharge, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{discharge.admission_date}</TableCell>
                      <TableCell className="font-medium">{discharge.patient_name}</TableCell>
                      <TableCell>{discharge.discharge_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ViewEditDialog
                            title={`Discharge - ${discharge?.patient_name ?? "Record"}`}
                            description={`Admission: ${discharge?.admission_date ?? "-"}`}
                            data={discharge}
                            renderViewAction={(data?: Discharge) => (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Patient</p>
                                  <p className="font-medium">{data?.patient_name ?? '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Admission Date</p>
                                  <p>{data?.admission_date ?? '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Discharge Date</p>
                                  <p>{data?.discharge_date ?? '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-muted-foreground">Notes</p>
                                  <p className="text-muted-foreground">{data?.notes ?? '-'}</p>
                                </div>
                              </div>
                            )}
                            renderEditAction={(form: any) => (
                              <Form {...form}>
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField control={form.control} name={"patient_name"} render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Patient</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                  <FormField control={form.control} name={"admission_date"} render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Admission Date</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                  <FormField control={form.control} name={"discharge_date"} render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Discharge Date</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                  <FormField control={form.control} name={"notes"} render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel>Notes</FormLabel>
                                      <FormControl>
                                        <Textarea rows={3} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                </div>
                              </Form>
                            )}
                            onSaveAction={async (values: any) => {
                              console.log("Update discharge", values)
                            }}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </ViewEditDialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DischargePrint discharge={{
                            id: discharge.id,
                            discharge_no: discharge.id.slice(0, 8).toUpperCase(),
                            discharge_date: discharge.discharge_date,
                            patient_name: discharge.patients?.full_name || 'N/A',
                            patient_id: discharge.patients?.patient_id,
                            admission_date: discharge.admission_date,
                            case_no: discharge.cases?.case_no,
                            primary_diagnosis: discharge.final_diagnosis,
                            discharge_summary: discharge.discharge_summary,
                            discharge_medications: discharge.medications,
                            follow_up_instructions: discharge.instructions,
                            follow_up_date: discharge.follow_up_date,
                            final_condition: discharge.condition_on_discharge,
                            vital_signs: discharge.vitals_at_discharge,
                            procedures_performed: discharge.treatment_given,
                          }}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Print Discharge Summary">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </DischargePrint>
                          <DeleteConfirmDialog
                            title="Delete Discharge"
                            description="Are you sure you want to delete this discharge record? This action cannot be undone."
                            onConfirm={() => handleDelete(discharge.id)}
                          >
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive" 
                              title="Delete"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
