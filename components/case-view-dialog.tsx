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
import { CasePrint } from "@/components/case-print"

interface CaseViewDialogProps {
  children: React.ReactNode
  caseData: any
}

export function CaseViewDialog({ children, caseData }: CaseViewDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <p className="font-semibold">{caseData.case_date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-semibold uppercase">{caseData.patient_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Visit Type</p>
              <Badge variant="secondary">{caseData.visit_no}</Badge>
            </div>
          </div>

          <Separator />

          {/* Patient Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Patient Information</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Age</p>
                <p className="font-medium">{caseData.age} years</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium">{caseData.gender}</p>
              </div>
              <div>
                <p className="text-muted-foreground">State</p>
                <p className="font-medium">{caseData.state}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Medical Details - Sample structure */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Medical Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Chief Complaint</p>
                <p className="text-foreground">Sample complaint details would appear here based on the case data.</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Diagnosis</p>
                <p className="text-foreground">Sample diagnosis would appear here.</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Prescribed Treatment</p>
                <p className="text-foreground">Sample treatment plan would appear here.</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vision Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Vision & Examination</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Right Eye</p>
                <p className="font-medium">6/6</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Left Eye</p>
                <p className="font-medium">6/6</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

