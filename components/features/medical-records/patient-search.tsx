"use client"

import * as React from "react"
import { Search, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { patientsApi, type Patient } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

interface PatientSearchProps {
  onSelect: (patient: Patient | null) => void
  selectedPatient: Patient | null
}

export function PatientSearch({
  onSelect,
  selectedPatient
}: PatientSearchProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Patient[]>([])
  const [searching, setSearching] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>()

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
  }, [searchQuery, performSearch])



  const handleSelectPatient = (patient: Patient) => {
    onSelect(patient)
    setSearchQuery("")
    setSearchResults([])
  }

  const handleClearSelection = () => {
    onSelect(null)
    setSearchQuery("")
    setSearchResults([])
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
    <div className="space-y-4">
      {!selectedPatient ? (
        <>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by Patient ID, Name, or Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="border">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-2">
                  {searchResults.map((patient) => (
                    <div
                      key={patient.id}
                      className="rounded-lg border p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{patient.full_name}</span>
                            <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200">
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
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <User className="h-5 w-5 text-blue-700" />
                  <span className="font-semibold text-lg text-gray-900">
                    {selectedPatient.full_name}
                  </span>
                  <Badge variant="outline" className="text-xs font-mono bg-white text-blue-700 border-blue-300">
                    {selectedPatient.patient_id}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  <span>Mobile: {selectedPatient.mobile}</span>
                  <span>Age: {calculateAge(selectedPatient.date_of_birth)}</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {selectedPatient.gender}
                  </Badge>
                  {selectedPatient.email && (
                    <span>Email: {selectedPatient.email}</span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleClearSelection}
                variant="ghost"
                size="sm"
                className="shrink-0 text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

