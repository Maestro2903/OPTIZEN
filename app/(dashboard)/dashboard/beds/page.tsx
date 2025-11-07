"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Bed,
  CheckCircle,
  AlertCircle,
  Wrench,
  TrendingUp,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BedCard } from "@/components/bed-card"
import { BedAssignmentForm } from "@/components/bed-assignment-form"
import { BedDetailsSheet } from "@/components/bed-details-sheet"
import { BedForm } from "@/components/bed-form"

// Mock bed data with assignments
const bedsData = [
  {
    bed: { id: "1", bed_number: "101", ward_name: "General", ward_type: "general", floor_number: 1, room_number: "A", status: "available" as const, daily_rate: 1500 },
    assignment: null
  },
  {
    bed: { id: "2", bed_number: "102", ward_name: "General", ward_type: "general", floor_number: 1, room_number: "A", status: "occupied" as const, daily_rate: 1500 },
    assignment: {
      patient_name: "AARAV MEHTA",
      patient_age: 45,
      patient_mrn: "MRN001",
      admission_date: "2025-11-03T10:00:00Z",
      days_in_ward: 3,
      expected_discharge_date: "2025-11-10",
      surgery_scheduled_time: "2025-11-07T14:00:00Z",
      surgery_type: "Cataract Surgery",
      admission_reason: "Cataract removal and IOL implantation",
      doctor_name: "Dr. Sarah Martinez"
    }
  },
  {
    bed: { id: "3", bed_number: "103", ward_name: "General", ward_type: "general", floor_number: 1, room_number: "B", status: "occupied" as const, daily_rate: 1500 },
    assignment: {
      patient_name: "PRIYA NAIR",
      patient_age: 34,
      patient_mrn: "MRN003",
      admission_date: "2025-11-04T08:30:00Z",
      days_in_ward: 2,
      admission_reason: "Post-operative care",
      doctor_name: "Dr. James Wilson"
    }
  },
  {
    bed: { id: "4", bed_number: "104", ward_name: "General", ward_type: "general", floor_number: 1, room_number: "B", status: "available" as const, daily_rate: 1500 },
    assignment: null
  },
  {
    bed: { id: "5", bed_number: "105", ward_name: "General", ward_type: "general", floor_number: 1, room_number: "C", status: "maintenance" as const, daily_rate: 1500 },
    assignment: null
  },
  {
    bed: { id: "6", bed_number: "201", ward_name: "ICU", ward_type: "icu", floor_number: 2, room_number: "ICU-1", status: "occupied" as const, daily_rate: 5000 },
    assignment: {
      patient_name: "NISHANT KAREKAR",
      patient_age: 28,
      patient_mrn: "MRN002",
      admission_date: "2025-11-01T15:00:00Z",
      days_in_ward: 5,
      expected_discharge_date: "2025-11-08",
      surgery_scheduled_time: "2025-11-06T09:00:00Z",
      surgery_type: "LASIK",
      admission_reason: "LASIK surgery and monitoring",
      doctor_name: "Dr. Sarah Martinez"
    }
  },
  {
    bed: { id: "7", bed_number: "202", ward_name: "ICU", ward_type: "icu", floor_number: 2, room_number: "ICU-2", status: "occupied" as const, daily_rate: 5000 },
    assignment: {
      patient_name: "AISHABEN THAKIR",
      patient_age: 39,
      patient_mrn: "MRN004",
      admission_date: "2025-11-05T11:00:00Z",
      days_in_ward: 1,
      admission_reason: "Critical post-operative monitoring",
      doctor_name: "Dr. James Wilson"
    }
  },
  {
    bed: { id: "8", bed_number: "203", ward_name: "ICU", ward_type: "icu", floor_number: 2, room_number: "ICU-3", status: "available" as const, daily_rate: 5000 },
    assignment: null
  },
  {
    bed: { id: "9", bed_number: "204", ward_name: "ICU", ward_type: "icu", floor_number: 2, room_number: "ICU-4", status: "reserved" as const, daily_rate: 5000 },
    assignment: null
  },
  {
    bed: { id: "10", bed_number: "301", ward_name: "Private", ward_type: "private", floor_number: 3, room_number: "301", status: "available" as const, daily_rate: 3500 },
    assignment: null
  },
  {
    bed: { id: "11", bed_number: "302", ward_name: "Private", ward_type: "private", floor_number: 3, room_number: "302", status: "occupied" as const, daily_rate: 3500 },
    assignment: {
      patient_name: "KARAN SINGH",
      patient_age: 52,
      patient_mrn: "MRN005",
      admission_date: "2025-10-28T09:00:00Z",
      days_in_ward: 9,
      expected_discharge_date: "2025-11-07",
      admission_reason: "Extended post-operative recovery",
      doctor_name: "Dr. Anita Desai"
    }
  },
  {
    bed: { id: "12", bed_number: "303", ward_name: "Private", ward_type: "private", floor_number: 3, room_number: "303", status: "available" as const, daily_rate: 3500 },
    assignment: null
  },
]

