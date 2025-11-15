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
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { employeesApi, type Employee as ApiEmployee } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserCheck } from "lucide-react"

const bulkAttendanceSchema = z.object({
  attendance_date: z.string().min(1, "Date is required"),
  default_status: z.enum(["present", "absent", "sick_leave", "casual_leave", "paid_leave", "half_day"]),
  check_in_time: z.string().optional(),
})

interface BulkAttendanceFormProps {
  children: React.ReactNode
  onSubmit?: (data: any) => Promise<void>
}

// Use the API Employee type
type Employee = ApiEmployee

export function BulkAttendanceForm({ children, onSubmit: onSubmitProp }: BulkAttendanceFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([])
  const [loadingEmployees, setLoadingEmployees] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const form = useForm<z.infer<typeof bulkAttendanceSchema>>({
    resolver: zodResolver(bulkAttendanceSchema),
    defaultValues: {
      attendance_date: new Date().toISOString().split("T")[0],
      default_status: "present",
      check_in_time: "",
    },
  })

  // Load employees with search support
  React.useEffect(() => {
    const loadEmployees = async () => {
      if (!isOpen) return
      setLoadingEmployees(true)
      try {
        const response = await employeesApi.list({ 
          status: 'active', 
          limit: 100,
          search: searchTerm || undefined
        })
        if (response.success && response.data) {
          setEmployees(response.data)
        }
      } catch (error) {
        console.error("Error loading employees:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load employees list."
        })
      } finally {
        setLoadingEmployees(false)
      }
    }
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      loadEmployees()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [isOpen, searchTerm, toast])

  // Employees are now filtered server-side, so no need for client-side filtering
  const filteredEmployees = employees

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id))
    }
  }

  const handleToggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  async function onSubmit(values: z.infer<typeof bulkAttendanceSchema>) {
    if (selectedEmployees.length === 0) {
      toast({
        variant: "destructive",
        title: "No employees selected",
        description: "Please select at least one employee to mark attendance."
      })
      return
    }

    try {
      setSubmitting(true)
      
      if (!onSubmitProp) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No submission handler provided."
        })
        return
      }

      const bulkData = {
        attendance_date: values.attendance_date,
        default_status: values.default_status,
        employees: selectedEmployees.map(userId => ({
          user_id: userId,
          status: values.default_status,
          check_in_time: values.check_in_time || null,
        }))
      }

      await onSubmitProp(bulkData)
      
      setIsOpen(false)
      form.reset()
      setSelectedEmployees([])
      setSearchTerm("")
      
      toast({
        title: "Success",
        description: `Attendance marked for ${selectedEmployees.length} employee(s).`
      })
    } catch (error) {
      console.error("Error submitting bulk attendance:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark bulk attendance. Please try again."
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Bulk Mark Attendance
          </DialogTitle>
          <DialogDescription>
            Select employees and mark their attendance for the day
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              
              <FormField
                control={form.control}
                name="default_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Status *</FormLabel>
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
            </div>

            {form.watch("default_status") === "present" && (
              <FormField
                control={form.control}
                name="check_in_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-In Time (Optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">
                  Select Employees ({selectedEmployees.length} selected)
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="search"
                    placeholder="Search employees..."
                    className="w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedEmployees.length === filteredEmployees.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </div>

              {loadingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading employees...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No employees found matching your search" : "No active employees found"}
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => handleToggleEmployee(employee.id)}
                    >
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => handleToggleEmployee(employee.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{employee.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {employee.employee_id || 'N/A'} • {employee.role}
                          {employee.department && ` • ${employee.department}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || selectedEmployees.length === 0}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark Attendance for {selectedEmployees.length} Employee(s)
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
