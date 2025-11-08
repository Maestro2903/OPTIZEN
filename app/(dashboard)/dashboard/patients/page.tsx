"use client"

import * as React from "react"
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Printer,
  Users,
  UserPlus,
  TrendingUp,
  Calendar,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewOptions, ViewOptionsConfig } from "@/components/ui/view-options"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/hooks/use-toast"

const patientFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.string().min(1, "Age is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().min(10, "Mobile number is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  state: z.string().min(1, "State is required"),
  address: z.string().optional(),
})

interface Patient {
  id: number
  name: string
  age: number
  email?: string
  mobile: string
  gender: "Male" | "Female" | "Other"
  state: string
  last_visit: string
  status: string
  address?: string
}

const initialPatients: Patient[] = [
  {
    id: 1,
    name: "AARAV MEHTA",
    age: 45,
    email: "aarav.m@email.com",
    mobile: "9856452114",
    gender: "Male",
    state: "Gujarat",
    last_visit: "08/02/2025",
    status: "Active",
  },
  {
    id: 2,
    name: "NISHANT KAREKAR",
    age: 28,
    email: "nishant.k@email.com",
    mobile: "9319018067",
    gender: "Male",
    state: "Maharashtra",
    last_visit: "26/09/2025",
    status: "Active",
  },
  {
    id: 3,
    name: "PRIYA NAIR",
    age: 34,
    email: "priya.n@email.com",
    mobile: "9868412848",
    gender: "Female",
    state: "Maharashtra",
    last_visit: "19/08/2025",
    status: "Active",
  },
  {
    id: 4,
    name: "AISHABEN THAKIR",
    age: 39,
    email: "aisha.t@email.com",
    mobile: "6456445154",
    gender: "Female",
    state: "Gujarat",
    last_visit: "15/08/2025",
    status: "Active",
  },
]

