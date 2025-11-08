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
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { operationsApi, type Operation, type OperationFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  'in-progress': "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

const statusLabels = {
  scheduled: "Scheduled",
  'in-progress': "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

export default function OperationsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("operation_date")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

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
            addItem(newOperation)
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

  // Handle page changes
  React.useEffect(() => {
    changePage(currentPage)
  }, [currentPage, changePage])

  React.useEffect(() => {
    changePageSize(pageSize)
  }, [pageSize, changePageSize])

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
    showExport: true,
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOperations}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledToday}</div>
            <p className="text-xs text-muted-foreground">operations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">operations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">completed operations</p>
          </CardContent>
        </Card>
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
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading operations...
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
                      <TableCell className="font-medium uppercase">
                        {operation.patients?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {operation.operation_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {operation.eye || 'N/A'}
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
                          className={statusColors[operation.status as keyof typeof statusColors]}
                        >
                          {statusLabels[operation.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {operation.amount ? `₹${operation.amount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
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
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}