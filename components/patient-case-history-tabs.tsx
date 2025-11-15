"use client"

import * as React from "react"
import {
  Calendar,
  FileText,
  Eye,
  Pill,
  Activity,
  Printer,
  ChevronDown,
  ChevronUp,
  User,
  Stethoscope,
  ClipboardList,
  TestTube,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { casesApi, type Case, type Patient } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface PatientCaseHistoryTabsProps {
  patient: Patient
  onViewCase?: (caseId: string) => void
  onPrintCase?: (caseId: string) => void
}

export function PatientCaseHistoryTabs({
  patient,
  onViewCase,
  onPrintCase
}: PatientCaseHistoryTabsProps) {
  const { toast } = useToast()
  const [cases, setCases] = React.useState<Case[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expandedCases, setExpandedCases] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (patient) {
      loadPatientCases()
    }
  }, [patient])

  const loadPatientCases = async () => {
    setLoading(true)
    try {
      const response = await casesApi.list({
        patient_id: patient.id,
        sortBy: 'encounter_date',
        sortOrder: 'desc',
        limit: 100 // Get all cases
      })

      if (response.success && response.data) {
        setCases(response.data)
      } else {
        setCases([])
        if (response.error) {
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Error loading patient cases:", error)
      setCases([])
    } finally {
      setLoading(false)
    }
  }

  const toggleCaseExpansion = (caseId: string) => {
    setExpandedCases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(caseId)) {
        newSet.delete(caseId)
      } else {
        newSet.add(caseId)
      }
      return newSet
    })
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A"
    try {
      return format(new Date(date), "dd MMM yyyy")
    } catch {
      return date
    }
  }

  const formatDiagnosis = (diagnosis: string | string[] | undefined | null): string => {
    if (!diagnosis) return "No diagnosis recorded"
    if (Array.isArray(diagnosis)) {
      return diagnosis.length > 0 ? diagnosis.join(", ") : "No diagnosis recorded"
    }
    return diagnosis
  }

  const getCaseStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'active':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const renderComplaintsSection = (caseItem: Case) => {
    if (!caseItem.complaints || caseItem.complaints.length === 0) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Complaints
        </div>
        <div className="space-y-1">
          {caseItem.complaints.map((complaint, idx) => (
            <div key={idx} className="text-sm pl-6">
              • {(complaint as any).complaint_name || "Complaint"}
              {(complaint as any).duration && (
                <span className="text-muted-foreground"> ({(complaint as any).duration})</span>
              )}
              {(complaint as any).eye_name && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {(complaint as any).eye_name}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTreatmentsSection = (caseItem: Case) => {
    if (!caseItem.treatments || caseItem.treatments.length === 0) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Pill className="h-4 w-4" />
          Treatments & Medications
        </div>
        <div className="space-y-2">
          {caseItem.treatments.map((treatment, idx) => (
            <div key={idx} className="text-sm pl-6 p-2 bg-muted/50 rounded">
              <div className="font-medium">
                {treatment.drug_name || "Medication"}
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-x-2">
                {treatment.dosage_name && (
                  <span>Dosage: {treatment.dosage_name}</span>
                )}
                {treatment.route_name && (
                  <span>• Route: {treatment.route_name}</span>
                )}
                {treatment.duration && (
                  <span>• Duration: {treatment.duration}</span>
                )}
                {treatment.eye && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {treatment.eye}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDiagnosticTestsSection = (caseItem: Case) => {
    if (!caseItem.diagnostic_tests || caseItem.diagnostic_tests.length === 0) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <TestTube className="h-4 w-4" />
          Diagnostic Tests
        </div>
        <div className="space-y-1">
          {caseItem.diagnostic_tests.map((test, idx) => (
            <div key={idx} className="text-sm pl-6">
              • {(test as any).test_name || "Test"}
              {(test as any).eye && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {(test as any).eye}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderVisionDataSection = (caseItem: Case) => {
    if (!caseItem.vision_data) return null

    const visionData = caseItem.vision_data as any

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Eye className="h-4 w-4" />
          Vision Assessment
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm pl-6">
          {visionData.unaided && (
            <div className="p-2 bg-muted/50 rounded">
              <div className="font-medium text-xs text-muted-foreground">Unaided</div>
              {visionData.unaided.right && <div>Right: {visionData.unaided.right}</div>}
              {visionData.unaided.left && <div>Left: {visionData.unaided.left}</div>}
            </div>
          )}
          {visionData.aided && (
            <div className="p-2 bg-muted/50 rounded">
              <div className="font-medium text-xs text-muted-foreground">Aided</div>
              {visionData.aided.right && <div>Right: {visionData.aided.right}</div>}
              {visionData.aided.left && <div>Left: {visionData.aided.left}</div>}
            </div>
          )}
          {visionData.pinhole && (
            <div className="p-2 bg-muted/50 rounded">
              <div className="font-medium text-xs text-muted-foreground">Pinhole</div>
              {visionData.pinhole.right && <div>Right: {visionData.pinhole.right}</div>}
              {visionData.pinhole.left && <div>Left: {visionData.pinhole.left}</div>}
            </div>
          )}
          {visionData.near && (
            <div className="p-2 bg-muted/50 rounded">
              <div className="font-medium text-xs text-muted-foreground">Near</div>
              {visionData.near.right && <div>Right: {visionData.near.right}</div>}
              {visionData.near.left && <div>Left: {visionData.near.left}</div>}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderExaminationSection = (caseItem: Case) => {
    const hasExamData = caseItem.examination_data || 
                        caseItem.examination_findings ||
                        caseItem.history_of_present_illness ||
                        caseItem.past_medical_history

    if (!hasExamData) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Stethoscope className="h-4 w-4" />
          Examination & History
        </div>
        <div className="space-y-2 pl-6 text-sm">
          {caseItem.history_of_present_illness && (
            <div className="p-2 bg-muted/50 rounded">
              <div className="font-medium text-xs text-muted-foreground mb-1">Present Illness</div>
              <div>{caseItem.history_of_present_illness}</div>
            </div>
          )}
          {caseItem.past_medical_history && (
            <div className="p-2 bg-muted/50 rounded">
              <div className="font-medium text-xs text-muted-foreground mb-1">Medical History</div>
              <div>{caseItem.past_medical_history}</div>
            </div>
          )}
          {caseItem.examination_findings && (
            <div className="p-2 bg-muted/50 rounded">
              <div className="font-medium text-xs text-muted-foreground mb-1">Examination Findings</div>
              <div>{caseItem.examination_findings}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderCaseCard = (caseItem: Case, index: number) => {
    const isExpanded = expandedCases.has(caseItem.id)

    return (
      <Card key={caseItem.id} className="overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={() => toggleCaseExpansion(caseItem.id)}>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <div className="font-semibold text-base">{caseItem.case_no || `Case #${index + 1}`}</div>
                  <Badge variant="outline" className="text-xs">
                    {caseItem.visit_type || "Visit"}
                  </Badge>
                  <Badge className={getCaseStatusColor(caseItem.status)}>
                    {caseItem.status || "Active"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground ml-8">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(caseItem.encounter_date)}
                  </div>
                  {caseItem.chief_complaint && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {caseItem.chief_complaint.substring(0, 50)}
                      {caseItem.chief_complaint.length > 50 && "..."}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {onViewCase && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewCase(caseItem.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onPrintCase && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPrintCase(caseItem.id)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <CollapsibleContent className="mt-4">
              <Separator className="mb-4" />
              <div className="space-y-4">
                {/* Diagnosis */}
                {caseItem.diagnosis && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      Diagnosis
                    </div>
                    <div className="text-sm pl-6 font-medium">
                      {formatDiagnosis(caseItem.diagnosis)}
                    </div>
                  </div>
                )}

                {/* Complaints */}
                {renderComplaintsSection(caseItem)}

                {/* Vision Data */}
                {renderVisionDataSection(caseItem)}

                {/* Examination & History */}
                {renderExaminationSection(caseItem)}

                {/* Treatments */}
                {renderTreatmentsSection(caseItem)}

                {/* Diagnostic Tests */}
                {renderDiagnosticTestsSection(caseItem)}

                {/* Treatment Plan */}
                {caseItem.treatment_plan && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Treatment Plan
                    </div>
                    <div className="text-sm pl-6 p-2 bg-muted/50 rounded">
                      {caseItem.treatment_plan}
                    </div>
                  </div>
                )}

                {/* Follow-up Instructions */}
                {caseItem.follow_up_instructions && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Follow-up Instructions
                    </div>
                    <div className="text-sm pl-6 p-2 bg-muted/50 rounded">
                      {caseItem.follow_up_instructions}
                    </div>
                  </div>
                )}

                {/* Advice & Remarks */}
                {caseItem.advice_remarks && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Advice & Remarks
                    </div>
                    <div className="text-sm pl-6 p-2 bg-muted/50 rounded">
                      {caseItem.advice_remarks}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </Card>
    )
  }

  const renderSummaryStats = () => {
    const totalVisits = cases.length
    const completedCases = cases.filter(c => c.status === 'completed').length
    const activeCases = cases.filter(c => c.status === 'active').length
    const lastVisit = cases.length > 0 ? cases[0] : null

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Visits</CardDescription>
            <CardTitle className="text-2xl">{totalVisits}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">{completedCases}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{activeCases}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Last Visit</CardDescription>
            <CardTitle className="text-lg">
              {lastVisit ? formatDate(lastVisit.encounter_date) : "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="ml-2">Loading patient history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Case History</CardTitle>
          <CardDescription>All previous visits and medical records</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              No previous visits found for this patient. This will be their first visit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Patient Case History
        </CardTitle>
        <CardDescription>
          Complete medical record for {patient.full_name} ({patient.patient_id})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4 mt-4">
            {renderSummaryStats()}
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {cases.map((caseItem, index) => renderCaseCard(caseItem, index))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <div className="space-y-4">
              {renderSummaryStats()}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visit Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cases.map((caseItem, index) => (
                    <div key={caseItem.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                        {formatDate(caseItem.encounter_date)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{caseItem.case_no}</span>
                          <Badge variant="outline" className="text-xs">
                            {caseItem.visit_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Diagnosis:</strong> {formatDiagnosis(caseItem.diagnosis)}
                        </div>
                        {caseItem.chief_complaint && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Complaint:</strong> {caseItem.chief_complaint}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <div className="space-y-4">
              {renderSummaryStats()}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visit Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['First', 'Follow-up-1', 'Follow-up-2', 'Follow-up-3'].map(visitType => {
                      const count = cases.filter(c => c.visit_type === visitType).length
                      if (count === 0) return null
                      return (
                        <div key={visitType} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{visitType}</span>
                          <Badge variant="secondary">{count} visits</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['active', 'completed', 'cancelled', 'pending'].map(status => {
                      const count = cases.filter(c => c.status === status).length
                      if (count === 0) return null
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{status}</span>
                          <Badge className={getCaseStatusColor(status)}>{count} cases</Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
