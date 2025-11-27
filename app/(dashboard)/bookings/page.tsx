"use client"

import * as React from "react"
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { AcceptBookingDialog } from "@/components/dialogs/accept-booking-dialog"
import { BookAppointmentDialog } from "@/components/dialogs/book-appointment-dialog"
import { CalendarPlus } from "lucide-react"

const statusStyles: Record<
  string,
  { container: string; dot: string }
> = {
  pending: {
    container: "border border-amber-100 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  accepted: {
    container: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  rejected: {
    container: "border border-red-100 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
}

const typeColors = {
  consult: "bg-blue-50 text-blue-700",
  "follow-up": "bg-green-50 text-green-700",
  surgery: "bg-red-50 text-red-700",
  refraction: "bg-purple-50 text-purple-700",
  other: "bg-gray-50 text-gray-700",
}

interface AppointmentRequest {
  id: string
  full_name: string
  email: string | null
  mobile: string
  gender: string
  date_of_birth: string | null
  appointment_date: string
  start_time: string
  end_time: string
  type: string
  provider_id: string | null
  reason: string | null
  notes: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  processed_by: string | null
  processed_at: string | null
  patient_id: string | null
  appointment_id: string | null
  provider?: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
  processed_by_user?: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
}

export default function BookingsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("created_at")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  
  // Dialog state
  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [selectedRequest, setSelectedRequest] = React.useState<AppointmentRequest | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [requests, setRequests] = React.useState<AppointmentRequest[]>([])
  const [pagination, setPagination] = React.useState<any>(null)
  const [bookDialogOpen, setBookDialogOpen] = React.useState(false)

  // Fetch requests
  const fetchRequests = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: currentSort,
        sortOrder: sortDirection,
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (appliedFilters.length > 0) {
        const statusFilter = appliedFilters.find(f => ['pending', 'accepted', 'rejected'].includes(f))
        if (statusFilter) {
          params.append('status', statusFilter)
        }
      }

      const response = await fetch(`/api/appointment-requests?${params}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.data || [])
        setPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load booking requests",
        })
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load booking requests",
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, currentSort, sortDirection, searchTerm, appliedFilters, toast])

  React.useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAccept = (request: AppointmentRequest) => {
    setSelectedRequest(request)
    setAcceptDialogOpen(true)
  }

  const handleAcceptSubmit = async (values: any) => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      const response = await fetch(`/api/appointment-requests/${selectedRequest.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Appointment request accepted and appointment created successfully",
        })
        setAcceptDialogOpen(false)
        setSelectedRequest(null)
        fetchRequests()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to accept request",
        })
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept request",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = (request: AppointmentRequest) => {
    setSelectedRequest(request)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return

    setLoading(true)
    try {
      const response = await fetch(`/api/appointment-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectReason }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Appointment request rejected successfully",
        })
        setRejectDialogOpen(false)
        setSelectedRequest(null)
        setRejectReason("")
        fetchRequests()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to reject request",
        })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject request",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = async (values: any) => {
    setLoading(true)
    try {
      // Create appointment request with all the form data
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Booking request created successfully",
        })
        setBookDialogOpen(false)
        fetchRequests()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to create booking request",
        })
      }
    } catch (error) {
      console.error('Error creating booking request:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create booking request",
      })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "??"
    const parts = name.split(" ").filter(Boolean)
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
    return initials || "??"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (time?: string | null) => {
    if (!time) return "--:--"
    return time.slice(0, 5)
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    setCurrentPage(1)
  }

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "pending", label: "Pending" },
      { id: "accepted", label: "Accepted" },
      { id: "rejected", label: "Rejected" },
    ],
    sortOptions: [
      { id: "created_at", label: "Date Created" },
      { id: "appointment_date", label: "Appointment Date" },
      { id: "full_name", label: "Name" },
      { id: "status", label: "Status" },
    ],
    showExport: false,
    showSettings: false,
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-slate-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">Bookings</h1>
          <p className="text-muted-foreground">
            Manage appointment requests from the public booking form
          </p>
        </div>
        <BookAppointmentDialog
          open={bookDialogOpen}
          onOpenChange={setBookDialogOpen}
          onSubmit={handleBookAppointment}
          loading={loading}
        >
          <Button className="gap-2 rounded-lg bg-indigo-600 text-white shadow-md transition-colors hover:bg-indigo-700">
            <CalendarPlus className="h-4 w-4" />
            Book Appointment
          </Button>
        </BookAppointmentDialog>
      </div>

      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Appointment Requests</CardTitle>
              <CardDescription>
                Review and process booking requests from patients
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search requests..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
              </div>
              <ViewOptions
                config={viewOptionsConfig}
                currentView="list"
                appliedFilters={appliedFilters}
                currentSort={currentSort}
                sortDirection={sortDirection}
                onViewChange={() => {}}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onExport={() => {
                  toast({
                    title: "Export feature",
                    description: "Export functionality coming soon.",
                  })
                }}
                onSettings={() => {
                  toast({
                    title: "Settings",
                    description: "Settings functionality coming soon.",
                  })
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 bg-gray-50/80">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Patient</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Contact</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Appointment Date</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Time</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Doctor</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading booking requests...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No booking requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-blue-200 text-sm">
                            <AvatarFallback className="h-full w-full rounded-full bg-blue-100 text-blue-700">
                              {getInitials(request.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {request.full_name}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {request.gender}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {request.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="h-3 w-3" />
                              {request.email}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="h-3 w-3" />
                            {request.mobile}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-700">
                        {formatDate(request.appointment_date)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 tabular-nums">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {formatTime(request.start_time)} - {formatTime(request.end_time)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium capitalize text-gray-600">
                          {request.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {request.provider ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">
                              {request.provider.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Any Available</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                            statusStyles[request.status]?.container ||
                            "border border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              statusStyles[request.status]?.dot || "bg-gray-400"
                            }`}
                          />
                          {request.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                onClick={() => handleAccept(request)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleReject(request)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === 'accepted' && request.appointment_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                window.location.href = `/appointments`
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Appointment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {pagination && (
            <Pagination
              currentPage={pagination.page || 1}
              totalPages={pagination.totalPages || 0}
              pageSize={pagination.limit || 10}
              totalItems={pagination.total || 0}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Accept Dialog */}
      {selectedRequest && (
        <AcceptBookingDialog
          open={acceptDialogOpen}
          onOpenChange={setAcceptDialogOpen}
          bookingRequest={selectedRequest}
          onSubmit={handleAcceptSubmit}
          loading={loading}
        />
      )}

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Appointment Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this appointment request from{' '}
              <strong>{selectedRequest?.full_name}</strong>?
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Rejection Reason (Optional)</label>
                <Textarea
                  className="mt-2"
                  placeholder="Enter reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Rejecting..." : "Reject Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

