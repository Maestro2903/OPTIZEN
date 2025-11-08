"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Award,
  Eye,
  Edit,
  Trash2,
  Printer,
  FileText,
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
import { CertificateForms } from "@/components/certificate-forms"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { ViewEditDialog } from "@/components/view-edit-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CertificatePrint } from "@/components/certificate-print"

interface Certificate {
  id: string
  date: string
  patient_name: string
  type: string
  purpose: string
  status: string
  exam_date?: string
  findings?: string
  diagnosis?: string
  treatment_period?: string
  recommendations?: string
  visual_acuity_right?: string
  visual_acuity_left?: string
  color_vision?: string
  driving_fitness?: string
  illness?: string
  leave_from?: string
  leave_to?: string
  title?: string
  content?: string
}

// Sample data removed for production - should be fetched from API
const certificates: Certificate[] = [
  // This should be populated from the certificates API
  // Example: const certificates = await fetchCertificates()
]

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [certificatesList, setCertificatesList] = React.useState<Certificate[]>(certificates)
  const [isLoading, setIsLoading] = React.useState(false)

  // Function to handle certificate deletion
  const handleDelete = async (certificateId: string) => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API call when endpoint is ready
      // const response = await fetch(`/api/certificates/${certificateId}`, { method: 'DELETE' })
      // if (!response.ok) throw new Error('Failed to delete certificate')
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Only update local state after successful API response
      setCertificatesList(prev => prev.filter(c => c.id !== certificateId))
      
      // TODO: Show success toast/notification to user
      // toast({ title: 'Success', description: 'Certificate deleted successfully' })
    } catch (error) {
      console.error("Error deleting certificate:", error)
      // TODO: Show error toast/notification to user  
      // toast({ title: 'Error', description: 'Failed to delete certificate', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCertificates = React.useMemo(() => {
    if (!searchTerm.trim()) return certificatesList
    const q = searchTerm.trim().toLowerCase()
    return certificatesList.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.date.toLowerCase().includes(q) ||
      c.patient_name.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      (c.purpose || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q)
    )
  }, [searchTerm, certificatesList])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="text-muted-foreground">
            Generate and manage medical certificates
          </p>
        </div>
        <CertificateForms>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Generate Certificate
          </Button>
        </CertificateForms>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Certificate Records</CardTitle>
              <CardDescription>
                View and manage all issued certificates
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search certificates..."
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
                  <TableHead>CERT NO.</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>PATIENT NAME</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>PURPOSE</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((cert, index) => (
                  <TableRow key={cert.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{cert.id}</TableCell>
                    <TableCell>{cert.date}</TableCell>
                    <TableCell className="font-medium uppercase">{cert.patient_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{cert.type}</Badge>
                    </TableCell>
                    <TableCell>{cert.purpose}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ViewEditDialog
                          title={`Certificate - ${cert.id}`}
                          description={`${cert.type}`}
                          data={cert}
                          renderViewAction={(data?: Certificate) => (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Date</p>
                                <p>{data?.date}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Patient</p>
                                <p className="font-medium uppercase">{data?.patient_name}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Type</p>
                                <Badge variant="secondary">{data?.type}</Badge>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Purpose</p>
                                <p>{data?.purpose ?? '-'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Status</p>
                                <Badge variant="outline">{data?.status}</Badge>
                              </div>

                              {data?.type === 'Fitness Certificate' && (
                                <>
                                  <div>
                                    <p className="text-muted-foreground">Examination Date</p>
                                    <p>{data?.exam_date ?? data?.date ?? '-'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Findings</p>
                                    <p className="text-muted-foreground">{data?.findings ?? '-'}</p>
                                  </div>
                                </>
                              )}

                              {data?.type === 'Medical Certificate' && (
                                <>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Diagnosis</p>
                                    <p>{data?.diagnosis ?? '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Treatment Period</p>
                                    <p>{data?.treatment_period ?? '-'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Recommendations</p>
                                    <p className="text-muted-foreground">{data?.recommendations ?? '-'}</p>
                                  </div>
                                </>
                              )}

                              {data?.type === 'Eye Test' && (
                                <>
                                  <div>
                                    <p className="text-muted-foreground">Visual Acuity - Right</p>
                                    <p>{data?.visual_acuity_right ?? '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Visual Acuity - Left</p>
                                    <p>{data?.visual_acuity_left ?? '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Color Vision</p>
                                    <p>{data?.color_vision ?? '-'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Driving Fitness</p>
                                    <p className="text-muted-foreground">{data?.driving_fitness ?? '-'}</p>
                                  </div>
                                </>
                              )}

                              {data?.type === 'Sick Leave' && (
                                <>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Illness</p>
                                    <p>{data?.illness ?? '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Leave From</p>
                                    <p>{data?.leave_from ?? '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Leave To</p>
                                    <p>{data?.leave_to ?? '-'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Recommendations</p>
                                    <p className="text-muted-foreground">{data?.recommendations ?? '-'}</p>
                                  </div>
                                </>
                              )}

                              {data?.type === 'Custom' && (
                                <>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Certificate Title</p>
                                    <p>{data?.title ?? '-'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-muted-foreground">Certificate Content</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{data?.content ?? '-'}</p>
                                  </div>
                                </>
                              )}

                              <div className="col-span-2 mt-2">
                                <p className="text-muted-foreground">Templates</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <Badge variant="outline">Fitness</Badge>
                                  <Badge variant="outline">Medical</Badge>
                                  <Badge variant="outline">Eye Test</Badge>
                                  <Badge variant="outline">Sick Leave</Badge>
                                  <Badge variant="outline">Custom</Badge>
                                </div>
                              </div>
                            </div>
                          )}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={"date"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"patient_name"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Patient</FormLabel>
                                    <FormControl>
                                      <Input className="uppercase" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"type"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select template" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Fitness Certificate">Fitness Certificate</SelectItem>
                                        <SelectItem value="Medical Certificate">Medical Certificate</SelectItem>
                                        <SelectItem value="Eye Test">Eye Test</SelectItem>
                                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                        <SelectItem value="Custom">Custom</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"purpose"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Purpose</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"status"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Issued">Issued</SelectItem>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Revoked">Revoked</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}/>

                                {(() => {
                                  const t = form.watch("type") as string
                                  if (t === "Fitness Certificate") {
                                    return (
                                      <>
                                        <FormField control={form.control} name={"exam_date"} render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Examination Date</FormLabel>
                                            <FormControl>
                                              <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"findings"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Findings</FormLabel>
                                            <FormControl>
                                              <Textarea rows={3} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                      </>
                                    )
                                  }
                                  if (t === "Medical Certificate") {
                                    return (
                                      <>
                                        <FormField control={form.control} name={"diagnosis"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Diagnosis</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"treatment_period"} render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Treatment Period</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"recommendations"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Recommendations</FormLabel>
                                            <FormControl>
                                              <Textarea rows={3} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                      </>
                                    )
                                  }
                                  if (t === "Eye Test") {
                                    return (
                                      <>
                                        <FormField control={form.control} name={"visual_acuity_right"} render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Visual Acuity - Right</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"visual_acuity_left"} render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Visual Acuity - Left</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"color_vision"} render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Color Vision</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"driving_fitness"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Driving Fitness</FormLabel>
                                            <FormControl>
                                              <Textarea rows={2} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                      </>
                                    )
                                  }
                                  if (t === "Sick Leave") {
                                    return (
                                      <>
                                        <FormField control={form.control} name={"illness"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Illness</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"leave_from"} render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Leave From</FormLabel>
                                            <FormControl>
                                              <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"leave_to"} render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Leave To</FormLabel>
                                            <FormControl>
                                              <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"recommendations"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Recommendations</FormLabel>
                                            <FormControl>
                                              <Textarea rows={3} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                      </>
                                    )
                                  }
                                  if (t === "Custom") {
                                    return (
                                      <>
                                        <FormField control={form.control} name={"title"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Certificate Title</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                        <FormField control={form.control} name={"content"} render={({ field }) => (
                                          <FormItem className="col-span-2">
                                            <FormLabel>Certificate Content</FormLabel>
                                            <FormControl>
                                              <Textarea rows={6} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}/>
                                      </>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </Form>
                          )}
                          onSaveAction={async (values: Certificate) => {
                            console.log("Update certificate", values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <ViewEditDialog
                          title={`Edit Certificate - ${cert.id}`}
                          description={cert.type}
                          data={cert}
                          defaultEdit
                          renderViewAction={() => null}
                          renderEditAction={(form: any) => (
                            <Form {...form}>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={"date"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"patient_name"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Patient</FormLabel>
                                    <FormControl>
                                      <Input className="uppercase" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"type"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"purpose"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Purpose</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name={"status"} render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Issued">Issued</SelectItem>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Revoked">Revoked</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                              </div>
                            </Form>
                          )}
                          onSaveAction={async (values: Certificate) => {
                            console.log("Update certificate", values)
                          }}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ViewEditDialog>
                        <CertificatePrint certificate={cert}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Print Certificate">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </CertificatePrint>
                        <DeleteConfirmDialog
                          title="Delete Certificate"
                          description={`Are you sure you want to delete certificate ${cert.id}? This action cannot be undone.`}
                          onConfirm={() => handleDelete(cert.id)}
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