export default function PatientsPage() {
  const { toast } = useToast()
  const [patients, setPatients] = React.useState(initialPatients)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPatient, setEditingPatient] = React.useState<any>(null)
  const [currentView, setCurrentView] = React.useState("list")
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("name")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const form = useForm<z.infer<typeof patientFormSchema>>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: "",
      age: "",
      email: "",
      mobile: "",
      gender: "Male",
      state: "",
      address: "",
    },
  })

  function onSubmit(values: z.infer<typeof patientFormSchema>) {
    if (editingPatient) {
      // Update existing patient
      setPatients(prev => prev.map(p => 
        p.id === editingPatient.id 
          ? { ...p, ...values, age: Number(values.age) }
          : p
      ))
      toast({
        title: "Patient Updated",
        description: `${values.name} has been updated successfully.`,
      })
    } else {
      // Add new patient
      const newPatient = {
        id: Math.max(...patients.map(p => p.id), 0) + 1,
        ...values,
        age: Number(values.age),
        last_visit: new Date().toLocaleDateString('en-GB'),
        status: "Active",
      }
      setPatients(prev => [newPatient, ...prev])
      toast({
        title: "Patient Added",
        description: `${values.name} has been added successfully.`,
      })
    }
    setIsDialogOpen(false)
    setEditingPatient(null)
    form.reset()
  }

  const handleEdit = (patient: any) => {
    setEditingPatient(patient)
    form.reset({
      name: patient.name,
      age: patient.age.toString(),
      email: patient.email,
      mobile: patient.mobile,
      gender: patient.gender,
      state: patient.state,
      address: "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId)
    setPatients(prev => prev.filter(p => p.id !== patientId))
    toast({
      title: "Patient Deleted",
      description: `${patient?.name} has been deleted successfully.`,
      variant: "destructive",
    })
  }

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "active", label: "Active Patients", count: patients.filter(p => p.status === "Active").length },
      { id: "male", label: "Male", count: patients.filter(p => p.gender === "Male").length },
      { id: "female", label: "Female", count: patients.filter(p => p.gender === "Female").length },
      { id: "gujarat", label: "Gujarat", count: patients.filter(p => p.state === "Gujarat").length },
      { id: "maharashtra", label: "Maharashtra", count: patients.filter(p => p.state === "Maharashtra").length },
    ],
    sortOptions: [
      { id: "name", label: "Name" },
      { id: "age", label: "Age" },
      { id: "last_visit", label: "Last Visit" },
      { id: "state", label: "State" },
    ],
    showExport: true,
    showSettings: true,
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view)
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
  }

  const handleSortChange = (sort: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sort)
    setSortDirection(direction)
  }

  const handleExport = () => {
    console.log("Export patients data")
    // Add export functionality here
  }

  const handleSettings = () => {
    console.log("Open patient settings")
    // Add settings functionality here
  }

  // Filter and sort patients based on current selections
  const filteredAndSortedPatients = React.useMemo(() => {
    let filtered = [...patients]

    // Apply text search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        p.mobile.toLowerCase().includes(q) ||
        p.gender.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q)
      )
    }

    // Apply filters
    if (appliedFilters.includes("active")) {
      filtered = filtered.filter(p => p.status === "Active")
    }
    if (appliedFilters.includes("male")) {
      filtered = filtered.filter(p => p.gender === "Male")
    }
    if (appliedFilters.includes("female")) {
      filtered = filtered.filter(p => p.gender === "Female")
    }
    if (appliedFilters.includes("gujarat")) {
      filtered = filtered.filter(p => p.state === "Gujarat")
    }
    if (appliedFilters.includes("maharashtra")) {
      filtered = filtered.filter(p => p.state === "Maharashtra")
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      switch (currentSort) {
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "age":
          aValue = a.age
          bValue = b.age
          break
        case "last_visit":
          aValue = new Date(a.last_visit.split("/").reverse().join("-"))
          bValue = new Date(b.last_visit.split("/").reverse().join("-"))
          break
        case "state":
          aValue = a.state
          bValue = b.state
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [patients, appliedFilters, currentSort, sortDirection, searchTerm])

  // Paginate the filtered data
  const paginatedPatients = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedPatients.slice(startIndex, endIndex)
  }, [filteredAndSortedPatients, currentPage, pageSize])

  const totalPages = Math.ceil(filteredAndSortedPatients.length / pageSize)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, appliedFilters, currentSort, sortDirection])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Manage patient records and information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingPatient(null)
            form.reset()
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPatient ? "Edit Patient" : "Add New Patient"}</DialogTitle>
              <DialogDescription>
                {editingPatient ? "Update patient information" : "Register a new patient in the system"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="AARAV MEHTA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age *</FormLabel>
                        <FormControl>
                          <Input placeholder="45" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="patient@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile *</FormLabel>
                        <FormControl>
                          <Input placeholder="9856452114" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Gujarat">Gujarat</SelectItem>
                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="Delhi">Delhi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Patient address..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    setEditingPatient(null)
                    form.reset()
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingPatient ? "Update Patient" : "Add Patient"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">in last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">scheduled today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Patient Records</CardTitle>
              <CardDescription>
                View and manage all patient information
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ViewOptions
                config={viewOptionsConfig}
                currentView={currentView}
                appliedFilters={appliedFilters}
                currentSort={currentSort}
                sortDirection={sortDirection}
                onViewChange={handleViewChange}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onExport={handleExport}
                onSettings={handleSettings}
              />
            </div>
        </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SR. NO.</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>AGE</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>MOBILE</TableHead>
                  <TableHead>GENDER</TableHead>
                  <TableHead>STATE</TableHead>
                  <TableHead>LAST VISIT</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No patients found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPatients.map((patient, index) => (
                  <TableRow key={patient.id}>
                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="font-medium uppercase">{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{patient.email}</TableCell>
                    <TableCell>{patient.mobile}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{patient.gender}</Badge>
                    </TableCell>
                    <TableCell>{patient.state}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{patient.last_visit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Patient - ${patient.name}`}
                          description={`Details for ${patient.name}`}
                          data={patient}
                          schema={patientFormSchema}
                          renderViewAction={(data: any) => (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Name</p>
                                  <p className="font-semibold uppercase">{data?.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Age</p>
                                  <p className="font-semibold">{data?.age}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Gender</p>
                                  <Badge variant="secondary">{data?.gender}</Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">State</p>
                                  <p className="font-semibold">{data?.state}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p className="text-sm text-muted-foreground">{data?.email || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-muted-foreground">Mobile</p>
                                  <p className="font-semibold">{data?.mobile}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={"name"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Full Name *</FormLabel>
                                      <FormControl>
                                        <Input className="uppercase" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"age"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Age *</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"gender"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Gender *</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Male">Male</SelectItem>
                                          <SelectItem value="Female">Female</SelectItem>
                                          <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"state"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>State *</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select state" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Gujarat">Gujarat</SelectItem>
                                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                                          <SelectItem value="Delhi">Delhi</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"email"}
                                  render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input type="email" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"mobile"}
                                  render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel>Mobile *</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </Form>
                          )}
                          onSaveAction={async (values: any) => {
                            setPatients(prev => prev.map(p => 
                              p.id === patient.id 
                                ? { ...p, ...values, age: Number(values.age) }
                                : p
                            ))
                            toast({
                              title: "Patient Updated",
                              description: `${values.name} has been updated successfully.`,
                            })
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(patient)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.print()}
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Delete Patient"
                          description={`Are you sure you want to delete ${patient.name}? This action cannot be undone.`}
                          onConfirm={() => handleDelete(patient.id)}
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
            totalItems={filteredAndSortedPatients.length}
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
