"use client"

import * as React from "react"
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Printer,
  Calendar,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewEditDialog } from "@/components/view-edit-dialog"

// OpticNauts Operation Schema
const operationFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  case_id: z.string().min(1, "Case is required"),
  operation_name: z.string().min(1, "Operation name is required"),
  operation_date: z.string().min(1, "Date is required"),
  begin_time: z.string().min(1, "Begin time is required"),
  end_time: z.string().min(1, "End time is required"),
  duration: z.string().min(1, "Duration is required"),
  eye: z.enum(["Right", "Left", "Both"]),
  sys_diagnosis: z.string().optional(),
  anesthesia: z.string().optional(),
  operation_notes: z.string().optional(),
  payment_mode: z.enum(["Cash", "Card", "Insurance", "Online"]),
  amount: z.string().min(1, "Amount is required"),
  iol_name: z.string().optional(),
  iol_power: z.string().optional(),
  print_notes: z.boolean().optional(),
  print_payment: z.boolean().optional(),
  print_iol: z.boolean().optional(),
})

const operations = [
  {
    id: "OP001",
    date: "15/10/2025",
    patient_name: "KARAN SINGH",
    operation: "FOREIGNBODY",
    begin_time: "12:00",
    end_time: "13:00",
    duration: "60 min",
    amount: "₹30000",
  },
  {
    id: "OP002",
    date: "11/10/2025",
    patient_name: "ARJUN VERMA",
    operation: "FOREIGNBODY",
    begin_time: "12:00",
    end_time: "13:00",
    duration: "60 min",
    amount: "₹30000",
  },
]

export default function OperationsPage() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")

  const form = useForm<z.infer<typeof operationFormSchema>>({
    resolver: zodResolver(operationFormSchema),
    defaultValues: {
      patient_id: "",
      case_id: "",
      operation_name: "",
      operation_date: new Date().toISOString().split("T")[0],
      begin_time: "",
      end_time: "",
      eye: "Right",
      sys_diagnosis: "",
      anesthesia: "",
      operation_notes: "",
      payment_mode: "Cash",
      iol_name: "",
      iol_power: "",
      print_notes: false,
      print_payment: false,
      print_iol: false,
    },
  })

  function onSubmit(values: z.infer<typeof operationFormSchema>) {
    console.log(values)
    setIsDialogOpen(false)
    form.reset()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
          <p className="text-muted-foreground">
            Schedule and manage surgical procedures
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
              Add Operation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Operation</DialogTitle>
              <DialogDescription>
                Schedule a new surgical operation
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patient_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PAT001">KARAN SINGH</SelectItem>
                            <SelectItem value="PAT002">ARJUN VERMA</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="case_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select case" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CASE001">OPT250001</SelectItem>
                            <SelectItem value="CASE002">OPT250002</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="operation_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operation Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., FOREIGNBODY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="operation_date"
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
                    name="eye"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eye Name *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select eye" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Right">Right</SelectItem>
                            <SelectItem value="Left">Left</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="begin_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Begin Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (min) *</FormLabel>
                        <FormControl>
                          <Input placeholder="60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sys_diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sys. Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Diagnosis..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="anesthesia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anesthesia</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Anesthesia details..." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operation_notes"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Operation Notes</FormLabel>
                        <FormField
                          control={form.control}
                          name="print_notes"
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <label className="text-xs text-muted-foreground">
                                Print
                              </label>
                            </div>
                          )}
                        />
                      </div>
                      <FormControl>
                        <Textarea placeholder="Detailed operation notes..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_mode"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Payment By *</FormLabel>
                          <FormField
                            control={form.control}
                            name="print_payment"
                            render={({ field }) => (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <label className="text-xs text-muted-foreground">
                                  Print
                                </label>
                              </div>
                            )}
                          />
                        </div>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                            <SelectItem value="Online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input placeholder="30000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="iol_name"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>IOL Name</FormLabel>
                          <FormField
                            control={form.control}
                            name="print_iol"
                            render={({ field }) => (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <label className="text-xs text-muted-foreground">
                                  Print
                                </label>
                              </div>
                            )}
                          />
                        </div>
                        <FormControl>
                          <Input placeholder="IOL Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iol_power"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IOL Power</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., +20.0D" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Discard
          </Button>
                  <Button type="submit">Add</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">734</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">operations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">this quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75</div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Operation List</CardTitle>
              <CardDescription>
                View and manage all scheduled operations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search operations..."
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
                  <TableHead>DATE</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>OPERATION</TableHead>
                  <TableHead>BEGIN TIME</TableHead>
                  <TableHead>END TIME</TableHead>
                  <TableHead>DURATION</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations
                  .filter(op => {
                    if (!searchTerm.trim()) return true
                    const q = searchTerm.trim().toLowerCase()
                    return (
                      op.id.toLowerCase().includes(q) ||
                      op.date.toLowerCase().includes(q) ||
                      op.patient_name.toLowerCase().includes(q) ||
                      op.operation.toLowerCase().includes(q) ||
                      op.begin_time.toLowerCase().includes(q) ||
                      op.end_time.toLowerCase().includes(q) ||
                      op.amount.toLowerCase().includes(q)
                    )
                  })
                  .map((op, index) => (
                  <TableRow key={op.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{op.date}</TableCell>
                    <TableCell className="font-medium uppercase">{op.patient_name}</TableCell>
                    <TableCell>{op.operation}</TableCell>
                    <TableCell>{op.begin_time}</TableCell>
                    <TableCell>{op.end_time}</TableCell>
                    <TableCell>{op.duration}</TableCell>
                    <TableCell className="font-semibold">{op.amount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Operation - ${op.operation}`}
                          description={`${op.date} • ${op.begin_time}-${op.end_time}`}
                          data={op as any}
                          renderViewAction={(data: any) => (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Patient</p>
                                <p className="font-medium">{data.patient_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Operation</p>
                                <p className="font-medium">{data.operation}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Date</p>
                                <p>{data.date}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Time</p>
                                <p>{data.begin_time} - {data.end_time}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Duration</p>
                                <p>{data.duration}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Amount</p>
                                <p className="font-semibold">{data.amount}</p>
                              </div>
                            </div>
                          )}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={"operation"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Operation</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"date"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"begin_time"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Begin Time</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"end_time"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"amount"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                              </div>
                            </Form>
                          )}
                          onSaveAction={async (values: any) => {
                            console.log("Update operation", values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View/Edit">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.print()} title="Print">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Delete Operation"
                          description={`Are you sure you want to delete operation ${op.id}? This action cannot be undone.`}
                          onConfirm={() => console.log("Delete operation:", op.id)}
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
