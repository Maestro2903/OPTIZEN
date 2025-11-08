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
import { useApiList, useApiForm, useApiDelete } from "@/lib/hooks/useApi"
import { patientsApi, type Patient, type PatientFilters } from "@/lib/services/api"
import { PhoneNumberInput } from "@/components/ui/phone-input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { countries, getStatesForCountry } from "@/lib/utils/countries"

const patientFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  date_of_birth: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().min(10, "Mobile number is required"),
  gender: z.enum(["male", "female", "other"]),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_number: z.string().optional(),
})


export default function PatientsPage() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingPatient, setEditingPatient] = React.useState<Patient | null>(null)
  const [currentView, setCurrentView] = React.useState("list")
  const [appliedFilters, setAppliedFilters] = React.useState<string[]>([])
  const [currentSort, setCurrentSort] = React.useState("full_name")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // API hooks
  const {
    data: patients,
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
  } = useApiList<Patient>(patientsApi.list, {
    page: currentPage,
    limit: pageSize,
    sortBy: currentSort,
    sortOrder: sortDirection
  })

  const { submitForm: createPatient, loading: createLoading } = useApiForm<Patient>()
  const { submitForm: updatePatient, loading: updateLoading } = useApiForm<Patient>()
  const { deleteItem, loading: deleteLoading } = useApiDelete()

  const form = useForm<z.infer<typeof patientFormSchema>>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      full_name: "",
      date_of_birth: "",
      email: "",
      mobile: "",
      gender: "male",
      country: "India",
      state: "",
      address: "",
      city: "",
      postal_code: "",
      emergency_contact: "",
      emergency_phone: "",
      medical_history: "",
      current_medications: "",
      allergies: "",
      insurance_provider: "",
      insurance_number: "",
    },
  })

  // Watch country to update states
  const selectedCountry = form.watch("country")

  async function onSubmit(values: z.infer<typeof patientFormSchema>) {
    try {
      if (editingPatient) {
        // Update existing patient
        const result = await updatePatient(
          () => patientsApi.update(editingPatient.id, {
            ...values,
            patient_id: editingPatient.patient_id,
            status: editingPatient.status
          }),
          {
            successMessage: `${values.full_name} has been updated successfully.`,
            onSuccess: (updatedPatient) => {
              updateItem(editingPatient.id, updatedPatient)
            }
          }
        )
        if (result) {
          setIsDialogOpen(false)
          setEditingPatient(null)
          form.reset()
        }
      } else {
        // Create new patient
        // Generate collision-resistant patient ID
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
        const patientId = `PAT-${timestamp}-${randomSuffix}`
        
        const result = await createPatient(
          () => patientsApi.create({
            ...values,
            patient_id: patientId,
            status: 'active'
          }),
          {
            successMessage: `${values.full_name} has been added successfully.`,
            onSuccess: (newPatient) => {
              addItem(newPatient)
            }
          }
        )
        if (result) {
          setIsDialogOpen(false)
          form.reset()
        }
      }
    } catch (error) {
      console.error('Error submitting patient form:', error)
    }
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    form.reset({
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth || "",
      email: patient.email || "",
      mobile: patient.mobile,
      gender: patient.gender,
      country: (patient as any).country || "India",
      state: patient.state || "",
      address: patient.address || "",
      city: patient.city || "",
      postal_code: patient.postal_code || "",
      emergency_contact: patient.emergency_contact || "",
      emergency_phone: patient.emergency_phone || "",
      medical_history: patient.medical_history || "",
      current_medications: patient.current_medications || "",
      allergies: patient.allergies || "",
      insurance_provider: patient.insurance_provider || "",
      insurance_number: patient.insurance_number || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    const success = await deleteItem(
      () => patientsApi.delete(patientId),
      {
        successMessage: `${patient.full_name} has been deleted successfully.`,
        onSuccess: () => {
          removeItem(patientId)
        }
      }
    )
  }

  const viewOptionsConfig: ViewOptionsConfig = {
    filters: [
      { id: "active", label: "Active Patients", count: patients.filter(p => p.status === "active").length },
      { id: "male", label: "Male", count: patients.filter(p => p.gender === "male").length },
      { id: "female", label: "Female", count: patients.filter(p => p.gender === "female").length },
      { id: "gujarat", label: "Gujarat", count: patients.filter(p => p.state === "Gujarat").length },
      { id: "maharashtra", label: "Maharashtra", count: patients.filter(p => p.state === "Maharashtra").length },
    ],
    sortOptions: [
      { id: "full_name", label: "Name" },
      { id: "date_of_birth", label: "Age" },
      { id: "created_at", label: "Registration Date" },
      { id: "state", label: "State" },
    ],
    showExport: true,
    showSettings: false,
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view)
  }

  const handleFilterChange = (filters: string[]) => {
    setAppliedFilters(filters)
    const filterParams: PatientFilters = {}

    // Collect status filters
    const statusFilters = filters.filter(f => f === "active")
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters
    }
    
    // Collect gender filters
    const genderFilters = filters.filter(f => ["male", "female"].includes(f))
    if (genderFilters.length > 0) {
      filterParams.gender = genderFilters
    }
    
    // Collect state filters
    const stateFilters = filters.filter(f => ["gujarat", "maharashtra"].includes(f))
    if (stateFilters.length > 0) {
      filterParams.state = stateFilters.map(s => s === "gujarat" ? "Gujarat" : "Maharashtra")
    }

    filter(filterParams)
  }

  const handleSortChange = (sortBy: string, direction: 'asc' | 'desc') => {
    setCurrentSort(sortBy)
    setSortDirection(direction)
    sort(sortBy, direction)
  }

  const handleExport = async () => {
    try {
      // Import dynamically to avoid SSR issues
      const { exportToCSV } = await import('@/lib/utils/export')
      exportToCSV(patients, 'patients')
      toast({
        title: "Export successful",
        description: "Patients data has been exported to CSV."
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export patients data."
      })
    }
  }

  const handleSettings = () => {
    console.log("Open patient settings")
    // Add settings functionality here
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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birth = new Date(dateOfBirth)
    // Validate date
    if (isNaN(birth.getTime())) return null
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  }

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
                  name="full_name"
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
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
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
                          <PhoneNumberInput
                            value={field.value}
                            onChange={field.onChange}
                            defaultCountry={selectedCountry === "India" ? "IN" : selectedCountry === "United States" ? "US" : "IN"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={countries}
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            // Reset state when country changes
                            form.setValue("state", "")
                          }}
                          placeholder="Select country"
                          searchPlaceholder="Search countries..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        {getStatesForCountry(selectedCountry).length > 0 ? (
                          <SearchableSelect
                            options={getStatesForCountry(selectedCountry)}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select state/province"
                            searchPlaceholder="Search states..."
                          />
                        ) : (
                          <Input
                            placeholder="Enter state/province"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        )}
                      </FormControl>
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
                  <Button type="submit" disabled={createLoading || updateLoading}>
                    {createLoading || updateLoading ? "Processing..." : (editingPatient ? "Update Patient" : "Add Patient")}
                  </Button>
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
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
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
                  disabled={loading}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Loading patients...
                    </TableCell>
                  </TableRow>
                ) : patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No patients found
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient, index) => (
                  <TableRow key={patient.id}>
                    <TableCell>{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1}</TableCell>
                    <TableCell className="font-medium uppercase">{patient.full_name}</TableCell>
                    <TableCell>{calculateAge(patient.date_of_birth) ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{patient.email || '-'}</TableCell>
                    <TableCell>{patient.mobile}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{patient.gender}</Badge>
                    </TableCell>
                    <TableCell>{patient.state || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(patient.created_at).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Patient - ${patient.full_name}`}
                          description={`Details for ${patient.full_name}`}
                          data={patient}
                          schema={patientFormSchema}
                          renderViewAction={(data: any) => (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Name</p>
                                  <p className="font-semibold uppercase">{data?.full_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Age</p>
                                  <p className="font-semibold">{calculateAge(data?.date_of_birth) ?? 'N/A'}</p>
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
                                  name={"full_name"}
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
                                  name={"date_of_birth"}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Date of Birth</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
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
                                          <SelectItem value="male">Male</SelectItem>
                                          <SelectItem value="female">Female</SelectItem>
                                          <SelectItem value="other">Other</SelectItem>
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
                            try {
                              const result = await updatePatient(
                                () => patientsApi.update(patient.id, values),
                                {
                                  successMessage: `${values.full_name} has been updated successfully.`,
                                  onSuccess: (updatedPatient) => {
                                    updateItem(patient.id, updatedPatient)
                                  }
                                }
                              )
                            } catch (error) {
                              console.error('Error updating patient:', error)
                            }
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
                          description={`Are you sure you want to delete ${patient.full_name}? This action cannot be undone.`}
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
