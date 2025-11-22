"use client"

import * as React from "react"
import { AlertTriangle, User, Phone, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { patientsApi, type Patient } from "@/lib/services/api"

interface DuplicatePatientDetectorProps {
  mobile: string
  fullName: string
  onSelectExisting: (patient: Patient) => void
  onConfirmNew: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function DuplicatePatientDetector({
  mobile,
  fullName,
  onSelectExisting,
  onConfirmNew,
  isOpen,
  onOpenChange
}: DuplicatePatientDetectorProps) {
  const [possibleDuplicates, setPossibleDuplicates] = React.useState<Patient[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && (mobile || fullName)) {
      checkForDuplicates()
    }
  }, [isOpen, mobile, fullName])

  const checkForDuplicates = async () => {
    setLoading(true)
    try {
      // Search by mobile number first (most accurate)
      if (mobile && mobile.length >= 10) {
        const mobileResponse = await patientsApi.list({
          search: mobile,
          limit: 10
        })

        if (mobileResponse.success && mobileResponse.data && mobileResponse.data.length > 0) {
          setPossibleDuplicates(mobileResponse.data)
          return
        }
      }

      // If no match by mobile, search by name
      if (fullName && fullName.length >= 3) {
        const nameResponse = await patientsApi.list({
          search: fullName,
          limit: 10
        })

        if (nameResponse.success && nameResponse.data && nameResponse.data.length > 0) {
          setPossibleDuplicates(nameResponse.data)
          return
        }
      }

      // No duplicates found
      setPossibleDuplicates([])
    } catch (error) {
      console.error("Error checking for duplicates:", error)
      setPossibleDuplicates([])
    } finally {
      setLoading(false)
    }
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

  const handleSelectExisting = (patient: Patient) => {
    onSelectExisting(patient)
    onOpenChange(false)
  }

  const handleConfirmNew = () => {
    onConfirmNew()
    onOpenChange(false)
  }

  if (possibleDuplicates.length === 0 && !loading) {
    // Auto-confirm if no duplicates
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Possible Duplicate Patient Found
          </DialogTitle>
          <DialogDescription>
            We found {possibleDuplicates.length} existing patient(s) that may match the information you entered.
            Please review and select if this is an existing patient, or confirm to create a new record.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <>
            <Alert variant="destructive" className="bg-orange-50 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-900">Important: Avoid Duplicate Records</AlertTitle>
              <AlertDescription className="text-orange-800">
                Creating duplicate patient records can lead to fragmented medical history and billing issues.
                Please carefully check if any of these patients match before creating a new record.
              </AlertDescription>
            </Alert>

            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-3">
                {possibleDuplicates.map((patient) => (
                  <div
                    key={patient.id}
                    className="rounded-lg border-2 p-4 hover:bg-accent transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-base">{patient.full_name}</span>
                            <Badge variant="outline">{patient.patient_id}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground ml-6">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{patient.mobile}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{calculateAge(patient.date_of_birth)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Gender:</span>{" "}
                              <span className="capitalize">{patient.gender}</span>
                            </div>
                            <div>
                              <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                                {patient.status}
                              </Badge>
                            </div>
                          </div>
                          {patient.email && (
                            <div className="text-xs text-muted-foreground ml-6">
                              Email: {patient.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleSelectExisting(patient)}
                          size="sm"
                          className="ml-auto"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Use This Patient
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button
            onClick={handleConfirmNew}
            variant="outline"
            disabled={loading}
          >
            No, Create New Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
