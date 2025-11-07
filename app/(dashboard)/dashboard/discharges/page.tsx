"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Trash2,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DischargeForm } from "@/components/discharge-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const discharges: any[] = []

export default function DischargesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const filteredDischarges = React.useMemo(() => {
    if (!searchTerm.trim()) return discharges
    const q = searchTerm.trim().toLowerCase()
    return discharges.filter(d =>
      (d.patient_name || '').toLowerCase().includes(q) ||
      (d.admission_date || '').toLowerCase().includes(q) ||
      (d.discharge_date || '').toLowerCase().includes(q) ||
      (d.notes || '').toLowerCase().includes(q)
    )
  }, [searchTerm])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discharges</h1>
          <p className="text-muted-foreground">Manage patient discharge records</p>
        </div>
        <DischargeForm>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Discharge
          </Button>
        </DischargeForm>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discharges</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">371</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">discharges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">discharges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Stay</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Discharge Records</CardTitle>
              <CardDescription>View and manage all patient discharges</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search discharges..."
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
                  <TableHead>DATE OF ADMISSION</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>DATE OF DISCHARGE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDischarges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No discharge records yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDischarges.map((discharge, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{discharge.admission_date}</TableCell>
                      <TableCell className="font-medium">{discharge.patient_name}</TableCell>
                      <TableCell>{discharge.discharge_date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ViewEditDialog
                            title={`Discharge - ${discharge?.patient_name ?? "Record"}`}
                            description={`Admission: ${discharge?.admission_date ?? "-"}`}
                            data={discharge as any}
                            renderViewAction={(data: any) => (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Patient</p>
                                  <p className="font-medium">{data?.patient_name ?? '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Admission Date</p>
                                  <p>{data?.admission_date ?? '-'}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Discharge Date</p>
                                  <p>{data?.discharge_date ?? '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-muted-foreground">Notes</p>
                                  <p className="text-muted-foreground">{data?.notes ?? '-'}</p>
                                </div>
                              </div>
                            )}
                            renderEditAction={(form: any) => (
                              <Form {...form}>
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField control={form.control} name={"patient_name"} render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Patient</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                  <FormField control={form.control} name={"admission_date"} render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Admission Date</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                  <FormField control={form.control} name={"discharge_date"} render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Discharge Date</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                  <FormField control={form.control} name={"notes"} render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel>Notes</FormLabel>
                                      <FormControl>
                                        <Textarea rows={3} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}/>
                                </div>
                              </Form>
                            )}
                            onSaveAction={async (values: any) => {
                              console.log("Update discharge", values)
                            }}
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </ViewEditDialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.print()} title="Print">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <DeleteConfirmDialog
                            title="Delete Discharge"
                            description="Are you sure you want to delete this discharge record? This action cannot be undone."
                            onConfirm={() => console.log("Delete discharge:", discharge.id)}
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
        </CardContent>
      </Card>
    </div>
  )
}
