"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  UserCog,
  Eye,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
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
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"
import * as z from "zod"

interface Employee {
  employee_id: string
  full_name: string
  role: string
  email: string
  phone: string
  address?: string
  joining_date: string
  qualifications?: string
  permissions?: string
  status: "Active" | "Inactive" | "OnLeave"
}

const initialEmployees: Employee[] = [
  {
    employee_id: "EMP001",
    full_name: "Dr. Sarah Martinez",
    role: "Ophthalmologist",
    email: "sarah.m@opticnauts.com",
    phone: "+91 98765 43210",
    address: "123 Medical Plaza, Mumbai",
    joining_date: "2023-01-15",
    qualifications: "MBBS, MS (Ophthalmology)",
    permissions: "All access",
    status: "Active",
  },
  {
    employee_id: "EMP002",
    full_name: "Dr. James Wilson",
    role: "Ophthalmologist",
    email: "james.w@opticnauts.com",
    phone: "+91 98765 43211",
    address: "456 Medical Center, Delhi",
    joining_date: "2023-03-22",
    qualifications: "MBBS, MS (Ophthalmology)",
    permissions: "All access",
    status: "Active",
  },
  {
    employee_id: "EMP003",
    full_name: "Nurse Priya Sharma",
    role: "Nurse",
    email: "priya.s@opticnauts.com",
    phone: "+91 98765 43212",
    address: "789 Health Street, Pune",
    joining_date: "2023-05-10",
    qualifications: "BSc Nursing",
    permissions: "Patient care access",
    status: "Active",
  },
  {
    employee_id: "EMP004",
    full_name: "Rajesh Kumar",
    role: "Receptionist",
    email: "rajesh.k@opticnauts.com",
    phone: "+91 98765 43213",
    address: "321 Admin Block, Chennai",
    joining_date: "2023-07-05",
    qualifications: "BBA",
    permissions: "Reception access",
    status: "Active",
  },
]

const statusColors = {
  Active: "bg-green-100 text-green-700 border-green-200",
  Inactive: "bg-gray-100 text-gray-700 border-gray-200",
  OnLeave: "bg-yellow-100 text-yellow-700 border-yellow-200",
}

export default function EmployeesPage() {
  const { toast } = useToast()
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const handleAddEmployee = (employeeData: Omit<Employee, 'employee_id' | 'status'>) => {
    // Calculate next ID by finding max existing ID number
    const maxId = employees.reduce((max, emp) => {
      const num = parseInt(emp.employee_id.slice(3), 10) || 0
      return num > max ? num : max
    }, 0)
    
    const newEmployee: Employee = {
      employee_id: `EMP${String(maxId + 1).padStart(3, '0')}`,
      ...employeeData,
      status: "Active" as const,
    }
    setEmployees(prev => [newEmployee, ...prev])
    toast({
      title: "Employee Added",
      description: `${newEmployee.full_name} has been added successfully.`,
    })
  }

  const handleUpdateEmployee = (employeeId: string, values: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => 
      emp.employee_id === employeeId ? { ...emp, ...values } : emp
    ))
    toast({
      title: "Employee Updated",
      description: "Employee has been updated successfully.",
    })
  }

  const handleDeleteEmployee = (employeeId: string) => {
    const employee = employees.find(emp => emp.employee_id === employeeId)
    if (!employee) {
      toast({
        title: "Error",
        description: "Employee not found.",
        variant: "destructive",
      })
      return
    }
    setEmployees(prev => prev.filter(emp => emp.employee_id !== employeeId))
    toast({
      title: "Employee Deleted",
      description: `${employee.full_name} has been deleted successfully.`,
      variant: "destructive",
    })
  }

  const filteredEmployees = React.useMemo(() => {
    if (!searchTerm.trim()) return employees
    const q = searchTerm.trim().toLowerCase()
    return employees.filter(emp =>
      emp.employee_id.toLowerCase().includes(q) ||
      emp.full_name.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.phone.toLowerCase().includes(q) ||
      emp.status.toLowerCase().includes(q)
    )
  }, [employees, searchTerm])

  const paginatedEmployees = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredEmployees.slice(startIndex, endIndex)
  }, [filteredEmployees, currentPage, pageSize])

  const totalPages = Math.ceil(filteredEmployees.length / pageSize)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage staff records and roles
          </p>
        </div>
        <EmployeeForm onSubmit={handleAddEmployee}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </EmployeeForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.role === "Ophthalmologist").length}</div>
            <p className="text-xs text-muted-foreground">ophthalmologists</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nurses</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.role === "Nurse").length}</div>
            <p className="text-xs text-muted-foreground">nursing staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.filter(e => e.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">currently active</p>
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
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  <TableHead>EMP ID</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>PHONE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>JOINED</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((emp, index) => (
                  <TableRow key={emp.employee_id}>
                    <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="font-medium">{emp.employee_id}</TableCell>
                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{emp.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {emp.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {emp.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[emp.status as keyof typeof statusColors]}
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(emp.joining_date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Employee - ${emp.full_name}`}
                          description={`${emp.role}`}
                          data={emp as any}
                          renderViewAction={(data: any) => (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Name</p>
                                <p className="font-medium">{data.full_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Role</p>
                                <Badge variant="secondary">{data.role}</Badge>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Email</p>
                                <p className="text-muted-foreground">{data.email}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Phone</p>
                                <p className="text-muted-foreground">{data.phone}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant="outline" className={statusColors[data.status as keyof typeof statusColors]}>{data.status}</Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Joined</p>
                                <p>{data.joined}</p>
                              </div>
                            </div>
                          )}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={"name"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"role"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"email"} render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"phone"} render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"status"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                        <SelectItem value="OnLeave">OnLeave</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                              </div>
                            </Form>
                          )}
                          schema={z.object({
                            name: z.string().min(1),
                            role: z.string().min(1),
                            email: z.string().email(),
                            phone: z.string().min(1),
                            status: z.string().min(1),
                          })}
                          onSaveAction={async (values: any) => {
                            handleUpdateEmployee(emp.employee_id, values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View/Edit">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <DeleteConfirmDialog
                          title="Delete Employee"
                          description={`Are you sure you want to delete ${emp.full_name}? This action cannot be undone.`}
                          onConfirm={() => handleDeleteEmployee(emp.employee_id)}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
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
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredEmployees.length}
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
