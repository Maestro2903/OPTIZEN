"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { useMasterData } from "@/hooks/use-master-data"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const employeeFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  employee_id: z.string().min(1, "Employee ID is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  hire_date: z.string().min(1, "Hire date is required"),
  salary: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  qualifications: z.string().optional(),
  license_number: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  marital_status: z.string().optional(),
}).superRefine((data, ctx) => {
  // For new employees (when there's no existing employee), password is required
  if (!data.password || data.password.length === 0) {
    // Password validation will be handled in the component based on edit mode
    return
  }
  
  // If password is provided, validate it
  if (data.password && data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 6 characters long",
      path: ["password"],
    })
  }
  
  // Passwords must match if confirmPassword is provided
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
  }
})

export type EmployeeFormData = z.infer<typeof employeeFormSchema>

interface EmployeeFormProps {
  children: React.ReactNode
  employee?: any // Employee data for editing
  onSubmit?: (data: EmployeeFormData) => void | Promise<void>
}

export function EmployeeForm({ children, employee, onSubmit: onSubmitCallback }: EmployeeFormProps) {
  const masterData = useMasterData()
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  
  // Generate next employee ID
  const generateEmployeeId = React.useCallback(() => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `EMP${year}${random}`
  }, [])

  // Transform master data roles to match DB enum (lowercase values)
  const roleOptions = React.useMemo(() => {
    if (masterData.data.roles && masterData.data.roles.length > 0) {
      return masterData.data.roles.map(role => ({
        value: role.value.toLowerCase().replace(/\s+/g, '_'), // Convert to lowercase and replace spaces with underscores
        label: role.label
      }))
    }
    // Fallback roles matching DB enum
    return [
      { value: 'doctor', label: 'Doctor' },
      { value: 'nurse', label: 'Nurse' },
      { value: 'receptionist', label: 'Receptionist' },
      { value: 'optometrist', label: 'Optometrist' },
      { value: 'ophthalmologist', label: 'Ophthalmologist' },
      { value: 'technician', label: 'Technician' },
      { value: 'pharmacy_staff', label: 'Pharmacy Staff' },
      { value: 'lab_technician', label: 'Lab Technician' },
      { value: 'billing_staff', label: 'Billing Staff' },
      { value: 'admin', label: 'Admin' },
      { value: 'hospital_admin', label: 'Hospital Admin' },
      { value: 'manager', label: 'Manager' },
      { value: 'finance', label: 'Finance' },
    ]
  }, [masterData.data.roles])

  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      full_name: employee?.full_name ?? '',
      employee_id: employee?.employee_id ?? generateEmployeeId(),
      role: employee?.role ?? 'doctor',
      email: employee?.email ?? '',
      phone: employee?.phone ?? '',
      password: '',
      confirmPassword: '',
      department: employee?.department ?? '',
      position: employee?.position ?? '',
      address: employee?.address ?? '',
      hire_date: employee?.hire_date ?? new Date().toISOString().split("T")[0],
      salary: employee?.salary?.toString() ?? '',
      emergency_contact: employee?.emergency_contact ?? '',
      emergency_phone: employee?.emergency_phone ?? '',
      qualifications: employee?.qualifications ?? '',
      license_number: employee?.license_number ?? '',
      date_of_birth: employee?.date_of_birth ?? '',
      gender: employee?.gender ?? '',
      blood_group: employee?.blood_group ?? '',
      marital_status: employee?.marital_status ?? '',
    },
  })
  
  // Reset form when dialog opens or employee changes
  React.useEffect(() => {
    if (open) {
      if (employee) {
        // Editing existing employee
        form.reset({
          full_name: employee.full_name ?? '',
          employee_id: employee.employee_id ?? '',
          role: employee.role ?? 'doctor',
          email: employee.email ?? '',
          phone: employee.phone ?? '',
          department: employee.department ?? '',
          position: employee.position ?? '',
          address: employee.address ?? '',
          hire_date: employee.hire_date ?? new Date().toISOString().split("T")[0],
          salary: employee.salary?.toString() ?? '',
          emergency_contact: employee.emergency_contact ?? '',
          emergency_phone: employee.emergency_phone ?? '',
          qualifications: employee.qualifications ?? '',
          license_number: employee.license_number ?? '',
          date_of_birth: employee.date_of_birth ?? '',
          gender: employee.gender ?? '',
          blood_group: employee.blood_group ?? '',
          marital_status: employee.marital_status ?? '',
          password: undefined,
          confirmPassword: undefined,
        })
      } else {
        // Creating new employee - reset with defaults
        form.reset({
          full_name: '',
          employee_id: generateEmployeeId(),
          role: 'doctor',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          department: '',
          position: '',
          address: '',
          hire_date: new Date().toISOString().split("T")[0],
          salary: '',
          emergency_contact: '',
          emergency_phone: '',
          qualifications: '',
          license_number: '',
          date_of_birth: '',
          gender: '',
          blood_group: '',
          marital_status: '',
        })
      }
      
      // Load roles from master data when dialog opens
      masterData.fetchCategory('roles')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee])

  async function onSubmit(values: z.infer<typeof employeeFormSchema>) {
    // Validate password for new employees
    if (!employee && (!values.password || values.password.length < 6)) {
      form.setError("password", {
        type: "manual",
        message: "Password is required and must be at least 6 characters long"
      })
      return
    }

    if (!employee && values.password !== values.confirmPassword) {
      form.setError("confirmPassword", {
        type: "manual",
        message: "Passwords do not match"
      })
      return
    }

    if (onSubmitCallback) {
      setIsLoading(true)
      try {
        // Don't send confirmPassword to the API
        const { confirmPassword, ...submitData } = values
        await onSubmitCallback(submitData)
        setOpen(false)
        form.reset()
      } catch (error) {
        console.error("Error submitting employee form:", error)
        form.setError("root", {
          type: "submit",
          message: "Failed to submit. Please try again."
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isLoading) {
        setOpen(newOpen)
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information' : 'Add new staff member with role and permissions'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Sarah Martinez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={roleOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select role"
                        searchPlaceholder="Search roles..."
                        emptyText="No roles found."
                        loading={masterData.loading.roles}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position/Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Ophthalmologist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Ophthalmology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="sarah.m@opticnauts.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!employee && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Min 6 characters" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-medium">Login Account Setup</p>
                  <p className="text-blue-700 mt-1">
                    A login account will be created automatically with the provided email and password.
                    The employee can use these credentials to access the system.
                  </p>
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Employee address..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary (Monthly)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Medical license number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="qualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualifications</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="MBBS, MS (Ophthalmology)..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact person name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergency_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
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
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
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
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {form.formState.errors.root.message}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (employee ? "Updating..." : "Adding...") 
                  : (employee ? "Update Employee" : "Add Employee")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

