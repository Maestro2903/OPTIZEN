"use client"

import * as React from "react"
import { Plus, Search, Filter, Eye, Edit, Trash2, Printer, FileText, ChevronLeft, ChevronRight } from "lucide-react"
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
import { CertificateGeneratorForm } from "@/components/certificate-generator-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Certificate {
  id: string
  certificate_number: string
  date: string
  patient_name: string
  type: string
  purpose: string
  status: string
  content?: string
  hospital_name?: string
  hospital_address?: string
  doctor_name?: string
  doctor_qualification?: string
  doctor_registration_number?: string
}

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [filterType, setFilterType] = React.useState<string>("all")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")

  const fetchCertificates = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== "all" && { type: filterType }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      })

      const response = await fetch(`/api/certificates?${params}`)
      const data = await response.json()

      if (data.success) {
        setCertificates(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
      } else {
        console.error("Failed to fetch certificates:", data.error)
        setCertificates([])
      }
    } catch (error) {
      console.error("Error fetching certificates:", error)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, filterType, filterStatus])

  React.useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus, pageSize])

  const handleDelete = async (certificateNumber: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateNumber}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        fetchCertificates()
      } else {
        alert(data.error || "Failed to delete certificate")
      }
    } catch (error) {
      console.error("Error deleting certificate:", error)
      alert("Failed to delete certificate. Please try again.")
    }
  }

  const handlePrint = (cert: Certificate) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      })
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${cert.certificate_number}</title>
        <style>
          @page { size: A4; margin: 0.75in; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 0;
            padding: 20pt;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 15pt;
            margin-bottom: 30pt;
          }
          .hospital-name {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 8pt;
            color: #1a1a1a;
          }
          .hospital-address {
            font-size: 11pt;
            color: #555;
            margin-bottom: 12pt;
          }
          .cert-title {
            font-size: 18pt;
            font-weight: bold;
            margin-top: 10pt;
            text-decoration: underline;
          }
          .certificate-body {
            border: 4px double #000;
            padding: 30pt;
            margin: 30pt 0;
            min-height: 300pt;
          }
          .cert-number {
            text-align: right;
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 20pt;
          }
          .content {
            text-align: justify;
            white-space: pre-wrap;
            line-height: 1.8;
            font-size: 12pt;
          }
          .signature-section {
            margin-top: 50pt;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #000;
            padding-top: 8pt;
            margin-top: 40pt;
          }
          .doctor-name {
            font-weight: bold;
            font-size: 13pt;
          }
          .footer {
            margin-top: 40pt;
            padding-top: 15pt;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 9pt;
            color: #666;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-name">${cert.hospital_name || 'EyeCare Medical Center'}</div>
          <div class="hospital-address">${cert.hospital_address || '123 Medical Plaza, Healthcare District'}</div>
          <div class="cert-title">${cert.type?.toUpperCase() || 'MEDICAL CERTIFICATE'}</div>
        </div>

        <div class="certificate-body">
          <div class="cert-number">Certificate No: ${cert.certificate_number}</div>
          <div class="cert-number">Date: ${formatDate(cert.date)}</div>
          
          <div class="content">${cert.content || 'Certificate content not available.'}</div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div>Date: ${formatDate(cert.date)}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <div class="doctor-name">${cert.doctor_name || 'Dr. [Doctor Name]'}</div>
              <div style="font-size: 10pt; margin-top: 5pt;">Medical Practitioner</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div><strong>Certificate Verification</strong></div>
          <div>Certificate No: ${cert.certificate_number} | Issue Date: ${formatDate(cert.date)}</div>
          <div style="margin-top: 5pt;">For verification, please contact the hospital with this certificate number.</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 250);
          }
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medical Certificates</h1>
          <p className="text-muted-foreground">
            Generate and manage medical certificates with ease
          </p>
        </div>
        <CertificateGeneratorForm onSuccess={fetchCertificates}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Certificate
          </Button>
        </CertificateGeneratorForm>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Certificate Records</CardTitle>
              <CardDescription>
                {totalCount} certificate{totalCount !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search certificates..."
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Fitness Certificate">Fitness</SelectItem>
                  <SelectItem value="Medical Certificate">Medical</SelectItem>
                  <SelectItem value="Eye Test Certificate">Eye Test</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SR. NO.</TableHead>
                  <TableHead>PATIENT ID</TableHead>
                  <TableHead>CERT NO.</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>PURPOSE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        Loading certificates...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : certificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <div>No certificates found</div>
                      <div className="text-sm mt-1">Generate your first certificate to get started</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates.map((cert, index) => (
                    <TableRow key={cert.id}>
                      <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-primary">{(cert as any).patients?.patient_id || '-'}</TableCell>
                      <TableCell className="font-medium">{cert.certificate_number}</TableCell>
                      <TableCell>{new Date(cert.date).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell className="font-medium uppercase">{cert.patient_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="whitespace-nowrap">{cert.type}</Badge>
                      </TableCell>
                      <TableCell>{cert.purpose}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={cert.status === "Issued" ? "default" : cert.status === "Draft" ? "outline" : "destructive"}
                        >
                          {cert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title="Print Certificate"
                            onClick={() => handlePrint(cert)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Delete Certificate"
                            description={`Are you sure you want to delete certificate ${cert.certificate_number}? This action cannot be undone.`}
                            onConfirm={() => handleDelete(cert.certificate_number)}
                          >
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive" 
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
