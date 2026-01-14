"use client"

import * as React from "react"
import { Plus, Search, Filter, Eye, Edit, Trash2, Printer, FileText, ChevronLeft, ChevronRight, FileSignature, Copy, Check } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
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
import { CertificateGeneratorForm } from "@/components/forms/certificate-generator-form"
import { CertificatePrintModal } from "@/components/dialogs/certificate-print-modal"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
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
  const [copiedCertId, setCopiedCertId] = React.useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false)

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

  // Format certificate number: first 8 chars + ellipsis + last 4 chars
  const formatCertNumber = (certNum: string) => {
    if (!certNum) return '-'
    if (certNum.length <= 12) return certNum
    return `${certNum.substring(0, 8)}...${certNum.slice(-4)}`
  }

  // Copy certificate number to clipboard
  const handleCopyCertNumber = async (certNum: string) => {
    try {
      await navigator.clipboard.writeText(certNum)
      setCopiedCertId(certNum)
      setTimeout(() => setCopiedCertId(null), 2000)
    } catch (error) {
      console.error('Failed to copy certificate number:', error)
    }
  }

  // Get initials from patient name
  const getInitials = (name: string) => {
    if (!name) return '?'
    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-jakarta">Medical Certificates</h1>
              <p className="text-muted-foreground">
                Generate and manage medical certificates with ease
              </p>
            </div>
            <CertificateGeneratorForm onSuccess={fetchCertificates}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md gap-2">
                <FileSignature className="h-4 w-4" />
                Generate Certificate
              </Button>
            </CertificateGeneratorForm>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
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
                  className="pl-8 w-[200px] bg-gray-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] bg-white border border-gray-300 rounded-lg text-sm">
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
              <Combobox value={filterStatus} onValueChange={setFilterStatus}>
                <ComboboxTrigger className="w-[150px] bg-white border border-gray-300 rounded-lg text-sm">
                  <ComboboxValue placeholder="Filter by status" />
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxItem value="all">All Status</ComboboxItem>
                  <ComboboxItem value="Issued">Issued</ComboboxItem>
                  <ComboboxItem value="Draft">Draft</ComboboxItem>
                  <ComboboxItem value="Revoked">Revoked</ComboboxItem>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        </div>
        
        {/* Table Section */}
        <div className="px-6 pb-6">
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="uppercase text-xs font-bold text-gray-500 tracking-wider">PATIENT</TableHead>
                  <TableHead className="w-32 uppercase text-xs font-bold text-gray-500 tracking-wider">CERT NO.</TableHead>
                  <TableHead className="w-28 uppercase text-xs font-bold text-gray-500 tracking-wider">DATE</TableHead>
                  <TableHead className="w-32 uppercase text-xs font-bold text-gray-500 tracking-wider">TYPE</TableHead>
                  <TableHead className="w-[200px] uppercase text-xs font-bold text-gray-500 tracking-wider">PURPOSE</TableHead>
                  <TableHead className="w-24 uppercase text-xs font-bold text-gray-500 tracking-wider text-center">STATUS</TableHead>
                  <TableHead className="w-24 uppercase text-xs font-bold text-gray-500 tracking-wider text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        Loading certificates...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : certificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <div>No certificates found</div>
                      <div className="text-sm mt-1">Generate your first certificate to get started</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  certificates.map((cert, index) => {
                    const patientId = (cert as any).patients?.patient_id || '-'
                    const patientName = cert.patient_name || '-'
                    const initials = patientName !== '-' ? getInitials(patientName) : '?'
                    // Use issue_date from the certificate data, fallback to date field
                    const certificateDate = (cert as any).issue_date || cert.date

                    return (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-medium text-sm">
                              {initials}
                            </div>
                            {/* Name and ID */}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {patientName}
                              </span>
                              <span className="text-xs text-blue-600 font-mono">
                                {patientId}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-32">
                          {cert.certificate_number ? (
                            <div className="group relative inline-flex items-center gap-1">
                              <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {formatCertNumber(cert.certificate_number)}
                              </span>
                              <button
                                onClick={() => handleCopyCertNumber(cert.certificate_number)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                title="Copy certificate number"
                              >
                                {copiedCertId === cert.certificate_number ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-500" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="w-28 whitespace-nowrap">
                          {formatDate(certificateDate) === '--' ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            formatDate(certificateDate)
                          )}
                        </TableCell>
                        <TableCell className="w-32">
                          <div className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap">
                            <FileText className="h-3 w-3" />
                            {cert.type}
                          </div>
                        </TableCell>
                        <TableCell className="w-[200px]">
                          {cert.purpose ? (
                            <div 
                              className="max-w-[200px] truncate text-sm text-gray-600" 
                              title={cert.purpose}
                            >
                              {cert.purpose}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="w-24 text-center">
                          {cert.status === "Issued" ? (
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md text-xs font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-700"></div>
                              {cert.status}
                            </div>
                          ) : cert.status === "Draft" ? (
                            <div className="inline-flex items-center bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                              {cert.status}
                            </div>
                          ) : cert.status === "Revoked" ? (
                            <div className="inline-flex items-center bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs font-medium">
                              {cert.status}
                            </div>
                          ) : (
                            <div className="inline-flex items-center bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                              {cert.status}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="w-24 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded hover:bg-indigo-50 hover:text-indigo-600" 
                            title="Print Certificate"
                            onClick={() => {
                              setSelectedCertificate(cert)
                              setIsPrintModalOpen(true)
                            }}
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
                              className="h-8 w-8 rounded hover:bg-red-50 hover:text-red-600" 
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Combobox
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <ComboboxTrigger className="w-[70px] h-8">
                    <ComboboxValue />
                  </ComboboxTrigger>
                  <ComboboxContent>
                    <ComboboxItem value="10">10</ComboboxItem>
                    <ComboboxItem value="20">20</ComboboxItem>
                    <ComboboxItem value="50">50</ComboboxItem>
                    <ComboboxItem value="100">100</ComboboxItem>
                  </ComboboxContent>
                </Combobox>
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
        </div>
      </div>

      {/* Certificate Print Modal */}
      {selectedCertificate && (
        <CertificatePrintModal
          data={{
            id: selectedCertificate.id,
            certificate_number: selectedCertificate.certificate_number,
            date: (selectedCertificate as any).issue_date || selectedCertificate.date,
            issue_date: (selectedCertificate as any).issue_date || selectedCertificate.date,
            patient_name: selectedCertificate.patient_name,
            type: selectedCertificate.type,
            purpose: selectedCertificate.purpose,
            status: selectedCertificate.status,
            content: selectedCertificate.content,
            hospital_name: selectedCertificate.hospital_name,
            hospital_address: selectedCertificate.hospital_address,
            doctor_name: selectedCertificate.doctor_name,
            doctor_qualification: selectedCertificate.doctor_qualification,
            doctor_registration_number: selectedCertificate.doctor_registration_number,
            patients: (selectedCertificate as any).patients,
          }}
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false)
            setSelectedCertificate(null)
          }}
        />
      )}
    </div>
  )
}
