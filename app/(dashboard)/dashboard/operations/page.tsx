"use client"

import * as React from "react"
import {
  Stethoscope,
  Plus,
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
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { OperationForm } from "@/components/operation-form"
import { OperationPrint, type OperationPrintData } from "@/components/operation-print"
import { ViewEditDialog } from "@/components/view-edit-dialog"
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

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  'in-progress': "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  unknown: "bg-gray-100 text-gray-700 border-gray-200", // fallback for unexpected status
} as const

const statusLabels = {
  scheduled: "Scheduled",
  'in-progress': "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  unknown: "Unknown", // fallback for unexpected status
} as const

// Helper to safely get status color/label
const getStatusColor = (status: string): string => {
  return statusColors[status as keyof typeof statusColors] ?? statusColors.unknown
}

const getStatusLabel = (status: string): string => {
  return statusLabels[status as keyof typeof statusLabels] ?? statusLabels.unknown
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
      operation_no: operation.id.substring(0, 8).toUpperCase(),
      patient_name: operation.patients?.full_name || "Unknown Patient",
      patient_id: operation.patients?.patient_id || operation.patient_id,
      operation_date: operation.operation_date,
      operation_time: operation.begin_time || operation.operation_date,
      operation_type: operation.operation_name,
      surgeon: "N/A",
      anesthesiologist: "N/A",
      anesthesia_type: (operation as any).anesthesia_name || operation.anesthesia || undefined,
      pre_op_diagnosis: operation.sys_diagnosis || undefined,
      post_op_diagnosis: operation.sys_diagnosis || undefined,
      procedure_details: operation.operation_notes || undefined,
      complications: undefined,
      post_op_instructions: undefined,
      status: operation.status,
      duration: operation.duration
        || (operation.begin_time && operation.end_time
          ? `${operation.begin_time} - ${operation.end_time}`
          : undefined),
      room_number: undefined,
      equipment_used: undefined,
      notes: operation.operation_notes,
      follow_up_date: undefined,
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
          <p className="text-muted-foreground">
            Manage surgical operations and procedures
          </p>
        </div>
        <OperationForm onSubmit={handleAddOperation}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Schedule Operation
          </Button>
        </OperationForm>
      </div>

      <Card>
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
                <TableRow>
                  <TableHead>DATE</TableHead>
                  <TableHead>PATIENT ID</TableHead>
                  <TableHead>PATIENT</TableHead>
                  <TableHead>OPERATION</TableHead>
                  <TableHead>EYE</TableHead>
                  <TableHead>TIME</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading operations...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-destructive">
                      Error loading operations: {error}
                    </TableCell>
                  </TableRow>
                ) : operations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No operations found
                    </TableCell>
                  </TableRow>
                ) : (
                  operations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell className="text-sm">
                        {new Date(operation.operation_date).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-primary">
                        {operation.patients?.patient_id || '-'}
                      </TableCell>
                      <TableCell className="font-medium uppercase">
                        {operation.patients?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {operation.operation_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {'eye_name' in operation && typeof operation.eye_name === 'string' ? operation.eye_name : operation.eye || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {operation.begin_time} - {operation.end_time || 'Ongoing'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(operation.status)}
                        >
                          {getStatusLabel(operation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {operation.amount ? `₹${operation.amount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title="View"
                            onClick={() => handleViewOperation(operation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            title="Edit"
                            onClick={() => handleEditOperation(operation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Print Operation Report"
                            onClick={() => handleOperationPrintClick(operation)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Cancel Operation"
                            description={`Are you sure you want to cancel the operation "${operation.operation_name}"? This action cannot be undone.`}
                            onConfirm={() => handleDeleteOperation(operation.id)}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
                    <Badge className={getStatusColor(selectedOperation.status)}>
                      {getStatusLabel(selectedOperation.status)}
                    </Badge>
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
  )
}