export default function BedsPage() {
  const [selectedBed, setSelectedBed] = React.useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [wardFilter, setWardFilter] = React.useState<string>("all")
  const [floorFilter, setFloorFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [beds, setBeds] = React.useState(bedsData)
  const [draggedBed, setDraggedBed] = React.useState<any>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  const totalBeds = bedsData.length
  const occupiedBeds = bedsData.filter(b => b.bed.status === 'occupied').length
  const availableBeds = bedsData.filter(b => b.bed.status === 'available').length
  const maintenanceBeds = bedsData.filter(b => b.bed.status === 'maintenance').length
  const occupancyRate = ((occupiedBeds / totalBeds) * 100).toFixed(1)
  const bedsWithSurgeryToday = bedsData.filter(b => {
    if (!b.assignment?.surgery_scheduled_time) return false
    const surgeryDate = new Date(b.assignment.surgery_scheduled_time).toDateString()
    const today = new Date().toDateString()
    return surgeryDate === today
  }).length

  const handleBedClick = (bedData: any) => {
    setSelectedBed(bedData)
    setIsSheetOpen(true)
  }

  const handleDragStart = (e: React.DragEvent, bedData: any) => {
    setDraggedBed(bedData)
    e.dataTransfer.effectAllowed = "move"
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
    setDraggedBed(null)
  }

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (!draggedBed) return

    // Update bed status
    const updatedBeds = beds.map(item => {
      if (item.bed.id === draggedBed.bed.id) {
        return {
          ...item,
          bed: {
            ...item.bed,
            status: newStatus as any
          }
        }
      }
      return item
    })

    setBeds(updatedBeds)
    setDraggedBed(null)

    // In real app, you would call API here
    console.log(`Bed ${draggedBed.bed.bed_number} status changed to ${newStatus}`)
  }

  // Filter beds
  const filteredBeds = beds.filter(({ bed, assignment }) => {
    if (wardFilter !== "all" && bed.ward_type !== wardFilter) return false
    if (floorFilter !== "all" && bed.floor_number !== parseInt(floorFilter)) return false
    if (statusFilter !== "all" && bed.status !== statusFilter) return false

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase()
      const matches =
        bed.bed_number.toLowerCase().includes(q) ||
        bed.ward_name.toLowerCase().includes(q) ||
        bed.ward_type.toLowerCase().includes(q) ||
        String(bed.floor_number).toLowerCase().includes(q) ||
        (bed.room_number || '').toLowerCase().includes(q) ||
        bed.status.toLowerCase().includes(q) ||
        (assignment?.patient_name || '').toLowerCase().includes(q) ||
        (assignment?.patient_mrn || '').toLowerCase().includes(q) ||
        (assignment?.doctor_name || '').toLowerCase().includes(q)
      if (!matches) return false
    }
    return true
  })

  // Group beds by ward and floor
  const groupedBeds = filteredBeds.reduce((acc, item) => {
    const key = `${item.bed.ward_name} - Floor ${item.bed.floor_number}`
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, typeof bedsData>)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bed Management</h1>
          <p className="text-muted-foreground">
            Manage bed availability and patient assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BedForm>
            <Button variant="outline" className="gap-2">
              <Bed className="h-4 w-4" />
              Add New Bed
            </Button>
          </BedForm>
          <BedAssignmentForm>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Assign Bed
            </Button>
          </BedAssignmentForm>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beds</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBeds}</div>
            <p className="text-xs text-muted-foreground">all floors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedBeds}</div>
            <p className="text-xs text-muted-foreground">{occupancyRate}% occupancy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableBeds}</div>
            <p className="text-xs text-muted-foreground">ready to use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceBeds}</div>
            <p className="text-xs text-muted-foreground">under maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">current rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surgeries Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bedsWithSurgeryToday}</div>
            <p className="text-xs text-muted-foreground">scheduled</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban">Kanban View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="icu">ICU</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="semi_private">Semi Private</SelectItem>
              </SelectContent>
            </Select>
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                <SelectItem value="1">Floor 1</SelectItem>
                <SelectItem value="2">Floor 2</SelectItem>
                <SelectItem value="3">Floor 3</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-[180px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Kanban View */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Available Column */}
            <Card 
              className={`bg-green-50/50 transition-all ${dragOverColumn === 'available' ? 'ring-2 ring-green-500 shadow-lg' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'available')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'available')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <CardTitle className="text-base">Available</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {filteredBeds.filter(b => b.bed.status === 'available').length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Ready to assign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[500px]">
                {filteredBeds
                  .filter(b => b.bed.status === 'available')
                  .map((bedData) => (
                    <div
                      key={bedData.bed.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bedData)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move"
                    >
                      <BedCard
                        bed={bedData.bed}
                        assignment={bedData.assignment}
                        onClick={() => handleBedClick(bedData)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Occupied Column */}
            <Card 
              className={`bg-red-50/50 transition-all ${dragOverColumn === 'occupied' ? 'ring-2 ring-red-500 shadow-lg' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'occupied')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'occupied')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <CardTitle className="text-base">Occupied</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    {filteredBeds.filter(b => b.bed.status === 'occupied').length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Patients admitted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[500px]">
                {filteredBeds
                  .filter(b => b.bed.status === 'occupied')
                  .map((bedData) => (
                    <div
                      key={bedData.bed.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bedData)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move"
                    >
                      <BedCard
                        bed={bedData.bed}
                        assignment={bedData.assignment}
                        onClick={() => handleBedClick(bedData)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Reserved Column */}
            <Card 
              className={`bg-yellow-50/50 transition-all ${dragOverColumn === 'reserved' ? 'ring-2 ring-yellow-500 shadow-lg' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'reserved')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'reserved')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <CardTitle className="text-base">Reserved</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    {filteredBeds.filter(b => b.bed.status === 'reserved').length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Held for patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[500px]">
                {filteredBeds
                  .filter(b => b.bed.status === 'reserved')
                  .map((bedData) => (
                    <div
                      key={bedData.bed.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bedData)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move"
                    >
                      <BedCard
                        bed={bedData.bed}
                        assignment={bedData.assignment}
                        onClick={() => handleBedClick(bedData)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Maintenance Column */}
            <Card 
              className={`bg-gray-50/50 transition-all ${dragOverColumn === 'maintenance' ? 'ring-2 ring-gray-500 shadow-lg' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'maintenance')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'maintenance')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <CardTitle className="text-base">Maintenance</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    {filteredBeds.filter(b => b.bed.status === 'maintenance').length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Under repair/cleaning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[500px]">
                {filteredBeds
                  .filter(b => b.bed.status === 'maintenance')
                  .map((bedData) => (
                    <div
                      key={bedData.bed.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, bedData)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move"
                    >
                      <BedCard
                        bed={bedData.bed}
                        assignment={bedData.assignment}
                        onClick={() => handleBedClick(bedData)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>All Beds</CardTitle>
              <CardDescription>
                Detailed view of all beds and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BED NO.</TableHead>
                      <TableHead>WARD</TableHead>
                      <TableHead>FLOOR</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>PATIENT</TableHead>
                      <TableHead>ADMISSION DATE</TableHead>
                      <TableHead>DAYS</TableHead>
                      <TableHead>SURGERY TIME</TableHead>
                      <TableHead>DOCTOR</TableHead>
                      <TableHead>DAILY RATE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBeds.map(({ bed, assignment }) => (
                      <TableRow 
                        key={bed.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleBedClick({ bed, assignment })}
                      >
                        <TableCell className="font-mono font-semibold">{bed.bed_number}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{bed.ward_name}</Badge>
                        </TableCell>
                        <TableCell>Floor {bed.floor_number}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              bed.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                              bed.status === 'occupied' ? 'bg-red-100 text-red-700 border-red-200' :
                              bed.status === 'maintenance' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                              'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }
                          >
                            {bed.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignment ? (
                            <div>
                              <div className="font-medium">{assignment.patient_name}</div>
                              <div className="text-xs text-muted-foreground">{assignment.patient_mrn}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment ? new Date(assignment.admission_date).toLocaleDateString('en-GB') : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment ? `${assignment.days_in_ward} ${assignment.days_in_ward === 1 ? 'day' : 'days'}` : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment?.surgery_scheduled_time ? (
                            <div className="text-sm">
                              {new Date(assignment.surgery_scheduled_time).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment?.doctor_name || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="font-semibold">₹{bed.daily_rate.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bed Details Sheet */}
      <BedDetailsSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        bedData={selectedBed?.bed || null}
        assignmentData={selectedBed?.assignment || null}
        onDischarge={() => {
          console.log("Discharge patient")
          setIsSheetOpen(false)
        }}
        onTransfer={() => {
          console.log("Transfer patient")
          setIsSheetOpen(false)
        }}
        onUpdate={() => {
          console.log("Update assignment")
          setIsSheetOpen(false)
        }}
      />
    </div>
  )
}

