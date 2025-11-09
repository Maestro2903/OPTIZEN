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
  address: z.string().optional(),
  joining_date: z.string().min(1, "Joining date is required"),
  qualifications: z.string().optional(),
  permissions: z.string().optional(),
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

  const form = useForm<z.infer<typeof employeeFormSchema>>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: employee ? {
      full_name: employee.full_name || '',
      employee_id: employee.employee_id || '',
      role: employee.role || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      joining_date: employee.hire_date || new Date().toISOString().split("T")[0],
      qualifications: employee.qualifications || '',
      permissions: '',
    } : {
      employee_id: "EMP" + new Date().getFullYear() + "001",
      joining_date: new Date().toISOString().split("T")[0],
      role: "Doctor",
    },
  })
  
  // Reset form when employee changes or dialog opens
  React.useEffect(() => {
    if (open && employee) {
      form.reset({
        full_name: employee.full_name || '',
        employee_id: employee.employee_id || '',
        role: employee.role || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        joining_date: employee.hire_date || new Date().toISOString().split("T")[0],
        qualifications: employee.qualifications || '',
        permissions: '',
      })
    }
  }, [open, employee, form])

  // Load roles from master data
  React.useEffect(() => {
    if (open) {
      masterData.fetchCategory('roles')
    }
  }, [open, masterData])

  async function onSubmit(values: z.infer<typeof employeeFormSchema>) {
    if (onSubmitCallback) {
      setIsLoading(true)
      try {
        await onSubmitCallback(values)
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
                        options={masterData.data.roles || []}
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
                name="joining_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joining Date *</FormLabel>
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

            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissions / Access Control</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Define access permissions..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isLoading ? "Adding Employee..." : "Add Employee"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

