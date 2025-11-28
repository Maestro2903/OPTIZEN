"use client"

import * as React from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CasePrint } from "@/components/print/case-print"
import { useMasterData } from "@/hooks/use-master-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CaseViewDialogProps {
  children: React.ReactNode
  caseData: any
}

export function CaseViewDialog({ children, caseData }: CaseViewDialogProps) {
  const [open, setOpen] = React.useState(false)
  const masterData = useMasterData()
  const [dataLoaded, setDataLoaded] = React.useState(false)

  // Load necessary master data when dialog opens
  React.useEffect(() => {
    if (open && !dataLoaded) {
      const categoriesToLoad: Array<keyof typeof masterData.data> = [
        'eyeSelection',
        'diagnosis',
        'medicines',
        'visualAcuity',
        'bloodTests',
      ]
      
      categoriesToLoad.forEach(category => {
        if (masterData.data[category].length === 0) {
          masterData.fetchCategory(category)
        }
      })
      setDataLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dataLoaded])

  // UUID validation regex
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  // Helper to check if a value is a UUID
  const isUUID = (value: string | undefined | null): boolean => {
    if (!value || typeof value !== 'string') return false
    return UUID_REGEX.test(value)
  }

  // Helper to resolve UUID from master data category
  const resolveUUID = (uuid: string | undefined | null, category: keyof typeof masterData.data): string => {
    if (!uuid || !isUUID(uuid)) return uuid || 'N/A'
    const option = masterData.data[category].find(opt => opt.value === uuid)
    return option?.label || uuid
  }

  // Helper to resolve diagnosis (can be string, array, or null)
  const resolveDiagnosis = (diagnosis: string | string[] | null | undefined): string => {
    if (!diagnosis) return 'Not recorded'
    const diagnosisArray = Array.isArray(diagnosis) ? diagnosis : [diagnosis]
    const resolved = diagnosisArray.map(d => resolveUUID(d, 'diagnosis'))
    return resolved.join(', ')
  }

  // Helper to resolve eye UUID to label
  const getEyeLabel = (eyeId: string | undefined | null): string => {
    if (!eyeId) return 'N/A'
    return resolveUUID(eyeId, 'eyeSelection')
  }

  // Helper to resolve medicine name (UUID or string)
  const resolveMedicineName = (medicineId: string | undefined | null): string => {
    if (!medicineId) return 'N/A'
    if (isUUID(medicineId)) {
      return resolveUUID(medicineId, 'medicines')
    }
    return medicineId
  }

  // Helper to resolve visual acuity UUID
  const resolveVisualAcuity = (acuity: string | undefined | null): string => {
    if (!acuity) return 'N/A'
    if (isUUID(acuity)) {
      return resolveUUID(acuity, 'visualAcuity')
    }
    return acuity
  }

  // Helper to resolve blood test UUID
  const resolveBloodTest = (test: string | undefined | null): string => {
    if (!test) return 'N/A'
    if (isUUID(test)) {
      return resolveUUID(test, 'bloodTests')
    }
    return test
  }

  // Helper to safely access nested data and resolve UUIDs
  const getNestedValue = (obj: any, path: string, defaultValue: string = 'N/A', resolveAsUUID?: keyof typeof masterData.data): string => {
    if (!obj) return defaultValue
    const keys = path.split('.')
    let current = obj
    for (const key of keys) {
      if (current === null || current === undefined) return defaultValue
      current = current[key]
    }
    const value = current !== null && current !== undefined ? String(current) : defaultValue
    if (resolveAsUUID && isUUID(value)) {
      return resolveUUID(value, resolveAsUUID)
    }
    return value
  }

  // Extract data from caseData
  const visionData = caseData.vision_data || {}
  const examinationData = caseData.examination_data || {}
  const complaints = caseData.complaints || []
  const diagnosticTests = caseData.diagnostic_tests || []
  
  // Debug diagrams when dialog opens
  React.useEffect(() => {
    if (open) {
      console.log('=== DIAGRAM DEBUG ===')
      console.log('examinationData:', examinationData)
      console.log('examinationData.diagrams:', examinationData?.diagrams)
      console.log('Right diagram exists:', !!examinationData?.diagrams?.right)
      console.log('Left diagram exists:', !!examinationData?.diagrams?.left)
      if (examinationData?.diagrams?.right) {
        console.log('Right diagram length:', examinationData.diagrams.right.length)
        console.log('Right diagram preview:', examinationData.diagrams.right.substring(0, 100))
      }
      if (examinationData?.diagrams?.left) {
        console.log('Left diagram length:', examinationData.diagrams.left.length)
        console.log('Left diagram preview:', examinationData.diagrams.left.substring(0, 100))
      }
    }
  }, [open, examinationData])
  
  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onCloseButtonClickOnly={true}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Case Details - {caseData.case_no}</DialogTitle>
              <DialogDescription>
                Complete case information for {caseData.patient_name}
              </DialogDescription>
            </div>
            <CasePrint caseData={caseData}>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print Case
              </Button>
            </CasePrint>
          </div>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          {/* Header Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Case Number</p>
              <p className="font-semibold">{caseData.case_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{caseData.case_date || new Date(caseData.encounter_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-semibold uppercase">{caseData.patient_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visit Type</p>
              <Badge variant="secondary">{caseData.visit_no || caseData.visit_type}</Badge>
            </div>
          </div>

          <Separator />

          {/* Tabbed Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="vision">Vision</TabsTrigger>
              <TabsTrigger value="examination">Examination</TabsTrigger>
              <TabsTrigger value="blood">Blood Tests</TabsTrigger>
              <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
              <TabsTrigger value="treatment">Advice</TabsTrigger>
              <TabsTrigger value="diagram">Diagram</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Age</p>
                    <p className="font-medium">{caseData.age ? `${caseData.age} years` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{caseData.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">State</p>
                    <p className="font-medium">{caseData.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="font-medium">{caseData.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Patient ID</p>
                    <p className="font-medium">{caseData.patient_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={
                      caseData.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      caseData.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }>{caseData.status || 'active'}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chief Complaint & History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Chief Complaint</p>
                    <p className="text-foreground">{caseData.chief_complaint || 'Not recorded'}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">History of Present Illness</p>
                    <p className="text-foreground">{caseData.history || caseData.history_of_present_illness || 'Not recorded'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Diagnosis & Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Diagnosis</p>
                    <p className="text-foreground">
                      {resolveDiagnosis(caseData.diagnosis)}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Treatment Plan</p>
                    <p className="text-foreground">{caseData.treatment_plan || caseData.treatment || 'Not recorded'}</p>
                  </div>
                  {caseData.follow_up_instructions && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-muted-foreground font-medium mb-1">Follow-up Instructions</p>
                        <p className="text-foreground">{caseData.follow_up_instructions}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab - Past Medical History & Medications */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Past Medical History</CardTitle>
                  <CardDescription>Previous treatments and medical conditions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {caseData.past_medical_history ? (
                    <div>
                      <p className="text-foreground">{caseData.past_medical_history}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No past medical history recorded</p>
                  )}
                </CardContent>
              </Card>

              {/* Past Medications */}
              {caseData.past_medications && Array.isArray(caseData.past_medications) && caseData.past_medications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Past Medications</CardTitle>
                    <CardDescription>Previous medications and treatments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {caseData.past_medications.map((med: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-muted-foreground text-xs">Medicine</p>
                              <p className="font-medium">{resolveMedicineName(med.medicine_name || med.medicine_id)}</p>
                            </div>
                            {med.type && (
                              <div>
                                <p className="text-muted-foreground text-xs">Type</p>
                                <p className="font-medium">{med.type}</p>
                              </div>
                            )}
                            {med.eye && (
                              <div>
                                <p className="text-muted-foreground text-xs">Eye</p>
                                <p className="font-medium">{med.eye}</p>
                              </div>
                            )}
                            {med.advice && (
                              <div>
                                <p className="text-muted-foreground text-xs">Advice</p>
                                <p className="font-medium">{med.advice}</p>
                              </div>
                            )}
                            {med.duration && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Duration</p>
                                <p className="font-medium">{med.duration}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Complaints Tab */}
            <TabsContent value="complaints" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Complaints</CardTitle>
                  <CardDescription>Detailed symptoms and complaints reported by the patient</CardDescription>
                </CardHeader>
                <CardContent>
                  {complaints.length > 0 ? (
                    <div className="space-y-3">
                      {complaints.map((complaint: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            {complaint.category_name && (
                              <div>
                                <p className="text-muted-foreground text-xs">Category</p>
                                <p className="font-medium">{complaint.category_name}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground text-xs">Complaint</p>
                              <p className="font-medium">{complaint.complaint_name || complaint.complaintId || 'N/A'}</p>
                            </div>
                            {complaint.eye_name && (
                              <div>
                                <p className="text-muted-foreground text-xs">Eye</p>
                                <p className="font-medium">{complaint.eye_name}</p>
                              </div>
                            )}
                            {complaint.duration && (
                              <div>
                                <p className="text-muted-foreground text-xs">Duration</p>
                                <p className="font-medium">{complaint.duration}</p>
                              </div>
                            )}
                            {complaint.notes && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Notes</p>
                                <p className="font-medium">{complaint.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No complaints recorded</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vision Tab */}
            <TabsContent value="vision" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Acuity</CardTitle>
                  <CardDescription>Vision test results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Unaided Vision</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Right Eye (OD)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'unaided.right', 'N/A'))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Left Eye (OS)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'unaided.left', 'N/A'))}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Pinhole Vision</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Right Eye (OD)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'pinhole.right', 'N/A'))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Left Eye (OS)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'pinhole.left', 'N/A'))}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Aided Vision (Best Corrected)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Right Eye (OD)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'aided.right', 'N/A'))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Left Eye (OS)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'aided.left', 'N/A'))}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Near Vision</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Right Eye (OD)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'near.right', 'N/A'))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Left Eye (OS)</p>
                          <p className="font-medium">{resolveVisualAcuity(getNestedValue(visionData, 'near.left', 'N/A'))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Refraction Data */}
              {examinationData.refraction && (
                <Card>
                  <CardHeader>
                    <CardTitle>Refraction</CardTitle>
                    <CardDescription>Refractive error measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Distant Vision Refraction */}
                      {examinationData.refraction.distant && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Distant Vision</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border rounded p-3">
                              <p className="text-xs text-muted-foreground mb-2">Right Eye (OD)</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">SPH:</span> {getNestedValue(examinationData, 'refraction.distant.right.sph')}</div>
                                <div><span className="text-muted-foreground">CYL:</span> {getNestedValue(examinationData, 'refraction.distant.right.cyl')}</div>
                                <div><span className="text-muted-foreground">AXIS:</span> {getNestedValue(examinationData, 'refraction.distant.right.axis')}</div>
                                <div><span className="text-muted-foreground">VA:</span> {getNestedValue(examinationData, 'refraction.distant.right.va')}</div>
                              </div>
                            </div>
                            <div className="border rounded p-3">
                              <p className="text-xs text-muted-foreground mb-2">Left Eye (OS)</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-muted-foreground">SPH:</span> {getNestedValue(examinationData, 'refraction.distant.left.sph')}</div>
                                <div><span className="text-muted-foreground">CYL:</span> {getNestedValue(examinationData, 'refraction.distant.left.cyl')}</div>
                                <div><span className="text-muted-foreground">AXIS:</span> {getNestedValue(examinationData, 'refraction.distant.left.axis')}</div>
                                <div><span className="text-muted-foreground">VA:</span> {getNestedValue(examinationData, 'refraction.distant.left.va')}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Near Vision Refraction */}
                      {examinationData.refraction.near && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-2">Near Vision</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border rounded p-3">
                                <p className="text-xs text-muted-foreground mb-2">Right Eye (OD)</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-muted-foreground">SPH:</span> {getNestedValue(examinationData, 'refraction.near.right.sph')}</div>
                                  <div><span className="text-muted-foreground">CYL:</span> {getNestedValue(examinationData, 'refraction.near.right.cyl')}</div>
                                  <div><span className="text-muted-foreground">AXIS:</span> {getNestedValue(examinationData, 'refraction.near.right.axis')}</div>
                                  <div><span className="text-muted-foreground">VA:</span> {getNestedValue(examinationData, 'refraction.near.right.va')}</div>
                                </div>
                              </div>
                              <div className="border rounded p-3">
                                <p className="text-xs text-muted-foreground mb-2">Left Eye (OS)</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div><span className="text-muted-foreground">SPH:</span> {getNestedValue(examinationData, 'refraction.near.left.sph')}</div>
                                  <div><span className="text-muted-foreground">CYL:</span> {getNestedValue(examinationData, 'refraction.near.left.cyl')}</div>
                                  <div><span className="text-muted-foreground">AXIS:</span> {getNestedValue(examinationData, 'refraction.near.left.axis')}</div>
                                  <div><span className="text-muted-foreground">VA:</span> {getNestedValue(examinationData, 'refraction.near.left.va')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Refraction Info */}
                      {(examinationData.refraction.purpose || examinationData.refraction.quality || examinationData.refraction.remark) && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {examinationData.refraction.purpose && (
                              <div>
                                <p className="text-muted-foreground">Purpose</p>
                                <p className="font-medium">{examinationData.refraction.purpose}</p>
                              </div>
                            )}
                            {examinationData.refraction.quality && (
                              <div>
                                <p className="text-muted-foreground">Quality</p>
                                <p className="font-medium">{examinationData.refraction.quality}</p>
                              </div>
                            )}
                            {examinationData.refraction.remark && (
                              <div>
                                <p className="text-muted-foreground">Remarks</p>
                                <p className="font-medium">{examinationData.refraction.remark}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Examination Tab */}
            <TabsContent value="examination" className="space-y-4 mt-4">
              {/* Anterior Segment */}
              {examinationData.anterior_segment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Anterior Segment Examination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['eyelids', 'conjunctiva', 'cornea', 'anterior_chamber', 'iris', 'lens'].map((field) => (
                        examinationData.anterior_segment[field] && (
                          <div key={field}>
                            <h4 className="font-medium text-sm mb-2 capitalize">{field.replace('_', ' ')}</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Right Eye (OD)</p>
                                <p className="font-medium">{getNestedValue(examinationData, `anterior_segment.${field}.right`)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Left Eye (OS)</p>
                                <p className="font-medium">{getNestedValue(examinationData, `anterior_segment.${field}.left`)}</p>
                              </div>
                            </div>
                            {field !== 'lens' && <Separator className="mt-4" />}
                          </div>
                        )
                      ))}
                      {examinationData.anterior_segment.remarks && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-muted-foreground text-sm font-medium mb-1">Remarks</p>
                            <p className="text-sm">{examinationData.anterior_segment.remarks}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Posterior Segment */}
              {examinationData.posterior_segment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Posterior Segment Examination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['vitreous', 'disc', 'retina'].map((field) => (
                        examinationData.posterior_segment[field] && (
                          <div key={field}>
                            <h4 className="font-medium text-sm mb-2 capitalize">{field}</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Right Eye (OD)</p>
                                <p className="font-medium">{getNestedValue(examinationData, `posterior_segment.${field}.right`)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Left Eye (OS)</p>
                                <p className="font-medium">{getNestedValue(examinationData, `posterior_segment.${field}.left`)}</p>
                              </div>
                            </div>
                            {field !== 'retina' && <Separator className="mt-4" />}
                          </div>
                        )
                      ))}
                      {examinationData.posterior_segment.remarks && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-muted-foreground text-sm font-medium mb-1">Remarks</p>
                            <p className="text-sm">{examinationData.posterior_segment.remarks}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            {/* Blood Investigation Tab */}
            <TabsContent value="blood" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blood Investigation</CardTitle>
                  <CardDescription>Blood pressure, sugar levels, and other blood tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {examinationData.blood_investigation?.blood_pressure ? (
                      <div>
                        <p className="text-muted-foreground">Blood Pressure</p>
                        <p className="font-medium">{examinationData.blood_investigation.blood_pressure}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground">Blood Pressure</p>
                        <p className="font-medium text-muted-foreground">Not recorded</p>
                      </div>
                    )}
                    {examinationData.blood_investigation?.blood_sugar ? (
                      <div>
                        <p className="text-muted-foreground">Blood Sugar</p>
                        <p className="font-medium">{examinationData.blood_investigation.blood_sugar}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground">Blood Sugar</p>
                        <p className="font-medium text-muted-foreground">Not recorded</p>
                      </div>
                    )}
                    {examinationData.blood_investigation?.blood_tests && examinationData.blood_investigation.blood_tests.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-2">Blood Tests Ordered</p>
                        <div className="flex flex-wrap gap-2">
                          {examinationData.blood_investigation.blood_tests.map((test: string, idx: number) => (
                            <Badge key={idx} variant="secondary">{resolveBloodTest(test)}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!examinationData.blood_investigation && (
                    <p className="text-sm text-muted-foreground">No blood investigation data recorded</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagnosis & Tests Tab */}
            <TabsContent value="diagnosis" className="space-y-4 mt-4">
              {/* Diagnosis */}
              <Card>
                <CardHeader>
                  <CardTitle>Diagnosis</CardTitle>
                  <CardDescription>Clinical diagnosis based on examination</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-foreground">
                      {resolveDiagnosis(caseData.diagnosis)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Diagnostic Tests */}
              {diagnosticTests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnostic Tests</CardTitle>
                    <CardDescription>Tests performed and their results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {diagnosticTests.map((test: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-muted-foreground text-xs">Test</p>
                              <p className="font-medium">{test.test_name || test.test_id || 'N/A'}</p>
                            </div>
                            {test.eye_name && (
                              <div>
                                <p className="text-muted-foreground text-xs">Eye</p>
                                <p className="font-medium">{test.eye_name}</p>
                              </div>
                            )}
                            {test.type && (
                              <div>
                                <p className="text-muted-foreground text-xs">Type</p>
                                <p className="font-medium">{test.type}</p>
                              </div>
                            )}
                            {test.problem && (
                              <div>
                                <p className="text-muted-foreground text-xs">Problem</p>
                                <p className="font-medium">{test.problem}</p>
                              </div>
                            )}
                            {test.notes && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Notes</p>
                                <p className="font-medium">{test.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* IOP Tests */}
              {(caseData.iop_right || caseData.iop_left) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Intraocular Pressure (IOP)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Right Eye (OD)</p>
                        <p className="font-medium">{caseData.iop_right || 'Not tested'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Left Eye (OS)</p>
                        <p className="font-medium">{caseData.iop_left || 'Not tested'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Treatment/Advice Tab */}
            <TabsContent value="treatment" className="space-y-4 mt-4">
              {/* Medications */}
              <Card>
                <CardHeader>
                  <CardTitle>Prescribed Medications</CardTitle>
                  <CardDescription>Medicines prescribed to the patient</CardDescription>
                </CardHeader>
                <CardContent>
                  {caseData.treatments && Array.isArray(caseData.treatments) && caseData.treatments.length > 0 ? (
                    <div className="space-y-3">
                      {caseData.treatments.map((treatment: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-muted-foreground text-xs">Medication</p>
                              <p className="font-medium">{treatment.drug_name || treatment.drug_id || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Eye</p>
                              <p className="font-medium">{treatment.eye_name || getEyeLabel(treatment.eye) || 'N/A'}</p>
                            </div>
                            {treatment.dosage_name && (
                              <div>
                                <p className="text-muted-foreground text-xs">Dosage</p>
                                <p className="font-medium">{treatment.dosage_name}</p>
                              </div>
                            )}
                            {treatment.route_name && (
                              <div>
                                <p className="text-muted-foreground text-xs">Route</p>
                                <p className="font-medium">{treatment.route_name}</p>
                              </div>
                            )}
                            {treatment.duration && (
                              <div>
                                <p className="text-muted-foreground text-xs">Duration</p>
                                <p className="font-medium">{treatment.duration}</p>
                              </div>
                            )}
                            {treatment.quantity && (
                              <div>
                                <p className="text-muted-foreground text-xs">Quantity</p>
                                <p className="font-medium">{treatment.quantity}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No medications prescribed</p>
                  )}
                </CardContent>
              </Card>

              {/* Surgeries */}
              {examinationData.surgeries && examinationData.surgeries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Advised Surgeries</CardTitle>
                    <CardDescription>Surgical procedures recommended for the patient</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {examinationData.surgeries.map((surgery: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-muted-foreground text-xs">Surgery</p>
                              <p className="font-medium">{surgery.surgery_name || 'N/A'}</p>
                            </div>
                            {surgery.eye_name && (
                              <div>
                                <p className="text-muted-foreground text-xs">Eye</p>
                                <p className="font-medium">{surgery.eye_name}</p>
                              </div>
                            )}
                            {surgery.anesthesia_name && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground text-xs">Anesthesia</p>
                                <p className="font-medium">{surgery.anesthesia_name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Advice Remarks */}
              {caseData.advice_remarks && (
                <Card>
                  <CardHeader>
                    <CardTitle>Advice & Remarks</CardTitle>
                    <CardDescription>Additional instructions and advice for the patient</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{caseData.advice_remarks}</p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Treatment Info */}
              {(caseData.medications_prescribed || caseData.prescription) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Prescription Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{caseData.medications_prescribed || caseData.prescription}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Diagram Tab */}
            <TabsContent value="diagram" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Right Eye Diagram */}
                <Card>
                  <CardHeader>
                    <CardTitle>Right Eye (OD)</CardTitle>
                    <CardDescription>Visual representation of right eye examination</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg bg-gray-50 p-4 flex items-center justify-center" style={{ minHeight: '350px', aspectRatio: '425/350' }}>
                      {examinationData?.diagrams?.right && examinationData.diagrams.right.trim() ? (
                        <img 
                          src={examinationData.diagrams.right} 
                          alt="Right Eye Diagram"
                          className="max-w-full max-h-full"
                          style={{ objectFit: 'contain', display: 'block' }}
                          onLoad={() => console.log('Right diagram loaded')}
                          onError={(e) => {
                            console.error('Right diagram failed to load, showing template')
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const container = target.parentElement
                            if (container && !container.querySelector('img[data-template]')) {
                              const templateImg = document.createElement('img')
                              templateImg.src = '/right-eye.png'
                              templateImg.alt = 'Right Eye Template'
                              templateImg.className = 'max-w-full max-h-full opacity-50'
                              templateImg.style.objectFit = 'contain'
                              templateImg.setAttribute('data-template', 'true')
                              container.appendChild(templateImg)
                            }
                          }}
                        />
                      ) : (
                        <img 
                          src="/right-eye.png" 
                          alt="Right Eye Template"
                          className="max-w-full max-h-full opacity-50"
                          style={{ objectFit: 'contain', display: 'block' }}
                          onError={(e) => {
                            console.error('Template image failed to load')
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const container = target.parentElement
                            if (container) {
                              const placeholder = document.createElement('div')
                              placeholder.className = 'text-sm text-muted-foreground text-center'
                              placeholder.textContent = 'No diagram available'
                              container.appendChild(placeholder)
                            }
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Left Eye Diagram */}
                <Card>
                  <CardHeader>
                    <CardTitle>Left Eye (OS)</CardTitle>
                    <CardDescription>Visual representation of left eye examination</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg bg-gray-50 p-4 flex items-center justify-center" style={{ minHeight: '350px', aspectRatio: '425/350' }}>
                      {examinationData?.diagrams?.left && examinationData.diagrams.left.trim() ? (
                        <img 
                          src={examinationData.diagrams.left} 
                          alt="Left Eye Diagram"
                          className="max-w-full max-h-full"
                          style={{ objectFit: 'contain', display: 'block' }}
                          onLoad={() => console.log('Left diagram loaded')}
                          onError={(e) => {
                            console.error('Left diagram failed to load, showing template')
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const container = target.parentElement
                            if (container && !container.querySelector('img[data-template]')) {
                              const templateImg = document.createElement('img')
                              templateImg.src = '/left-eye.png'
                              templateImg.alt = 'Left Eye Template'
                              templateImg.className = 'max-w-full max-h-full opacity-50'
                              templateImg.style.objectFit = 'contain'
                              templateImg.setAttribute('data-template', 'true')
                              container.appendChild(templateImg)
                            }
                          }}
                        />
                      ) : (
                        <img 
                          src="/left-eye.png" 
                          alt="Left Eye Template"
                          className="max-w-full max-h-full opacity-50"
                          style={{ objectFit: 'contain', display: 'block' }}
                          onError={(e) => {
                            console.error('Template image failed to load')
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const container = target.parentElement
                            if (container) {
                              const placeholder = document.createElement('div')
                              placeholder.className = 'text-sm text-muted-foreground text-center'
                              placeholder.textContent = 'No diagram available'
                              container.appendChild(placeholder)
                            }
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 print:hidden mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

