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
import { DischargePrint } from "@/components/discharge-print"
import { Badge } from "@/components/ui/badge"
import { type Discharge, dischargesApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DischargesPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [dischargeList, setDischargeList] = React.useState<Discharge[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFetching, setIsFetching] = React.useState(false)
  const [selectedDischarge, setSelectedDischarge] = React.useState<Discharge | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)

  // Fetch discharges on mount
  React.useEffect(() => {
    const fetchDischarges = async () => {
      try {
        setIsFetching(true)
        const response = await dischargesApi.list({ limit: 1000, sortBy: 'discharge_date', sortOrder: 'desc' })
        
        if (response.success && response.data) {
          setDischargeList(response.data)
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to load discharges",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Error fetching discharges:", error)
        toast({
          title: "Error",
          description: error?.message || "Failed to load discharges",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
        setIsLoading(false)
      }
    }

    fetchDischarges()
  }, [])

  // Function to refresh discharge list
  const refreshDischarges = async () => {
    try {
      setIsFetching(true)
      const response = await dischargesApi.list({ limit: 1000, sortBy: 'discharge_date', sortOrder: 'desc' })
      
      if (response.success && response.data) {
        setDischargeList(response.data)
      }
    } catch (error: any) {
      console.error("Error refreshing discharges:", error)
    } finally {
      setIsFetching(false)
    }
  }

  // Handler functions for view dialog
  const handleViewDischarge = React.useCallback((discharge: Discharge) => {
    setSelectedDischarge(discharge)
    setViewDialogOpen(true)
  }, [])

  const handleViewDialogOpenChange = React.useCallback((open: boolean) => {
    setViewDialogOpen(open)
    if (!open) {
      setSelectedDischarge(null)
    }
  }, [])

  // Function to handle delete with API integration
  const handleDelete = async (dischargeId: string) => {
    // Prevent concurrent deletes
    if (isFetching) return

    try {
      setIsFetching(true)
      
      const response = await dischargesApi.delete(dischargeId)
      
      if (response.success) {
        // Only update local state after successful API response
        setDischargeList(prev => prev.filter(d => d.id !== dischargeId))
        
        toast({ 
          title: 'Success', 
          description: 'Discharge deleted successfully' 
        })
      } else {
        toast({ 
          title: 'Error', 
          description: response.error || 'Failed to delete discharge', 
          variant: 'destructive' 
        })
      }
    } catch (error: any) {
      console.error("Error deleting discharge:", error)
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to delete discharge', 
        variant: 'destructive' 
      })
    } finally {
      setIsFetching(false)
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
      (d.patients?.full_name || '').toLowerCase().includes(q) ||
      (d.admission_date || '').toLowerCase().includes(q) ||
      (d.discharge_date || '').toLowerCase().includes(q) ||
      (d.discharge_summary || '').toLowerCase().includes(q)
    )
  }, [searchTerm, dischargeList])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discharges</h1>
          <p className="text-muted-foreground">Manage patient discharge records</p>
        </div>
        <DischargeForm onSuccess={refreshDischarges}>
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
                  <TableHead>PATIENT ID</TableHead>
                  <TableHead>DATE OF ADMISSION</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>DIAGNOSIS</TableHead>
                  <TableHead>DATE OF DISCHARGE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading discharges...
                    </TableCell>
                  </TableRow>
                ) : filteredDischarges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No discharge records yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDischarges.map((discharge, index) => {
                    // Helper function to display diagnosis
                    const getDiagnosisDisplay = (diagnosis: any) => {
                      if (!diagnosis) return '-'
                      if (typeof diagnosis === 'string') return diagnosis
                      if (diagnosis.labels && Array.isArray(diagnosis.labels)) {
                        return diagnosis.labels.slice(0, 2).join(', ') + 
                               (diagnosis.labels.length > 2 ? ` +${diagnosis.labels.length - 2} more` : '')
                      }
                      return '-'
                    }

                    return (
                    <TableRow key={discharge.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-primary">{discharge.patients?.patient_id || '-'}</TableCell>
                      <TableCell>{discharge.admission_date}</TableCell>
                      <TableCell className="font-medium">{discharge.patients?.full_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getDiagnosisDisplay(discharge.final_diagnosis)}
                      </TableCell>
                      <TableCell>{discharge.discharge_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title="View"
                            onClick={() => handleViewDischarge(discharge)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DischargeForm 
                            mode="edit" 
                            dischargeData={discharge}
                            onSuccess={refreshDischarges}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DischargeForm>
                          <DischargePrint discharge={{
                            id: discharge.id,
                            discharge_no: discharge.id.slice(0, 8).toUpperCase(),
                            discharge_date: discharge.discharge_date,
                            patient_name: discharge.patients?.full_name || 'N/A',
                            patient_id: discharge.patients?.patient_id,
                            admission_date: discharge.admission_date,
                            case_no: discharge.cases?.case_no,
                            primary_diagnosis: typeof discharge.final_diagnosis === 'string' 
                              ? discharge.final_diagnosis 
                              : discharge.final_diagnosis?.labels?.join(', '),
                            discharge_summary: discharge.discharge_summary,
                            discharge_medications: typeof discharge.medications === 'string'
                              ? discharge.medications
                              : (discharge.medications?.medicines?.labels?.join(', ') || ''),
                            follow_up_instructions: discharge.instructions,
                            follow_up_date: discharge.follow_up_date,
                            final_condition: discharge.condition_on_discharge,
                            vital_signs: discharge.vitals_at_discharge,
                            procedures_performed: typeof discharge.treatment_given === 'string'
                              ? discharge.treatment_given
                              : discharge.treatment_given?.labels?.join(', '),
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
                              disabled={isFetching}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleViewDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discharge Details</DialogTitle>
            <DialogDescription>
              View discharge information
            </DialogDescription>
          </DialogHeader>
          {selectedDischarge && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                    <p className="text-sm">{selectedDischarge.patients?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                    <p className="text-sm">{selectedDischarge.patients?.patient_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                    <p className="text-sm">{selectedDischarge.patients?.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{selectedDischarge.patients?.email || 'N/A'}</p>
                  </div>
                  {selectedDischarge.cases?.case_no && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Case</p>
                      <p className="text-sm">{selectedDischarge.cases.case_no}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admission & Discharge Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admission Date</p>
                    <p className="text-sm">{new Date(selectedDischarge.admission_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Discharge Date</p>
                    <p className="text-sm">{new Date(selectedDischarge.discharge_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Discharge Type</p>
                    <Badge variant="secondary">{selectedDischarge.discharge_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="secondary">{selectedDischarge.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              {selectedDischarge.final_diagnosis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Final Diagnosis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {typeof selectedDischarge.final_diagnosis === 'string' 
                        ? selectedDischarge.final_diagnosis
                        : selectedDischarge.final_diagnosis?.labels?.join(', ') || 'Not recorded'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedDischarge.treatment_given && (
                <Card>
                  <CardHeader>
                    <CardTitle>Treatment Given</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {typeof selectedDischarge.treatment_given === 'string' 
                        ? selectedDischarge.treatment_given
                        : selectedDischarge.treatment_given?.labels?.join(', ') || 'Not recorded'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedDischarge.discharge_summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Discharge Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedDischarge.discharge_summary}</p>
                  </CardContent>
                </Card>
              )}

              {selectedDischarge.medications && (
                <Card>
                  <CardHeader>
                    <CardTitle>Medications Prescribed</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Medications</p>
                      <p className="text-sm">
                        {typeof selectedDischarge.medications === 'string' 
                          ? selectedDischarge.medications
                          : selectedDischarge.medications?.medicines?.labels?.join(', ') || 'Not recorded'}
                      </p>
                    </div>
                    {selectedDischarge.medications && typeof selectedDischarge.medications !== 'string' && selectedDischarge.medications.dosages?.labels && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Dosages</p>
                        <p className="text-sm">{selectedDischarge.medications.dosages.labels.join(', ')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedDischarge.condition_on_discharge && (
                <Card>
                  <CardHeader>
                    <CardTitle>Condition on Discharge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedDischarge.condition_on_discharge}</p>
                  </CardContent>
                </Card>
              )}

              {selectedDischarge.instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Discharge Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedDischarge.instructions}</p>
                  </CardContent>
                </Card>
              )}

              {(selectedDischarge.follow_up_date || selectedDischarge.vitals_at_discharge) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedDischarge.follow_up_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Follow-up Date</p>
                        <p className="text-sm">{new Date(selectedDischarge.follow_up_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedDischarge.vitals_at_discharge && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Vitals at Discharge</p>
                        <p className="text-sm">{selectedDischarge.vitals_at_discharge}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
