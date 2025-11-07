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

const employees = [
  {
    id: "EMP001",
    name: "Dr. Sarah Martinez",
    role: "Ophthalmologist",
    email: "sarah.m@opticnauts.com",
    phone: "+91 98765 43210",
    status: "Active",
    joined: "15/01/2023",
  },
  {
    id: "EMP002",
    name: "Dr. James Wilson",
    role: "Ophthalmologist",
    email: "james.w@opticnauts.com",
    phone: "+91 98765 43211",
    status: "Active",
    joined: "22/03/2023",
  },
  {
    id: "EMP003",
    name: "Nurse Priya Sharma",
    role: "Nurse",
    email: "priya.s@opticnauts.com",
    phone: "+91 98765 43212",
    status: "Active",
    joined: "10/05/2023",
  },
  {
    id: "EMP004",
    name: "Rajesh Kumar",
    role: "Receptionist",
    email: "rajesh.k@opticnauts.com",
    phone: "+91 98765 43213",
    status: "Active",
    joined: "05/07/2023",
  },
]

const statusColors = {
  Active: "bg-green-100 text-green-700 border-green-200",
  Inactive: "bg-gray-100 text-gray-700 border-gray-200",
  OnLeave: "bg-yellow-100 text-yellow-700 border-yellow-200",
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const filteredEmployees = React.useMemo(() => {
    if (!searchTerm.trim()) return employees
    const q = searchTerm.trim().toLowerCase()
    return employees.filter(emp =>
      emp.id.toLowerCase().includes(q) ||
      emp.name.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.phone.toLowerCase().includes(q) ||
      emp.status.toLowerCase().includes(q)
    )
  }, [searchTerm])
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage staff records and roles
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
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">staff members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">ophthalmologists</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nurses</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">nursing staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
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
                {filteredEmployees.map((emp, index) => (
                  <TableRow key={emp.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{emp.id}</TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
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
                    <TableCell>{emp.joined}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Employee - ${emp.name}`}
                          description={`${emp.role}`}
                          data={emp as any}
                          renderViewAction={(data: any) => (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Name</p>
                                <p className="font-medium">{data.name}</p>
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
                          onSaveAction={async (values: any) => {
                            console.log("Update employee", values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View/Edit">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <DeleteConfirmDialog
                          title="Delete Employee"
                          description={`Are you sure you want to delete ${emp.name}? This action cannot be undone.`}
                          onConfirm={() => console.log("Delete employee:", emp.id)}
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
