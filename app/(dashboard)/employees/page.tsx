"use client"

import * as React from "react"
import {
  Search,
  Filter,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  MapPin,
  Eye,
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
import { EmployeeForm } from "@/components/employee-form"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { employeesApi, type Employee, type EmployeeFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const statusColors = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-red-100 text-red-700 border-red-200",
}

const roleColors = {
  doctor: "bg-blue-100 text-blue-700 border-blue-200",
  nurse: "bg-green-100 text-green-700 border-green-200",
  technician: "bg-purple-100 text-purple-700 border-purple-200",
  receptionist: "bg-yellow-100 text-yellow-700 border-yellow-200",
  admin: "bg-red-100 text-red-700 border-red-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
}

// Helper function to convert ALL CAPS to Title Case
const toTitleCase = (str: string): string => {
  if (!str) return str
  // If the string is already in a mixed case format, return as is
  // Otherwise, convert from ALL CAPS to Title Case
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle special prefixes like "Dr.", "Mr.", "Mrs.", etc.
      if (word.endsWith('.')) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  if (!name) return ''
  const cleanedName = name.trim().replace(/^dr\.\s+/i, "")
  const words = cleanedName.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

export default function EmployeesPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("full_name")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [viewingEmployee, setViewingEmployee] = React.useState<Employee | null>(null)

  // API hooks
  const {
    data: employees,
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
  } = useApiList<Employee>(employeesApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createEmployee, loading: createLoading } = useApiForm<Employee>()
  const { submitForm: updateEmployee, loading: updateLoading } = useApiForm<Employee>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  // Handle search with debouncing
  // Note: search function excluded from dependencies as it's not stable/memoized by the hook
  // We only want the effect to debounce on searchTerm changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim())
      } else {
        search("")
      }
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // Handle page changes
  // Note: changePage/changePageSize functions excluded as they cause infinite re-renders if not stable
  // We rely on the primitive values (currentPage, pageSize) to trigger the effects
  React.useEffect(() => {
    changePage(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  React.useEffect(() => {
    changePageSize(pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  const handleAddEmployee = async (employeeData: any) => {
    try {
      const result = await createEmployee(
        async () => {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }

          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }

          const response = await fetch('/api/employees', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              employee_id: employeeData.employee_id,
              full_name: employeeData.full_name,
              email: employeeData.email,
              password: employeeData.password,
              phone: employeeData.phone,
              role: employeeData.role,
              department: employeeData.department,
              position: employeeData.position,
              hire_date: employeeData.hire_date,
              salary: employeeData.salary ? parseFloat(employeeData.salary) : undefined,
              address: employeeData.address,
              emergency_contact: employeeData.emergency_contact,
              emergency_phone: employeeData.emergency_phone,
              qualifications: employeeData.qualifications,
              license_number: employeeData.license_number,
              date_of_birth: employeeData.date_of_birth,
              gender: employeeData.gender,
              blood_group: employeeData.blood_group,
              marital_status: employeeData.marital_status,
              is_active: true
            })
          })

          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`)
          }
          return data
        },
        {
          successMessage: `Employee ${employeeData.full_name} has been added successfully with login credentials.`,
          onSuccess: (newEmployee) => {
            addItem(newEmployee)
          }
        }
      )
    } catch (error) {
      console.error('Error creating employee:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add employee. Please try again."
      })
    }
  }

  const handleUpdateEmployee = async (employeeId: string, values: any) => {
    try {
      const result = await updateEmployee(
        () => employeesApi.update(employeeId, values),
        {
          successMessage: "Employee updated successfully.",
          onSuccess: (updatedEmployee) => {
            updateItem(employeeId, updatedEmployee)
          }
        }
      )
    } catch (error) {
      console.error('Error updating employee:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update employee. Please try again."
      })
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (!employee) return

    const success = await deleteItem(
      () => employeesApi.delete(employeeId),
      {
        successMessage: `Employee ${employee.full_name} has been removed successfully.`,
        onSuccess: () => {
          removeItem(employeeId)
        }
      }
    )
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: EmployeeFilters = {}

    const statusFilters = filters.filter(f => ["active", "inactive"].includes(f))
    const roleFilters = filters.filter(f => ["doctor", "nurse", "technician"].includes(f))
    
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters
    }
    if (roleFilters.length > 0) {
      filterParams.role = roleFilters
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  const viewOptionsConfig: ViewOptionsConfig = {
    // Note: Counts removed as they only reflect current page data, not total dataset
    // TODO: Fetch aggregate counts from API separately for accurate totals
    // If API provides total counts per filter, add them back here
    filters: [
      { id: "active", label: "Active" },
      { id: "inactive", label: "Inactive" },
      { id: "doctor", label: "Doctors" },
      { id: "nurse", label: "Nurses" },
      { id: "technician", label: "Technicians" },
    ],
    sortOptions: [
      { id: "full_name", label: "Name" },
      { id: "role", label: "Role" },
      { id: "hire_date", label: "Hire Date" },
      { id: "department", label: "Department" },
    ],
    showExport: false,
    showSettings: true,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">Employees</h1>
          <p className="text-muted-foreground">
            Manage staff members and employee records
          </p>
        </div>
        <EmployeeForm onSubmit={handleAddEmployee}>
          <Button className="gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50">
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        </EmployeeForm>
      </div>

      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>
                View and manage all staff members
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search employees..."
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
                onExport={() => {}}
                onSettings={() => {}}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b">
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">EMP ID</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">EMPLOYEE</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">ROLE</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">DEPARTMENT</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">PHONE</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">STATUS</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wide text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => {
                    // Convert is_active to status for display
                    const displayStatus = employee.is_active ? 'active' : 'inactive'
                    const employeeId = employee.employee_id || '-'
                    const initials = getInitials(employee.full_name)
                    const displayName = toTitleCase(employee.full_name)
                    const phoneNumber = employee.phone || ''
                    const telLink = phoneNumber ? phoneNumber.replace(/\s+/g, '') : ''
                    
                    return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employeeId === '-' ? (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200">
                            Pending
                          </Badge>
                        ) : (
                          employeeId
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 rounded-full">
                            {employee.avatar_url ? (
                              <AvatarImage src={employee.avatar_url} alt={displayName} />
                            ) : null}
                            <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{displayName}</span>
                            <span className="text-xs text-gray-500">{employee.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-0.5 text-xs font-medium capitalize">
                          {employee.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {employee.department && employee.department !== '-' ? (
                          <span className="text-gray-700">{employee.department}</span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {phoneNumber ? (
                          <a
                            href={`tel:${telLink}`}
                            className="text-sm text-gray-600 tabular-nums hover:text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2"
                          >
                            {phoneNumber}
                          </a>
                        ) : (
                          <span className="text-gray-400 italic text-sm">No contact</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${
                            displayStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              displayStatus === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          {displayStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                  onClick={() => setViewingEmployee(employee)}
                                  title="View employee"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View employee</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <EmployeeForm
                                  employee={employee}
                                  onSubmit={(values) => handleUpdateEmployee(employee.id, values)}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </EmployeeForm>
                              </TooltipTrigger>
                              <TooltipContent>Edit employee</TooltipContent>
                            </Tooltip>
                            <DeleteConfirmDialog
                              title="Remove Employee"
                              description={`Are you sure you want to remove ${employee.full_name} from the system? This action cannot be undone.`}
                              onConfirm={() => handleDeleteEmployee(employee.id)}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600"
                                title="Delete employee"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DeleteConfirmDialog>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )})
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

      {/* Employee View Dialog */}
      <Dialog open={!!viewingEmployee} onOpenChange={(open) => !open && setViewingEmployee(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Information</DialogTitle>
            <DialogDescription>View complete employee details</DialogDescription>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900 mt-1">{toTitleCase(viewingEmployee.full_name)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-sm text-gray-900 font-mono mt-1">{viewingEmployee.employee_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-sm text-gray-900 capitalize mt-1">{viewingEmployee.role || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Position/Title</label>
                    <p className="text-sm text-gray-900 mt-1">{viewingEmployee.position || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Department</label>
                    <p className="text-sm text-gray-900 mt-1">{viewingEmployee.department || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hire Date</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewingEmployee.hire_date 
                        ? new Date(viewingEmployee.hire_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900 mt-1">{viewingEmployee.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900 mt-1">{viewingEmployee.phone || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{viewingEmployee.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Salary (Monthly)</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewingEmployee.salary 
                        ? `₹${viewingEmployee.salary.toLocaleString('en-IN')}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Number</label>
                    <p className="text-sm text-gray-900 font-mono mt-1">{viewingEmployee.license_number || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Qualifications</label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{viewingEmployee.qualifications || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact Name</label>
                    <p className="text-sm text-gray-900 mt-1">{viewingEmployee.emergency_contact || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Phone</label>
                    <p className="text-sm text-gray-900 mt-1">{viewingEmployee.emergency_phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewingEmployee.date_of_birth 
                        ? new Date(viewingEmployee.date_of_birth).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-sm text-gray-900 capitalize mt-1">{viewingEmployee.gender || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Blood Group</label>
                    <p className="text-sm text-gray-900 mt-1">{viewingEmployee.blood_group || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Marital Status</label>
                    <p className="text-sm text-gray-900 capitalize mt-1">{viewingEmployee.marital_status || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Status</h3>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${
                        viewingEmployee.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          viewingEmployee.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                      {viewingEmployee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingEmployee(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}