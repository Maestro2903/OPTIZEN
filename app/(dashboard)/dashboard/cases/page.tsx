"use client"

import * as React from "react"
import * as z from "zod"
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  Eye,
  Edit,
  Trash2,
  Printer,
  ArrowUpDown,
  MoreHorizontal,
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
import { CaseForm } from "@/components/case-form"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const cases = [
  {
    id: 1,
    case_no: "OPT250001",
    patient_name: "AARAV MEHTA",
    age: 45,
    email: "aarav.m@email.com",
    mobile: "9856452114",
    gender: "Male",
    state: "Gujarat",
    case_date: "2025-02-08",
    visit_no: "First",
    status: "Active",
  },
  {
    id: 2,
    case_no: "OPT250002",
    patient_name: "NISHANT KAREKAR",
    age: 28,
    email: "nishant.k@email.com",
    mobile: "9319018067",
    gender: "Male",
    state: "Maharashtra",
    case_date: "2025-09-26",
    visit_no: "Follow-up-1",
    status: "Active",
  },
  {
    id: 3,
    case_no: "OPT250003",
    patient_name: "PRIYA NAIR",
    age: 34,
    email: "priya.n@email.com",
    mobile: "9868412848",
    gender: "Female",
    state: "Maharashtra",
    case_date: "2025-08-19",
    visit_no: "First",
    status: "Completed",
  },
  {
    id: 4,
    case_no: "OPT250004",
    patient_name: "AISHABEN THAKIR",
    age: 39,
    email: "aisha.t@email.com",
    mobile: "6456445154",
    gender: "Female",
    state: "Gujarat",
    case_date: "2025-08-15",
    visit_no: "Follow-up-2",
    status: "Active",
  },
]

const statusColors = {
  Active: "bg-blue-100 text-blue-700 border-blue-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
}

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const filteredCases = React.useMemo(() => {
    if (!searchTerm.trim()) return cases
    const q = searchTerm.trim().toLowerCase()
    return cases.filter(c =>
      c.case_no.toLowerCase().includes(q) ||
      c.patient_name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.mobile || '').toLowerCase().includes(q) ||
      c.gender.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    )
  }, [searchTerm])
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">
            Manage patient cases and medical records
          </p>
        </div>
        <CaseForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Case
          </Button>
        </CaseForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">963</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">new cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">718</div>
            <p className="text-xs text-muted-foreground">total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Case List</CardTitle>
              <CardDescription>
                Browse and manage all patient cases
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cases..."
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
                  <TableHead>CASE NO</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>AGE</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>MOBILE</TableHead>
                  <TableHead>GENDER</TableHead>
                  <TableHead>STATE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem, index) => (
                  <TableRow key={caseItem.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{caseItem.case_no}</TableCell>
                    <TableCell className="font-medium uppercase">{caseItem.patient_name}</TableCell>
                    <TableCell>{caseItem.age}</TableCell>
                    <TableCell className="text-muted-foreground">{caseItem.email}</TableCell>
                    <TableCell>{caseItem.mobile}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {caseItem.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>{caseItem.state}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Case Details - ${caseItem.case_no}`}
                          description={`Complete case information for ${caseItem.patient_name}`}
                          data={caseItem}
                          // Basic schema for demo purposes; extend as needed
                          schema={z.object({
                            case_no: z.string().min(1),
                            case_date: z.string().min(1),
                            patient_name: z.string().min(1),
                            age: z.number().or(z.string()).transform((v) => Number(v)).pipe(z.number().min(0)),
                            email: z.string().optional(),
                            mobile: z.string().optional(),
                            gender: z.string().min(1),
                            state: z.string().min(1),
                            visit_no: z.string().min(1),
                          })}
                          renderViewAction={(data: any) => (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Case Number</p>
                                  <p className="font-semibold">{data?.case_no}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Date</p>
                                  <p className="font-semibold">{data?.case_date}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Patient</p>
                                  <p className="font-semibold uppercase">{data?.patient_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Visit Type</p>
                                  <Badge variant="secondary">{data?.visit_no}</Badge>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg mb-3">Patient Information</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Age</p>
                                    <p className="font-medium">{data?.age} years</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Gender</p>
                                    <p className="font-medium">{data?.gender}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">State</p>
                                    <p className="font-medium">{data?.state}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={"case_no" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Case No.</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"case_date" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Date</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"patient_name" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Patient Name</FormLabel>
                                      <FormControl>
                                        <Input className="uppercase" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"age" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Age</FormLabel>
                                      <FormControl>
                                        <Input type="number" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"gender" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Gender</FormLabel>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"state" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>State</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={"visit_no" as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Visit Type</FormLabel>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select visit type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="First">First</SelectItem>
                                            <SelectItem value="Follow-up-1">Follow-up-1</SelectItem>
                                            <SelectItem value="Follow-up-2">Follow-up-2</SelectItem>
                                            <SelectItem value="Follow-up-3">Follow-up-3</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </Form>
                          )}
                          onSaveAction={async (values: any) => {
                            // TODO: integrate with real service once available
                            console.log("Update case", values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <CaseForm caseData={caseItem} mode="edit">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </CaseForm>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.print()}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          title="Delete Case"
                          description={`Are you sure you want to delete case ${caseItem.case_no}? This action cannot be undone.`}
                          onConfirm={() => console.log("Delete case:", caseItem.id)}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
