"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
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
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { employeesApi, type Employee, type EmployeeFilters } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

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

export default function EmployeesPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("full_name")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

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
      // Backend will generate employee_id
      const result = await createEmployee(
        () => employeesApi.create({
          full_name: employeeData.full_name,
          email: employeeData.email,
          phone: employeeData.phone,
          role: employeeData.role,
          department: employeeData.department,
          hire_date: employeeData.hire_date,
          salary: employeeData.salary,
          address: employeeData.address,
          emergency_contact: employeeData.emergency_contact,
          emergency_phone: employeeData.emergency_phone,
          qualifications: employeeData.qualifications,
          license_number: employeeData.license_number,
          status: 'active'
        }),
        {
          successMessage: `Employee ${employeeData.full_name} has been added successfully.`,
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
    showExport: true,
    showSettings: true,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage staff members and employee records
          </p>
        </div>
        <EmployeeForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </EmployeeForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
            <p className="text-xs text-muted-foreground">employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.role === "doctor").length}</div>
            <p className="text-xs text-muted-foreground">medical professionals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Staff</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.role !== "doctor").length}</div>
            <p className="text-xs text-muted-foreground">nursing & admin</p>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                <TableRow>
                  <TableHead>EMP ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>DEPARTMENT</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>PHONE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee_id}</TableCell>
                      <TableCell className="font-medium uppercase">{employee.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${roleColors[employee.role as keyof typeof roleColors] || ''}`}>
                          {employee.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`capitalize ${statusColors[employee.status as keyof typeof statusColors] || ''}`}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <EmployeeForm>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit employee"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </EmployeeForm>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              window.location.href = `tel:${employee.phone}`
                            }}
                            title={`Call ${employee.phone}`}
                            aria-label={`Call ${employee.full_name}`}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              window.location.href = `mailto:${employee.email}`
                            }}
                            title={`Email ${employee.email}`}
                            aria-label={`Email ${employee.full_name}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Remove Employee"
                            description={`Are you sure you want to remove ${employee.full_name} from the system? This action cannot be undone.`}
                            onConfirm={() => handleDeleteEmployee(employee.id)}
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