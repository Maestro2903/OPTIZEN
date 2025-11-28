"use client"

import * as React from "react"
import { Search, User, Phone, Calendar, History, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { patientsApi, casesApi, type Patient, type Case } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface PatientSearchSelectorProps {
  onSelect: (patient: Patient | null) => void
  selectedPatient: Patient | null
  showCreateNew?: boolean
  onCreateNew?: () => void
}

export function PatientSearchSelector({
  onSelect,
  selectedPatient,
  showCreateNew = true,
  onCreateNew
}: PatientSearchSelectorProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Patient[]>([])
  const [searching, setSearching] = React.useState(false)
  const [patientHistory, setPatientHistory] = React.useState<Case[]>([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Fetch patient history when a patient is selected
  React.useEffect(() => {
    if (selectedPatient) {
      loadPatientHistory(selectedPatient.id)
    } else {
      setPatientHistory([])
    }
  }, [selectedPatient])

  // Debounced search
  const performSearch = React.useCallback(async (query: string) => {
    setSearching(true)
    try {
      const response = await patientsApi.list({
        search: query,
        limit: 10,
        page: 1
      })

      if (response.success && response.data) {
        setSearchResults(response.data)
      } else {
        setSearchResults([])
        if (response.error) {
          toast({
            title: "Search Error",
            description: response.error,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Search Error",
        description: "Failed to search for patients",
        variant: "destructive"
      })
    } finally {
      setSearching(false)
    }
    }, [toast])

    React.useEffect(() => {
    if (searchQuery.length >= 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      // Set new timeout
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery)
      }, 300)
    } else {
      setSearchResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    }, [searchQuery, performSearch])

    const loadPatientHistory = async (patientId: string) => {
    setLoadingHistory(true)
    try {
      const response = await casesApi.list({
        patient_id: patientId,
        sortBy: 'encounter_date',
        sortOrder: 'desc',
        limit: 10
      })

      if (response.success && response.data) {
        setPatientHistory(response.data)
      } else {
        setPatientHistory([])
      }
    } catch (error) {
      console.error("Error loading patient history:", error)
      setPatientHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSelectPatient = (patient: Patient) => {
    onSelect(patient)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleClearSelection = () => {
    onSelect(null)
    setPatientHistory([])
  }

  const calculateAge = (dob: string | undefined): string => {
    if (!dob) return "N/A"
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years`
  }

  const getVisitTypeLabel = (visitType: string | undefined): string => {
    if (!visitType) return "Unknown"
    return visitType
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Patient Search
        </CardTitle>
        <CardDescription>
          Search by name, mobile number, or patient ID to find existing patients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedPatient ? (
          <>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Name, Mobile, or Patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-2">
                  {searchResults.map((patient) => (
                    <div
                      key={patient.id}
                      className="rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{patient.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {patient.patient_id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {patient.mobile}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {calculateAge(patient.date_of_birth)}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {patient.gender}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* No Results */}
            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No patients found</AlertTitle>
                <AlertDescription>
                  No patients match your search criteria.
                  {showCreateNew && (
                    <>
                      <br />
                      You can create a new patient record below.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Create New Button */}
            {showCreateNew && onCreateNew && (
              <div className="pt-2">
                <Button
                  onClick={onCreateNew}
                  variant="outline"
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Create New Patient
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Selected Patient Details */}
            <div className="space-y-4">
              <Alert className="bg-primary/5">
                <User className="h-4 w-4" />
                <AlertTitle>Selected Patient</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-base text-foreground">
                          {selectedPatient.full_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedPatient.patient_id}
                        </div>
                      </div>
                      <Button
                        onClick={handleClearSelection}
                        variant="ghost"
                        size="sm"
                      >
                        Change Patient
                      </Button>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Mobile:</span>{" "}
                        <span className="font-medium">{selectedPatient.mobile}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Age:</span>{" "}
                        <span className="font-medium">{calculateAge(selectedPatient.date_of_birth)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>{" "}
                        <span className="font-medium capitalize">{selectedPatient.gender}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <Badge variant={selectedPatient.status === 'active' ? 'default' : 'secondary'}>
                          {selectedPatient.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Patient Visit History */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Visit History</span>
                  <Badge variant="outline">{patientHistory.length} visits</Badge>
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : patientHistory.length > 0 ? (
                  <ScrollArea className="h-[200px] rounded-md border">
                    <div className="p-3 space-y-2">
                      {patientHistory.map((visit, index) => (
                        <div key={visit.id} className="rounded-md border p-2 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {getVisitTypeLabel(visit.visit_type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {visit.case_no}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {visit.encounter_date ? format(new Date(visit.encounter_date), 'dd MMM yyyy') : 'N/A'}
                            </span>
                          </div>
                          {visit.chief_complaint && (
                            <div className="text-xs text-muted-foreground">
                              Complaint: {visit.chief_complaint}
                            </div>
                          )}
                          {visit.diagnosis && (
                            <div className="text-xs text-muted-foreground">
                              Diagnosis: {Array.isArray(visit.diagnosis) ? visit.diagnosis.join(', ') : visit.diagnosis}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <Alert>
                    <AlertDescription className="text-sm">
                      No previous visits found for this patient.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
