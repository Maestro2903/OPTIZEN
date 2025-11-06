"use client"

import * as React from "react"
import { Plus, Search, Database, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MasterDataForm } from "@/components/master-data-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

const complaints = ["Redness", "Watering", "Pain", "Blurred Vision", "Double Vision", "Headache"]
const treatments = ["Eye Drops", "Ointment", "Oral Medication", "Surgery", "Laser Treatment"]
const medicines = ["Moxifloxacin", "Prednisolone", "Timolol", "Tropicamide", "Cyclopentolate"]
const surgeries = ["FOREIGNBODY", "Cataract Surgery", "LASIK", "Glaucoma Surgery", "Corneal Transplant"]
const diagnosticTests = ["Visual Acuity", "Refraction", "IOP", "Fundoscopy", "OCT", "Visual Field"]
const eyeConditions = ["Cataract", "Glaucoma", "Retinopathy", "Myopia", "Hypermetropia", "Astigmatism"]
const paymentMethods = ["Cash", "Card", "UPI", "Insurance", "Online"]
const insuranceProviders = ["ICICI", "HDFC", "Star Health", "Max Bupa", "Religare"]

export default function MasterDataPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
          <p className="text-muted-foreground">
            Manage core data for the system
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaints.length}</div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatments</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treatments.length}</div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medicines</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicines.length}</div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surgeries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surgeries.length}</div>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Data Management</CardTitle>
          <CardDescription>8 sub-modules for core system data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="complaints" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
              <TabsTrigger value="medicines">Medicines</TabsTrigger>
              <TabsTrigger value="surgeries">Surgeries</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
            </TabsList>

            <TabsContent value="complaints" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search complaints..." className="max-w-sm" />
                <MasterDataForm title="Complaint" fieldLabel="Complaint Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Complaint
                  </Button>
                </MasterDataForm>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SR. NO.</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmDialog
                              title="Delete Complaint"
                              description={`Are you sure you want to delete "${item}"? This action cannot be undone.`}
                              onConfirm={() => console.log("Delete complaint:", item)}
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
            </TabsContent>

            <TabsContent value="treatments" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search treatments..." className="max-w-sm" />
                <MasterDataForm title="Treatment" fieldLabel="Treatment Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Treatment
                  </Button>
                </MasterDataForm>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SR. NO.</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmDialog
                              title="Delete Treatment"
                              description={`Are you sure you want to delete "${item}"? This action cannot be undone.`}
                              onConfirm={() => console.log("Delete treatment:", item)}
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
            </TabsContent>

            <TabsContent value="medicines" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search medicines..." className="max-w-sm" />
                <MasterDataForm title="Medicine" fieldLabel="Medicine Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Medicine
                  </Button>
                </MasterDataForm>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SR. NO.</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmDialog
                              title="Delete Medicine"
                              description={`Are you sure you want to delete "${item}"? This action cannot be undone.`}
                              onConfirm={() => console.log("Delete medicine:", item)}
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
            </TabsContent>

            <TabsContent value="surgeries" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search surgeries..." className="max-w-sm" />
                <MasterDataForm title="Surgery" fieldLabel="Surgery Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Surgery
                  </Button>
                </MasterDataForm>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SR. NO.</TableHead>
                      <TableHead>NAME</TableHead>
                      <TableHead>ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surgeries.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmDialog
                              title="Delete Surgery"
                              description={`Are you sure you want to delete "${item}"? This action cannot be undone.`}
                              onConfirm={() => console.log("Delete surgery:", item)}
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
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search tests..." className="max-w-sm" />
                <MasterDataForm title="Diagnostic Test" fieldLabel="Test Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Test
                  </Button>
                </MasterDataForm>
              </div>
              <div className="text-sm text-muted-foreground">
                Diagnostic Tests: {diagnosticTests.join(", ")}
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search conditions..." className="max-w-sm" />
                <MasterDataForm title="Eye Condition" fieldLabel="Condition Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Condition
                  </Button>
                </MasterDataForm>
              </div>
              <div className="text-sm text-muted-foreground">
                Eye Conditions: {eyeConditions.join(", ")}
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search payment methods..." className="max-w-sm" />
                <MasterDataForm title="Payment Method" fieldLabel="Method Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                  </Button>
                </MasterDataForm>
              </div>
              <div className="text-sm text-muted-foreground">
                Payment Methods: {paymentMethods.join(", ")}
              </div>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4">
              <div className="flex items-center justify-between">
                <Input placeholder="Search insurance providers..." className="max-w-sm" />
                <MasterDataForm title="Insurance Provider" fieldLabel="Provider Name">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Insurance Provider
                  </Button>
                </MasterDataForm>
              </div>
              <div className="text-sm text-muted-foreground">
                Insurance Providers: {insuranceProviders.join(", ")}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
