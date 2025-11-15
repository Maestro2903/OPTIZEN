"use client"

import * as React from "react"
import { Search, User, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { PatientCaseHistoryTabs } from "@/components/patient-case-history-tabs"
import { patientsApi, type Patient } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

interface PatientSelectorWithHistoryProps {
  onSelect: (patient: Patient | null) => void
  selectedPatient: Patient | null
  showCreateNew?: boolean
  onCreateNew?: () => void
  onViewCase?: (caseId: string) => void
  onPrintCase?: (caseId: string) => void
}

export function PatientSelectorWithHistory({
  onSelect,
  selectedPatient,
  showCreateNew = true,
  onCreateNew,
  onViewCase,
  onPrintCase
}: PatientSelectorWithHistoryProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Patient[]>([])
  const [searching, setSearching] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Debounced search
  React.useEffect(() => {
    if (searchQuery.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

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
  }, [searchQuery])

  const performSearch = async (query: string) => {
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
  }

  const handleSelectPatient = (patient: Patient) => {
    onSelect(patient)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleClearSelection = () => {
    onSelect(null)
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

  return (
    <div className="space-y-6">
      {/* Patient Search Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Patient Selection
          </CardTitle>
          <CardDescription>
            Search for an existing patient or create a new patient record
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
                        className="rounded-lg border p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium">{patient.full_name}</span>
                              <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/30">
                                {patient.patient_id}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span>{patient.mobile}</span>
                              <span>{calculateAge(patient.date_of_birth)}</span>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {patient.gender}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="shrink-0">
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
                    {showCreateNew && " You can create a new patient record below."}
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
              {/* Selected Patient Summary */}
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
                        <span className="text-muted-foreground">Patient ID:</span>{" "}
                        <span className="font-mono text-sm font-semibold text-primary">{selectedPatient.patient_id}</span>
                      </div>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Patient History Section - Only show when patient is selected */}
      {selectedPatient && (
        <PatientCaseHistoryTabs
          patient={selectedPatient}
          onViewCase={onViewCase}
          onPrintCase={onPrintCase}
        />
      )}
    </div>
  )
}
