"use client"

import * as React from "react"
import { FolderOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientSearch } from "@/components/features/medical-records/patient-search"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientFolderExplorer } from "@/components/features/medical-records/patient-folder-explorer"
import { RecordViewer } from "@/components/features/medical-records/record-viewer"
import { patientsApi, type Patient, type PatientRecords } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

export default function MedicalRecordsPage() {
  const { toast } = useToast()
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)
  const [oldPatientId, setOldPatientId] = React.useState<string>("")
  const [records, setRecords] = React.useState<PatientRecords | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<{ type: string; record: any } | null>(null)
  const [viewerOpen, setViewerOpen] = React.useState(false)

  // Fetch patient records when patient is selected or old patient ID is entered
  const fetchPatientRecordsCallback = React.useCallback(async (patientId: string) => {
    setLoading(true)
    try {
      const response = await patientsApi.getPatientRecords(patientId)
      
      if (response.success && response.data) {
        setRecords(response.data)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch patient records",
          variant: "destructive"
        })
        setRecords(null)
      }
    } catch (error) {
      console.error("Error fetching patient records:", error)
      toast({
        title: "Error",
        description: "Failed to fetch patient records",
        variant: "destructive"
      })
      setRecords(null)
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    if (selectedPatient) {
      fetchPatientRecordsCallback(selectedPatient.id)
      setOldPatientId("")
    } else if (oldPatientId.trim()) {
      fetchPatientRecordsCallback(oldPatientId.trim())
    } else {
      setRecords(null)
    }
  }, [selectedPatient, oldPatientId, fetchPatientRecordsCallback])



  const handleRecordClick = (type: string, record: any) => {
    setSelectedRecord({ type, record })
    setViewerOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 bg-gray-50 -m-4 p-4 min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-jakarta">Medical Records</h1>
        <p className="text-gray-500">
          View comprehensive medical records for patients in a file management system
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Search */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Patient Search
              </CardTitle>
              <CardDescription>
                Search for a patient to view their complete medical records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PatientSearch
                onSelect={setSelectedPatient}
                selectedPatient={selectedPatient}
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="old_patient_id">Search by Old Patient ID</Label>
                <Input
                  id="old_patient_id"
                  placeholder="Enter old patient ID (e.g., PAT123, OLD-456)"
                  value={oldPatientId}
                  onChange={(e) => {
                    setOldPatientId(e.target.value)
                    if (e.target.value.trim()) {
                      setSelectedPatient(null)
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter an old patient ID to view uploaded records from the old system
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Folder Explorer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Records</CardTitle>
              <CardDescription>
                {selectedPatient
                  ? `Medical records for ${selectedPatient.full_name}`
                  : oldPatientId.trim()
                  ? `Records for old patient ID: ${oldPatientId}`
                  : "Select a patient or enter an old patient ID to view their records"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientFolderExplorer
                records={records}
                onRecordClick={handleRecordClick}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record Viewer Sheet */}
      <RecordViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        recordType={selectedRecord?.type || null}
        record={selectedRecord?.record || null}
      />
    </div>
  )
}

