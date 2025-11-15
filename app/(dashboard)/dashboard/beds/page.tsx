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
  Eye,
  Trash2,
  Edit,
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
import { BedDetailsDialog } from "@/components/bed-details-dialog"
import { BedForm } from "@/components/bed-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { bedsApi, masterDataApi, type BedWithAssignment } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

export default function BedsPage() {
  const { toast } = useToast()
  const [selectedBed, setSelectedBed] = React.useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [wardFilter, setWardFilter] = React.useState<string>("all")
  const [floorFilter, setFloorFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [beds, setBeds] = React.useState<BedWithAssignment[]>([])
  const [draggedBed, setDraggedBed] = React.useState<any>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [deletingBed, setDeletingBed] = React.useState<{id: string, name: string} | null>(null)

  // Fetch beds data from master_data
  const fetchBeds = React.useCallback(async () => {
    try {
      setIsLoading(true)
      // Fetch beds from master_data (only active ones)
      const bedsResponse = await masterDataApi.list({ 
        category: 'beds',
        active_only: true 
      })
      
      // Fetch bed assignments
      const assignmentsResponse = await bedsApi.list({})

      if (bedsResponse.success && bedsResponse.data) {
        // Transform master_data beds into the format expected by the UI
        const masterBeds = bedsResponse.data.map((bed: any) => {
          // Read bed properties from metadata
          const metadata = bed.metadata || {}
          
          return {
            bed: {
              id: bed.id,
              bed_number: bed.bed_number || bed.name,
              ward_name: bed.name,
              ward_type: metadata.ward_type || 'general',
              floor_number: metadata.floor_number || 1,
              room_number: metadata.room_number || null,
              status: metadata.status || 'available',
              daily_rate: metadata.daily_rate || 0,
              bed_type: metadata.bed_type || 'Standard',
              facilities: metadata.facilities || [],
              description: bed.description,
              created_at: bed.created_at || new Date().toISOString(),
              updated_at: bed.updated_at || new Date().toISOString(),
            },
            assignment: null as any
          }
        })

        // Match assignments to beds
        if (assignmentsResponse.success && assignmentsResponse.data) {
          assignmentsResponse.data.forEach((assignment: any) => {
            const bedIndex = masterBeds.findIndex((b: any) => b.bed.id === assignment.bed_id)
            if (bedIndex !== -1) {
              masterBeds[bedIndex].assignment = assignment
              masterBeds[bedIndex].bed.status = 'occupied'
            }
          })
        }

        // Apply filters
        let filtered = masterBeds
        
        if (wardFilter !== "all") {
          filtered = filtered.filter((b: any) => b.bed.ward_type === wardFilter)
        }
        
        if (statusFilter !== "all") {
          filtered = filtered.filter((b: any) => b.bed.status === statusFilter)
        }
        
        if (floorFilter !== "all") {
          filtered = filtered.filter((b: any) => b.bed.floor_number.toString() === floorFilter)
        }
        
        if (searchTerm) {
          filtered = filtered.filter((b: any) => 
            b.bed.bed_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.bed.ward_name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        setBeds(filtered)
      }
    } catch (error) {
      console.error("Error fetching beds:", error)
      toast({
        title: "Error",
        description: "Failed to load beds data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [wardFilter, statusFilter, floorFilter, searchTerm, toast])

  // Load beds on mount and when filters change
  React.useEffect(() => {
    fetchBeds()
  }, [fetchBeds])

  // Function to handle bed deletion/discharge
  const handleDischarge = async (bedId: string) => {
    try {
      // Fetch current bed data to get existing metadata
      const currentBedResponse = await masterDataApi.getById(bedId)
      if (!currentBedResponse.success || !currentBedResponse.data) {
        throw new Error('Failed to fetch current bed data')
      }

      const currentBed = currentBedResponse.data
      const updatedMetadata = {
        ...(currentBed.metadata || {}),
        status: 'available'
      }

      // Update bed status to available in master_data metadata
      const response = await masterDataApi.update(bedId, { metadata: updatedMetadata })
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Bed discharged successfully",
        })
        fetchBeds() // Refresh the list
      }
    } catch (error) {
      console.error("Error discharging bed:", error)
      toast({
        title: "Error",
        description: "Failed to discharge bed",
        variant: "destructive",
      })
    }
  }

  // Function to handle bed deletion from master_data
  const handleDelete = async (bedId: string) => {
    try {
      const response = await masterDataApi.delete(bedId)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Bed deleted successfully",
        })
        setDeletingBed(null)
        fetchBeds() // Refresh the list
      } else {
        throw new Error(response.error || "Failed to delete bed")
      }
    } catch (error) {
      console.error("Error deleting bed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete bed",
        variant: "destructive",
      })
    }
  }

  // Calculate statistics based on current bed state
  const totalBeds = beds.length
  const occupiedBeds = beds.filter(b => b.bed.status === 'occupied').length
  const availableBeds = beds.filter(b => b.bed.status === 'available').length
  const maintenanceBeds = beds.filter(b => b.bed.status === 'maintenance').length
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : "0.0"
  const bedsWithSurgeryToday = beds.filter(b => {
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

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (!draggedBed) return

    const bedId = draggedBed.bed.id
    const oldStatus = draggedBed.bed.status

    // Optimistically update UI
    const updatedBeds = beds.map(item => {
      if (item.bed.id === bedId) {
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

    // Update via API using master_data - update status in metadata
    try {
      // Fetch current bed data to get existing metadata
      const currentBedResponse = await masterDataApi.getById(bedId)
      if (!currentBedResponse.success || !currentBedResponse.data) {
        throw new Error('Failed to fetch current bed data')
      }

      const currentBed = currentBedResponse.data
      const updatedMetadata = {
        ...(currentBed.metadata || {}),
        status: newStatus
      }

      const response = await masterDataApi.update(bedId, { metadata: updatedMetadata })
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Bed ${draggedBed.bed.bed_number} moved to ${newStatus}`,
        })
        fetchBeds() // Refresh to get latest data
      } else {
        // Revert on failure
        const revertedBeds = beds.map(item => {
          if (item.bed.id === bedId) {
            return {
              ...item,
              bed: {
                ...item.bed,
                status: oldStatus
              }
            }
          }
          return item
        })
        setBeds(revertedBeds)
        toast({
          title: "Error",
          description: "Failed to update bed status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating bed status:", error)
      // Revert on error
      const revertedBeds = beds.map(item => {
        if (item.bed.id === bedId) {
          return {
            ...item,
            bed: {
              ...item.bed,
              status: oldStatus
            }
          }
        }
        return item
      })
      setBeds(revertedBeds)
      toast({
        title: "Error",
        description: "Failed to update bed status",
        variant: "destructive",
      })
    }
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
  }, {} as Record<string, BedWithAssignment[]>)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bed Management</h1>
          <p className="text-muted-foreground">
            Manage bed availability and patient assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BedForm onSuccess={fetchBeds}>
            <Button variant="outline" className="gap-2">
              <Bed className="h-4 w-4" />
              Add New Bed
            </Button>
          </BedForm>
          <BedAssignmentForm onSuccess={fetchBeds}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Assign Bed
            </Button>
          </BedAssignmentForm>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Beds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBeds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{occupiedBeds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{maintenanceBeds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading beds...</div>
            </div>
          ) : (
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
          )}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading beds...</div>
            </div>
          ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Beds</CardTitle>
                  <CardDescription>
                    Showing {filteredBeds.length} of {beds.length} beds
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[100px]">Bed</TableHead>
                      <TableHead className="w-[140px]">Location</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[120px]">Patient ID</TableHead>
                      <TableHead>Patient Details</TableHead>
                      <TableHead className="w-[140px]">Admission</TableHead>
                      <TableHead className="w-[100px]">Duration</TableHead>
                      <TableHead className="w-[180px]">Surgery Info</TableHead>
                      <TableHead className="w-[140px]">Doctor</TableHead>
                      <TableHead className="w-[100px] text-right">Rate/Day</TableHead>
                      <TableHead className="w-[120px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBeds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                          No beds found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBeds.map(({ bed, assignment }) => (
                        <TableRow 
                          key={bed.id} 
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono font-semibold text-base">
                                {bed.bed_number}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium capitalize text-sm">{bed.ward_name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Badge variant="outline" className="text-xs h-5">
                                  {bed.ward_type}
                                </Badge>
                                Floor {bed.floor_number}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`font-medium ${
                                bed.status === 'available' 
                                  ? 'bg-green-50 text-green-700 border-green-300' 
                                  : bed.status === 'occupied' 
                                  ? 'bg-red-50 text-red-700 border-red-300' 
                                  : bed.status === 'maintenance' 
                                  ? 'bg-gray-50 text-gray-700 border-gray-300' 
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-300'
                              }`}
                            >
                              {bed.status === 'available' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {bed.status === 'occupied' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {bed.status === 'maintenance' && <Wrench className="h-3 w-3 mr-1" />}
                              {bed.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <div className="font-mono text-sm font-semibold text-primary">
                                {(assignment as any).patients?.patient_id || '-'}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{assignment.patient_name}</div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs h-5">
                                    {assignment.patient_mrn}
                                  </Badge>
                                  {assignment.patient_age && (
                                    <span className="text-xs text-muted-foreground">
                                      {assignment.patient_age}y
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {new Date(assignment.admission_date).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(assignment.admission_date).toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <Badge variant="secondary" className="font-mono">
                                {assignment.days_in_ward} {assignment.days_in_ward === 1 ? 'day' : 'days'}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment?.surgery_scheduled_time ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-orange-600">
                                  {new Date(assignment.surgery_scheduled_time).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short'
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(assignment.surgery_scheduled_time).toLocaleTimeString('en-GB', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                                {assignment.surgery_type && (
                                  <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                                    {assignment.surgery_type}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No surgery</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment?.doctor_name ? (
                              <div className="text-sm">{assignment.doctor_name}</div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-sm">
                              ₹{bed.daily_rate.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => handleBedClick({ bed, assignment })}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <BedForm
                                bedData={bed}
                                mode="edit"
                                onSuccess={fetchBeds}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                  title="Edit bed"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </BedForm>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setDeletingBed({ id: bed.id, name: bed.bed_number })}
                                title="Delete bed"
                                disabled={bed.status === 'occupied'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
          )}
        </TabsContent>
      </Tabs>

      {/* Bed Details Dialog */}
      <BedDetailsDialog
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        bedData={selectedBed?.bed || null}
        assignmentData={selectedBed?.assignment || null}
        onDischarge={() => {
          if (selectedBed?.bed?.id) {
            handleDischarge(selectedBed.bed.id)
          }
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
        onRefresh={fetchBeds}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingBed}
        onOpenChange={(open) => !open && setDeletingBed(null)}
        onConfirm={() => deletingBed && handleDelete(deletingBed.id)}
        title="Delete Bed"
        description={`Are you sure you want to delete bed ${deletingBed?.name}? This action cannot be undone.`}
      />
    </div>
  )
}

