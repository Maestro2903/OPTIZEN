"use client"

import * as React from "react"
import {
  Stethoscope,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  Activity,
  Printer,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { DeleteConfirmDialog } from "@/components/dialogs/delete-confirm-dialog"
import { OperationForm } from "@/components/forms/operation-form"
import { OperationPrint, type OperationPrintData } from "@/components/print/operation-print"
import { ViewEditDialog } from "@/components/dialogs/view-edit-dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { operationsApi, type Operation, type OperationFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const statusStyles = {
  scheduled: {
    label: "Scheduled",
    pill: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  'in-progress': {
    label: "In Progress",
    pill: "bg-amber-50 text-amber-700 border border-amber-100",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    pill: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    pill: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  unknown: {
    label: "Unknown",
    pill: "bg-gray-50 text-gray-600",
    dot: "bg-gray-400",
  },
} as const

const getStatusStyle = (status: string) => {
  return statusStyles[status as keyof typeof statusStyles] ?? statusStyles.unknown
}

const tableHeaderBaseClass =
  "text-[11px] font-semibold uppercase tracking-wider text-gray-500"

const getPatientInitials = (name?: string | null) => {
  if (!name) return "PT"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const eyeBadgeStyles = {
  left: {
    label: "L",
    className: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  right: {
    label: "R",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  both: {
    label: "B",
    className: "bg-purple-50 text-purple-700 border border-purple-100",
  },
} as const

const getEyeBadgeProps = (eye?: string | null) => {
  if (!eye) return null
  const normalized = eye.toLowerCase()
  if (normalized.startsWith("left")) return eyeBadgeStyles.left
  if (normalized.startsWith("right")) return eyeBadgeStyles.right
  if (normalized.startsWith("both") || normalized.startsWith("bilateral")) return eyeBadgeStyles.both
  return null
}

const formatOperationDate = (dateString?: string | null) => {
  if (!dateString) return "-"
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const formatTimeDisplay = (time?: string | null) => {
  if (!time) return null
  const [hours, minutes] = time.split(":")
  if (!hours || !minutes) return time
  return `${hours}:${minutes}`
}

export default function OperationsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("operation_date")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')
  const [selectedOperationForPrint, setSelectedOperationForPrint] = React.useState<OperationPrintData | null>(null)
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false)
  const [selectedOperation, setSelectedOperation] = React.useState<Operation | null>(null)
  const [formDialogOpen, setFormDialogOpen] = React.useState(false)
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false)

  // API hooks
  const {
    data: operations,
    loading,
    error,
    pagination,
    search,
    sort,
    filter,
    changePage,
    changePageSize,
    addItem,
    updateItem,
    removeItem,
    refresh
  } = useApiList<Operation>(operationsApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createOperation, loading: createLoading } = useApiForm<Operation>()
  const { submitForm: updateOperation, loading: updateLoading } = useApiForm<Operation>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  const handleAddOperation = async (operationData: any) => {
    try {
      const result = await createOperation(
        () => operationsApi.create(operationData),
        {
          successMessage: `Operation scheduled successfully.`,
          onSuccess: (newOperation) => {
            // Add the new operation to the list immediately
            addItem(newOperation)
            // Also refresh to ensure we have the latest data
            refresh()
          }
        }
      )
    } catch (error) {
      console.error('Error creating operation:', error)
    }
  }

  const handleUpdateOperation = async (operationId: string, values: any) => {
    try {
      const result = await updateOperation(
        () => operationsApi.update(operationId, values),
        {
          successMessage: "Operation updated successfully.",
          onSuccess: (updatedOperation) => {
            updateItem(operationId, updatedOperation)
          }
        }
      )
    } catch (error) {
      console.error('Error updating operation:', error)
    }
  }

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim())
      } else {
        search("")
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, search])

  // Memoized pagination handlers to avoid update loops
  const onPageChange = React.useCallback((page: number) => {
    setCurrentPage(page)
    changePage(page)
  }, [changePage])
  const onPageSizeChange = React.useCallback((size: number) => {
    setPageSize(size)
    changePageSize(size)
  }, [changePageSize])

  const handleDeleteOperation = async (operationId: string) => {
    const operation = operations.find(o => o.id === operationId)
    if (!operation) return

    const success = await deleteItem(
      () => operationsApi.delete(operationId),
      {
        successMessage: `Operation ${operation.operation_name} has been cancelled successfully.`,
        onSuccess: () => {
          removeItem(operationId)
        }
      }
    )
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: OperationFilters = {}

    // Collect all status filters
    const statusFilters = filters.filter(f =>
      ["scheduled", "in-progress", "completed", "cancelled"].includes(f)
    )
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  const handleOperationPrintClick = React.useCallback((operation: Operation) => {
    const operationForPrint: OperationPrintData = {
      id: operation.id,
      patient_name: operation.patients?.full_name || "Unknown Patient",
      patient_id: operation.patients?.patient_id || operation.patient_id,
      case_id: operation.case_id,
      case_no: operation.cases?.case_no,
      operation_date: operation.operation_date,
      begin_time: operation.begin_time,
      end_time: operation.end_time,
      operation_name: operation.operation_name,
      operation_type: operation.operation_name,
      surgeon: undefined, // Can be added if available in future
      anesthesiologist: undefined, // Can be added if available in future
      anesthesia: operation.anesthesia,
      anesthesia_type: (operation as any).anesthesia_name || operation.anesthesia,
      sys_diagnosis: operation.sys_diagnosis,
      pre_op_diagnosis: operation.sys_diagnosis,
      post_op_diagnosis: operation.sys_diagnosis,
      procedure_details: operation.operation_notes,
      complications: undefined,
      post_op_instructions: undefined,
      operation_notes: operation.operation_notes,
      notes: operation.operation_notes,
      status: operation.status,
      duration: operation.duration,
      room_number: undefined,
      equipment_used: undefined,
      follow_up_date: operation.follow_up_date,
      follow_up_visit_type: operation.follow_up_visit_type,
      // IOL fields
      iol_name: operation.iol_name,
      iol_power: operation.iol_power,
      eye: operation.eye,
      // Financial fields
      amount: operation.amount,
      payment_mode: operation.payment_mode,
      print_payment: operation.print_payment,
    }
    setSelectedOperationForPrint(operationForPrint)
    setPrintDialogOpen(true)
  }, [])

  const handleViewOperation = React.useCallback((operation: Operation) => {
    setSelectedOperation(operation)
    setViewDialogOpen(true)
  }, [])

  const handleEditOperation = React.useCallback((operation: Operation) => {
    setSelectedOperation(operation)
    setFormDialogOpen(true)
  }, [])

  const handlePrintDialogOpenChange = React.useCallback((open: boolean) => {
    setPrintDialogOpen(open)
    if (!open) {
      setSelectedOperationForPrint(null)
    }
  }, [])

  const handleFormDialogOpenChange = React.useCallback((open: boolean) => {
    setFormDialogOpen(open)
    if (!open) {
      setSelectedOperation(null)
    }
  }, [])

  const handleViewDialogOpenChange = React.useCallback((open: boolean) => {
    setViewDialogOpen(open)
    if (!open) {
      setSelectedOperation(null)
    }
  }, [])

  const handleUpdateOperationSubmit = React.useCallback(async (operationData: any) => {
    if (!selectedOperation) return
    await handleUpdateOperation(selectedOperation.id, operationData)
    setFormDialogOpen(false)
    setSelectedOperation(null)
  }, [selectedOperation, handleUpdateOperation])

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "scheduled", label: "Scheduled", count: operations.filter(o => o.status === "scheduled").length },
      { id: "in-progress", label: "In Progress", count: operations.filter(o => o.status === "in-progress").length },
      { id: "completed", label: "Completed", count: operations.filter(o => o.status === "completed").length },
      { id: "cancelled", label: "Cancelled", count: operations.filter(o => o.status === "cancelled").length },
    ],
    sortOptions: [
      { id: "operation_date", label: "Date" },
      { id: "operation_name", label: "Operation" },
      { id: "status", label: "Status" },
      { id: "amount", label: "Amount" },
    ],
    showExport: false,
    showSettings: false,
  }

  // Calculate statistics
  const totalOperations = pagination?.total || 0
  const scheduledToday = operations.filter(o =>
    o.operation_date === new Date().toISOString().split('T')[0] && o.status === 'scheduled'
  ).length
  const completedToday = operations.filter(o =>
    o.operation_date === new Date().toISOString().split('T')[0] && o.status === 'completed'
  ).length
  const totalRevenue = operations
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.amount || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-6">
      <div className="mx-auto flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-jakarta">Operations</h1>
            <p className="text-muted-foreground">
              Manage surgical operations and procedures
            </p>
          </div>
          <OperationForm onSubmit={handleAddOperation}>
            <Button className="gap-2 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700">
              <Activity className="h-4 w-4" />
              Schedule Operation
            </Button>
          </OperationForm>
        </div>
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Operation Schedule</CardTitle>
                <CardDescription>
                  Manage and track all surgical procedures
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search operations..."
                    className="w-[300px] pl-8"
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
                      description: "Operations export functionality coming soon."
                    })
                  }}
                  onSettings={() => {
                    toast({
                      title: "Settings",
                      description: "Operations settings functionality coming soon."
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
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className={tableHeaderBaseClass}>DATE</TableHead>
                    <TableHead className={tableHeaderBaseClass}>PATIENT</TableHead>
                    <TableHead className={tableHeaderBaseClass}>OPERATION</TableHead>
                    <TableHead className={tableHeaderBaseClass}>EYE</TableHead>
                    <TableHead className={tableHeaderBaseClass}>TIME</TableHead>
                    <TableHead className={tableHeaderBaseClass}>STATUS</TableHead>
                    <TableHead className={`${tableHeaderBaseClass} text-right`}>AMOUNT</TableHead>
                    <TableHead className={`${tableHeaderBaseClass} text-right`}>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Loading operations...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-destructive">
                        Error loading operations: {error}
                      </TableCell>
                    </TableRow>
                  ) : operations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        No operations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    operations.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell className="text-sm font-medium text-gray-900">
                          {formatOperationDate(operation.operation_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-sm font-semibold text-indigo-600">
                              {getPatientInitials(operation.patients?.full_name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {operation.patients?.full_name || 'N/A'}
                              </span>
                              <span className="font-mono text-xs text-blue-600">
                                {operation.patients?.patient_id || '-'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-gray-800">
                          {operation.operation_name}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const eyeValue =
                              ('eye_name' in operation && typeof operation.eye_name === 'string'
                                ? operation.eye_name
                                : operation.eye) || null
                            const badgeProps = getEyeBadgeProps(eyeValue || undefined)
                            if (!badgeProps) {
                              return <span className="text-base text-gray-300">•</span>
                            }
                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeProps.className}`}
                              >
                                {badgeProps.label}
                              </span>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 pr-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {(() => {
                              const formattedStart = formatTimeDisplay(operation.begin_time)
                              const formattedEnd = formatTimeDisplay(operation.end_time)
                              const isOngoing = operation.status === 'in-progress' || !formattedEnd

                              if (!formattedStart && !formattedEnd) {
                                return <span className="text-sm text-muted-foreground">—</span>
                              }

                              return (
                                <>
                                  <span className="tabular-nums text-sm text-gray-700">
                                    {[formattedStart, !isOngoing && formattedEnd ? formattedEnd : null]
                                      .filter(Boolean)
                                      .join(" - ")}
                                  </span>
                                  {isOngoing && (
                                    <span className="tabular-nums text-sm font-bold text-amber-600 animate-pulse">
                                      {formattedStart ? " - Ongoing" : "Ongoing"}
                                    </span>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const statusStyle = getStatusStyle(operation.status)
                            return (
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-xs font-semibold ${statusStyle.pill}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                                {statusStyle.label}
                              </span>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          {operation.amount ? (
                            <span className="font-mono text-sm text-gray-700">
                              ₹{operation.amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="font-mono text-sm text-gray-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              title="View Details"
                              aria-label="View operation"
                              onClick={() => handleViewOperation(operation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                              title="Edit Operation"
                              aria-label="Edit operation"
                              onClick={() => handleEditOperation(operation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md p-1.5 text-gray-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Print Report"
                              aria-label="Print operation report"
                              onClick={() => handleOperationPrintClick(operation)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmDialog
                              title="Cancel Operation"
                              description={`Are you sure you want to cancel the operation "${operation.operation_name}"? This action cannot be undone.`}
                              onConfirm={() => handleDeleteOperation(operation.id)}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete Operation"
                                aria-label="Cancel operation"
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
            <Pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 0}
              pageSize={pagination?.limit || 10}
              totalItems={pagination?.total || 0}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </CardContent>
        </Card>
      {/* Print Dialog */}
      {selectedOperationForPrint && (
        <OperationPrint
          operation={selectedOperationForPrint}
          open={printDialogOpen}
          onOpenChange={handlePrintDialogOpenChange}
        />
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={handleViewDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Operation Details</DialogTitle>
            <DialogDescription>
              View operation information
            </DialogDescription>
          </DialogHeader>
          {selectedOperation && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Operation Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Operation Name</p>
                    <p className="text-sm">{selectedOperation.operation_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="text-sm">{new Date(selectedOperation.operation_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time</p>
                    <p className="text-sm">{selectedOperation.begin_time ? `${selectedOperation.begin_time}${selectedOperation.end_time ? ` - ${selectedOperation.end_time}` : ''}` : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    {(() => {
                      const statusStyle = getStatusStyle(selectedOperation.status)
                      return (
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-xs font-semibold ${statusStyle.pill}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                          {statusStyle.label}
                        </span>
                      )
                    })()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Eye</p>
                    <p className="text-sm">{(selectedOperation as any).eye_name || selectedOperation.eye || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p className="text-sm">{selectedOperation.duration || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                    <p className="text-sm">{selectedOperation.patients?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                    <p className="text-sm">{selectedOperation.patients?.patient_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                    <p className="text-sm">{selectedOperation.patients?.mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{selectedOperation.patients?.email || 'N/A'}</p>
                  </div>
                  {selectedOperation.cases?.case_no && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Case</p>
                      <p className="text-sm">{selectedOperation.cases.case_no}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(selectedOperation.sys_diagnosis || selectedOperation.anesthesia || selectedOperation.operation_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOperation.sys_diagnosis && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                        <p className="text-sm">{selectedOperation.sys_diagnosis}</p>
                      </div>
                    )}
                    {selectedOperation.anesthesia && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Anesthesia</p>
                        <p className="text-sm">{(selectedOperation as any).anesthesia_name || selectedOperation.anesthesia}</p>
                      </div>
                    )}
                    {selectedOperation.operation_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedOperation.operation_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {(selectedOperation.iol_name || selectedOperation.iol_power) && (
                <Card>
                  <CardHeader>
                    <CardTitle>IOL Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedOperation.iol_name && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">IOL Name</p>
                        <p className="text-sm">{selectedOperation.iol_name}</p>
                      </div>
                    )}
                    {selectedOperation.iol_power && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">IOL Power</p>
                        <p className="text-sm">{selectedOperation.iol_power}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {(selectedOperation.payment_mode || selectedOperation.amount) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedOperation.payment_mode && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Payment Mode</p>
                        <p className="text-sm">{selectedOperation.payment_mode}</p>
                      </div>
                    )}
                    {selectedOperation.amount && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Amount</p>
                        <p className="text-sm">₹{selectedOperation.amount.toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {(selectedOperation.print_notes !== undefined || selectedOperation.print_payment !== undefined || selectedOperation.print_iol !== undefined) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Print Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedOperation.print_notes ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {selectedOperation.print_notes && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm">Print Notes</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedOperation.print_payment ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {selectedOperation.print_payment && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm">Print Payment</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedOperation.print_iol ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {selectedOperation.print_iol && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm">Print IOL</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(selectedOperation.follow_up_date || selectedOperation.follow_up_visit_type || selectedOperation.follow_up_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-up Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOperation.follow_up_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Follow-up Date</p>
                          <p className="text-sm">{new Date(selectedOperation.follow_up_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedOperation.follow_up_visit_type && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Follow-up Visit Type</p>
                          <p className="text-sm">{selectedOperation.follow_up_visit_type}</p>
                        </div>
                      )}
                    </div>
                    {selectedOperation.follow_up_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Follow-up Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedOperation.follow_up_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {selectedOperation && (
        <OperationForm
          operationData={{
            id: selectedOperation.id,
            patient_id: selectedOperation.patient_id,
            case_id: selectedOperation.case_id,
            operation_name: selectedOperation.operation_name,
            operation_date: selectedOperation.operation_date,
            begin_time: selectedOperation.begin_time,
            end_time: selectedOperation.end_time,
            eye: selectedOperation.eye,
            sys_diagnosis: selectedOperation.sys_diagnosis,
            anesthesia: selectedOperation.anesthesia,
            operation_notes: selectedOperation.operation_notes,
            payment_mode: selectedOperation.payment_mode,
            amount: selectedOperation.amount,
            iol_name: selectedOperation.iol_name,
            iol_power: selectedOperation.iol_power,
            print_notes: selectedOperation.print_notes,
            print_payment: selectedOperation.print_payment,
            print_iol: selectedOperation.print_iol,
            follow_up_date: selectedOperation.follow_up_date,
            follow_up_visit_type: selectedOperation.follow_up_visit_type,
            follow_up_notes: selectedOperation.follow_up_notes,
            status: selectedOperation.status,
          }}
          mode="edit"
          onSubmit={handleUpdateOperationSubmit}
          open={formDialogOpen}
          onOpenChange={handleFormDialogOpenChange}
        >
          <div style={{ display: 'none' }} />
        </OperationForm>
      )}
      </div>
    </div>
  )
}