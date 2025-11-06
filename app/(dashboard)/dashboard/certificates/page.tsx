"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Award,
  Eye,
  Edit,
  Trash2,
  Printer,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CertificateForms } from "@/components/certificate-forms"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

const certificates = [
  {
    id: "CERT001",
    date: "15/11/2025",
    patient_name: "AARAV MEHTA",
    type: "Fitness Certificate",
    purpose: "Employment",
    status: "Issued",
  },
  {
    id: "CERT002",
    date: "14/11/2025",
    patient_name: "PRIYA NAIR",
    type: "Medical Certificate",
    purpose: "Leave Application",
    status: "Issued",
  },
]

export default function CertificatesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="text-muted-foreground">
            Generate and manage medical certificates
          </p>
        </div>
        <CertificateForms>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Certificate
          </Button>
        </CertificateForms>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">527</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">certificates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Requested</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Fitness</div>
            <p className="text-xs text-muted-foreground">certificate type</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">certificates</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Certificate Records</CardTitle>
              <CardDescription>
                View and manage all issued certificates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search certificates..."
                  className="pl-8 w-[200px]"
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
                  <TableHead>CERT NO.</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>PURPOSE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificates.map((cert, index) => (
                  <TableRow key={cert.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{cert.id}</TableCell>
                    <TableCell>{cert.date}</TableCell>
                    <TableCell className="font-medium uppercase">{cert.patient_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cert.type}</Badge>
                    </TableCell>
                    <TableCell>{cert.purpose}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.print()} title="Print">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Delete Certificate"
                          description={`Are you sure you want to delete certificate ${cert.id}? This action cannot be undone.`}
                          onConfirm={() => console.log("Delete certificate:", cert.id)}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
