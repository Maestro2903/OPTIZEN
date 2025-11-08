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
  onSubmit?: (data: any) => Promise<void>
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

  // Load staff members from employees API
  React.useEffect(() => {
    const loadStaff = async () => {
      if (!isOpen) return
      setLoadingStaff(true)
      try {
        const response = await employeesApi.list({ status: 'active', limit: 1000 })
        if (response.success && response.data) {
          setStaffMembers(
            response.data.map((employee) => ({
              value: employee.id,
              label: `${employee.full_name} - ${employee.role} (${employee.employee_id})`,
            }))
          )
        }
      } catch (error) {
        console.error("Error loading staff:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load staff list."
        })
      } finally {
        setLoadingStaff(false)
      }
    }
    loadStaff()
  }, [isOpen, toast])

  async function onSubmit(values: z.infer<typeof attendanceSchema>) {
    try {
      if (onSubmitProp) {
        await onSubmitProp(values)
      }
      setIsOpen(false)
      form.reset()
      toast({
        title: "Success",
        description: mode === "edit" ? "Attendance updated successfully." : "Attendance marked successfully."
      })
    } catch (error) {
      console.error("Error submitting attendance:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save attendance. Please try again."
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                        onValueChange={field.onChange}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{mode === "edit" ? "Update Attendance" : "Mark Attendance"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

