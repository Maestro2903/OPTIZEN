"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { employeesApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

const attendanceSchema = z.object({
  user_id: z.string().min(1, "Staff member is required"),
  attendance_date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "sick_leave", "casual_leave", "paid_leave", "half_day"]),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  notes: z.string().optional(),
})

interface AttendanceFormProps {
  children: React.ReactNode
  attendanceData?: any
  mode?: "create" | "edit"
  onSubmit?: (data: z.infer<typeof attendanceSchema>) => Promise<void>
}

export function AttendanceForm({ children, attendanceData, mode = "create", onSubmit: onSubmitProp }: AttendanceFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [staffMembers, setStaffMembers] = React.useState<SearchableSelectOption[]>([])
  const [loadingStaff, setLoadingStaff] = React.useState(false)

  const form = useForm<z.infer<typeof attendanceSchema>>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      user_id: attendanceData?.user_id || "",
      attendance_date: attendanceData?.attendance_date || new Date().toISOString().split("T")[0],
      status: attendanceData?.status || "present",
      check_in_time: attendanceData?.check_in_time || "",
      check_out_time: attendanceData?.check_out_time || "",
      notes: attendanceData?.notes || "",
    },
  })

  const selectedStatus = form.watch("status")

  // Load staff members from employees API with search
  const [staffSearch, setStaffSearch] = React.useState("")
  
  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      // Reset form to initial values when dialog opens
      if (mode === "edit" && attendanceData) {
        form.reset({
          user_id: attendanceData.user_id || "",
          attendance_date: attendanceData.attendance_date || new Date().toISOString().split("T")[0],
          status: attendanceData.status || "present",
          check_in_time: attendanceData.check_in_time || "",
          check_out_time: attendanceData.check_out_time || "",
          notes: attendanceData.notes || "",
        })
      } else {
        form.reset({
          user_id: "",
          attendance_date: new Date().toISOString().split("T")[0],
          status: "present",
          check_in_time: "",
          check_out_time: "",
          notes: "",
        })
      }
    } else {
      // Clear form errors when dialog closes
      form.clearErrors()
    }
  }, [isOpen, mode, attendanceData, form])
  
  React.useEffect(() => {
    const loadStaff = async () => {
      if (!isOpen) return
      setLoadingStaff(true)
      try {
        const response = await employeesApi.list({ 
          status: 'active', 
          limit: 50,
          search: staffSearch || undefined
        })
        if (response.success && response.data) {
          setStaffMembers(
            response.data.map((employee) => ({
              value: employee.id,
              label: `${employee.full_name} - ${employee.role}`,
            }))
          )
        } else {
          console.error("Failed to load staff:", response.error)
          setStaffMembers([])
        }
      } catch (error) {
        console.error("Error loading staff:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load staff list. Please try again."
        })
        setStaffMembers([])
      } finally {
        setLoadingStaff(false)
      }
    }
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      loadStaff()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [isOpen, staffSearch, toast])

  async function onSubmit(values: z.infer<typeof attendanceSchema>) {
    console.log("Form submission started with values:", values)
    
    // Validate form values before submission
    if (!values.user_id || values.user_id.trim() === "") {
      console.error("Validation failed: Staff member is required")
      form.setError("user_id", {
        type: "manual",
        message: "Staff member is required"
      })
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a staff member."
      })
      return
    }

    if (!values.attendance_date || values.attendance_date.trim() === "") {
      console.error("Validation failed: Date is required")
      form.setError("attendance_date", {
        type: "manual",
        message: "Date is required"
      })
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a date."
      })
      return
    }

    if (!values.status) {
      console.error("Validation failed: Status is required")
      form.setError("status", {
        type: "manual",
        message: "Status is required"
      })
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a status."
      })
      return
    }

    // Validate future dates - only allow for leave types
    const attendanceDate = new Date(values.attendance_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    attendanceDate.setHours(0, 0, 0, 0)
    
    const leaveStatuses = ['sick_leave', 'casual_leave', 'paid_leave']
    if (attendanceDate > today && !leaveStatuses.includes(values.status)) {
      console.error("Validation failed: Future dates not allowed for non-leave statuses")
      form.setError("attendance_date", {
        type: "manual",
        message: "Cannot mark attendance for future dates. Use leave status for future absences."
      })
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Cannot mark attendance for future dates. Use leave status for future absences."
      })
      return
    }

    // Validate check-in and check-out times
    if (values.check_in_time && values.check_out_time) {
      // Compare times properly using Date objects
      const checkIn = new Date(`2000-01-01T${values.check_in_time}`)
      const checkOut = new Date(`2000-01-01T${values.check_out_time}`)
      
      if (checkOut <= checkIn) {
        console.error("Validation failed: Check-out time must be after check-in time")
        form.setError("check_out_time", {
          type: "manual",
          message: "Check-out time must be after check-in time"
        })
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Check-out time must be after check-in time."
        })
        return
      }
      
      // Validate working hours don't exceed 24 hours
      const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      if (hoursWorked > 24) {
        console.error("Validation failed: Working hours cannot exceed 24 hours")
        form.setError("check_out_time", {
          type: "manual",
          message: "Working hours cannot exceed 24 hours"
        })
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Working hours cannot exceed 24 hours."
        })
        return
      }
    }

    try {
      if (!onSubmitProp) {
        console.error("No submission handler provided")
        toast({
          variant: "destructive",
          title: "Error",
          description: "No submission handler provided. Please refresh the page and try again."
        })
        return
      }

      console.log("Calling onSubmitProp with values:", values)
      await onSubmitProp(values)
      // Only show success and close dialog if no error was thrown
      setIsOpen(false)
      
      // Reset form to default values after successful submission
      form.reset({
        user_id: "",
        attendance_date: new Date().toISOString().split("T")[0],
        status: "present",
        check_in_time: "",
        check_out_time: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error submitting attendance:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'object' && error !== null && 'error' in error)
          ? String((error as any).error)
          : "Failed to save attendance. Please check all fields and try again."
      
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: errorMessage
      })
      // Don't close dialog on error so user can fix and retry
      // Don't log success message when there's an error
      return
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset form when dialog closes
      form.reset({
        user_id: "",
        attendance_date: new Date().toISOString().split("T")[0],
        status: "present",
        check_in_time: "",
        check_out_time: "",
        notes: "",
      })
      form.clearErrors()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Attendance" : "Mark Attendance"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update attendance record" : "Record staff attendance for the day"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={staffMembers}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          // Trigger validation when value changes
                          form.trigger("user_id")
                        }}
                        placeholder="Select staff member"
                        searchPlaceholder="Search staff..."
                        loading={loadingStaff}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attendance_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="sick_leave">Sick Leave</SelectItem>
                      <SelectItem value="casual_leave">Casual Leave</SelectItem>
                      <SelectItem value="paid_leave">Paid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(selectedStatus === "present" || selectedStatus === "half_day") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="check_in_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-In Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="check_out_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-Out Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional information..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  form.reset({
                    user_id: "",
                    attendance_date: new Date().toISOString().split("T")[0],
                    status: "present",
                    check_in_time: "",
                    check_out_time: "",
                    notes: "",
                  })
                  form.clearErrors()
                  setIsOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loadingStaff}>
                {mode === "edit" ? "Update Attendance" : "Mark Attendance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

