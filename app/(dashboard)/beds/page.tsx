"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Bed,
  Eye,
  Trash2,
  Edit,
  Wrench,
  Sparkles,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { cn } from "@/lib/utils"

const bedStatusStyles = {
  available: {
    label: "Available",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    dot: "bg-emerald-500",
  },
  occupied: {
    label: "Occupied",
    pill: "bg-red-50 text-red-700 border border-red-100",
    dot: "bg-red-500",
  },
  reserved: {
    label: "Reserved",
    pill: "bg-amber-50 text-amber-700 border border-amber-100",
    dot: "bg-amber-500",
  },
  maintenance: {
    label: "Maintenance",
    pill: "bg-slate-50 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
    icon: Wrench,
  },
  cleaning: {
    label: "Cleaning",
    pill: "bg-sky-50 text-sky-700 border border-sky-100",
    dot: "bg-sky-400",
    icon: Sparkles,
  },
  default: {
    label: "Unknown",
    pill: "bg-gray-50 text-gray-600 border border-gray-200",
    dot: "bg-gray-400",
  },
} as const

const getBedStatusStyle = (status: string) =>
  bedStatusStyles[status as keyof typeof bedStatusStyles] ?? bedStatusStyles.default

const getNameInitials = (name?: string | null) => {
  if (!name) return "PT"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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
      
      // Fetch bed assignments from beds API (which returns beds from beds table with assignments)
      const assignmentsResponse = await bedsApi.list({ limit: 1000 })

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

        // Match assignments to beds by bed_number (since beds are in master_data but assignments reference beds table)
        if (assignmentsResponse.success && assignmentsResponse.data) {
          // Create a map of bed_number to assignment for faster lookup
          const assignmentMap = new Map<string, any>()
          
          assignmentsResponse.data.forEach((assignmentItem: any) => {
            // assignmentItem has structure: { bed: {...}, assignment: {...} }
            // The bed here is from the beds table, assignment has patient data
            const bedFromBedsTable = assignmentItem.bed
            const assignment = assignmentItem.assignment
            
            // Only process if we have both bed and assignment, and assignment is active
            if (!bedFromBedsTable || !assignment || assignment.status !== 'active') return
            
            const bedNumber = bedFromBedsTable.bed_number
            const wardName = bedFromBedsTable.ward_name
            
            if (bedNumber) {
              // Store assignment keyed by bed_number (normalized)
              const normalizedBedNumber = bedNumber.toString().trim().toLowerCase()
              assignmentMap.set(normalizedBedNumber, {
                bed: bedFromBedsTable,
                assignment: assignment
              })
              
              // Also store by ward_name as fallback (since master_data might use name as bed_number)
              if (wardName) {
                const normalizedWardName = wardName.toString().trim().toLowerCase()
                if (!assignmentMap.has(normalizedWardName)) {
                  assignmentMap.set(normalizedWardName, {
                    bed: bedFromBedsTable,
                    assignment: assignment
                  })
                }
              }
            }
          })
          
          // Now match assignments to master_data beds
          masterBeds.forEach((masterBed: any) => {
            const masterBedNumber = masterBed.bed.bed_number
            const masterBedWardName = masterBed.bed.ward_name
            const masterBedFloor = masterBed.bed.floor_number
            
            // Try to find assignment by bed_number first
            let assignmentData = null
            if (masterBedNumber) {
              const normalizedMasterBedNumber = masterBedNumber.toString().trim().toLowerCase()
              assignmentData = assignmentMap.get(normalizedMasterBedNumber)
            }
            
            // If not found by bed_number, try by ward_name (since master_data might use name as bed_number)
            if (!assignmentData && masterBedWardName) {
              const normalizedWardName = masterBedWardName.toString().trim().toLowerCase()
              assignmentData = assignmentMap.get(normalizedWardName)
            }
            
            // If still not found, try to find by iterating through all assignments
            // and matching by ward_name and floor_number (fallback)
            if (!assignmentData) {
              for (const [key, data] of assignmentMap.entries()) {
                const bedFromBedsTable = data.bed
                if (bedFromBedsTable.ward_name === masterBedWardName && 
                    bedFromBedsTable.floor_number === masterBedFloor) {
                  assignmentData = data
                  break
                }
              }
            }
              
            if (assignmentData && assignmentData.assignment) {
              const assignment = assignmentData.assignment
              // Use the assignment from the API response which already has patient_name, patient_mrn, etc.
              masterBed.assignment = {
                ...assignment,
                patient_name: assignment.patient_name || assignment.patients?.full_name,
                patient_mrn: assignment.patient_mrn || assignment.patients?.patient_id,
                patient_age: assignment.patient_age,
                patient_gender: assignment.patients?.gender || assignment.patient_gender,
                admission_date: assignment.admission_date,
                days_in_ward: assignment.days_in_ward,
                surgery_scheduled_time: assignment.surgery_scheduled_time,
                surgery_type: assignment.surgery_type,
                doctor_name: assignment.doctor_name,
              }
              masterBed.bed.status = 'occupied'
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

  // Function to handle bed assignment discharge
  const handleDischarge = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/bed-assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discharge' }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to discharge bed assignment')
      }

      toast({
        title: "Success",
        description: data.message || "Bed discharged successfully",
      })
      fetchBeds() // Refresh the list
    } catch (error) {
      console.error("Error discharging bed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to discharge bed",
        variant: "destructive",
      })
    }
  }

  // Function to handle bed deletion from master_data
  const handleDelete = async (bedId: string) => {
    try {
      // First, check if bed has active assignments
      const bedToDelete = beds.find(b => b.bed.id === bedId)
      if (bedToDelete?.assignment) {
        // Check if assignment exists (assignment being present means it's active, since we filter for active assignments)
        throw new Error('Cannot delete bed with active patient assignment. Please discharge the patient first.')
      }

      // Perform hard delete for beds (permanently remove)
      const response = await masterDataApi.delete(bedId, true)
      
      // Handle response - fetchApi returns data directly on success, or { success: false, error: ... } on catch
      if (response && typeof response === 'object') {
        if (response.success === false) {
          // Error case from catch block
          throw new Error(response.error || "Failed to delete bed")
        } else if (response.success === true || response.data) {
          // Success case
          toast({
            title: "Success",
            description: response.message || "Bed deleted successfully",
          })
          setDeletingBed(null)
          fetchBeds() // Refresh the list
          return
        }
      }
      
      // If we get here, response format is unexpected
      throw new Error("Unexpected response format from delete API")
    } catch (error) {
      console.error("Error deleting bed:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete bed",
        variant: "destructive",
      })
      // Re-throw to keep dialog open on error
      throw error
    }
  }

  // Calculate statistics based on current bed state
  const totalBeds = beds.length
  const occupiedBeds = beds.filter(b => b.bed.status === 'occupied').length
  const availableBeds = beds.filter(b => b.bed.status === 'available').length
  const reservedBeds = beds.filter(b => b.bed.status === 'reserved').length
  const maintenanceBeds = beds.filter(b => b.bed.status === 'maintenance').length
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
          <h1 className="text-3xl font-bold tracking-tight font-jakarta">Bed Management</h1>
          <p className="text-muted-foreground">
            Manage bed availability and patient assignments
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="h-full border border-gray-200 bg-white">
          <CardContent className="flex h-full flex-col justify-center gap-1 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Beds
            </span>
            <span className="text-3xl font-bold text-gray-900">{totalBeds}</span>
          </CardContent>
        </Card>

        <Card className="h-full border border-emerald-100 bg-emerald-50">
          <CardContent className="flex h-full flex-col justify-center gap-1 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Available
            </span>
            <span className="text-3xl font-bold text-emerald-700">{availableBeds}</span>
          </CardContent>
        </Card>

        <Card className="h-full border border-red-100 bg-red-50">
          <CardContent className="flex h-full flex-col justify-center gap-1 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Occupied
            </span>
            <span className="text-3xl font-bold text-red-700">{occupiedBeds}</span>
          </CardContent>
        </Card>

        <Card className="h-full border border-amber-100 bg-amber-50">
          <CardContent className="flex h-full flex-col justify-center gap-1 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Reserved
            </span>
            <span className="text-3xl font-bold text-amber-700">{reservedBeds}</span>
          </CardContent>
        </Card>

        <Card className="h-full border border-gray-200 bg-gray-100">
          <CardContent className="flex h-full flex-col justify-center gap-1 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Maintenance
            </span>
            <span className="text-3xl font-bold text-gray-600">{maintenanceBeds}</span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <TabsList className="bg-gray-100 p-1 rounded-lg gap-1">
            <TabsTrigger
              value="kanban"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900"
            >
              Kanban View
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900"
            >
              Table View
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <BedAssignmentForm onSuccessAction={fetchBeds}>
              <Button className="gap-2 rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Assign Bed
              </Button>
            </BedAssignmentForm>
            <BedForm onSuccess={fetchBeds}>
              <Button className="gap-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50">
                <Bed className="h-4 w-4" />
                Add New Bed
              </Button>
            </BedForm>
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="w-[130px] rounded-lg border border-gray-300 bg-white text-gray-700">
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
              <SelectTrigger className="w-[110px] rounded-lg border border-gray-300 bg-white text-gray-700">
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
                className="w-[180px] rounded-lg border border-gray-300 bg-white pl-8 text-gray-700"
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
              className={`rounded-xl border border-gray-100 bg-gray-50/50 transition-all ${dragOverColumn === 'available' ? 'ring-2 ring-green-500 shadow-lg' : ''}`}
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
                    {filteredBeds.filter(b => b.bed.status === 'available').length} Beds
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
                        onClickAction={() => handleBedClick(bedData)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Occupied Column */}
            <Card 
              className={`rounded-xl border border-gray-100 bg-gray-50/50 transition-all ${dragOverColumn === 'occupied' ? 'ring-2 ring-red-500 shadow-lg' : ''}`}
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
                    {filteredBeds.filter(b => b.bed.status === 'occupied').length} Beds
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
                        onClickAction={() => handleBedClick(bedData)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Reserved Column */}
            <Card 
              className={`rounded-xl border border-gray-100 bg-gray-50/50 transition-all ${dragOverColumn === 'reserved' ? 'ring-2 ring-yellow-500 shadow-lg' : ''}`}
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
                    {filteredBeds.filter(b => b.bed.status === 'reserved').length} Beds
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
                        onClickAction={() => handleBedClick(bedData)}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Maintenance Column */}
            <Card 
              className={`rounded-xl border border-gray-100 bg-gray-50/50 transition-all ${dragOverColumn === 'maintenance' ? 'ring-2 ring-gray-500 shadow-lg' : ''}`}
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
                    {filteredBeds.filter(b => b.bed.status === 'maintenance').length} Beds
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
                        onClickAction={() => handleBedClick(bedData)}
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
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                      filteredBeds.map(({ bed, assignment }) => {
                        const statusStyle = getBedStatusStyle(bed.status)
                        const StatusIcon = 'icon' in statusStyle ? statusStyle.icon : undefined
                        const isOutOfService = bed.status === 'maintenance' || bed.status === 'cleaning'

                        return (
                        <TableRow 
                          key={bed.id} 
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            isOutOfService && "bg-slate-50/80 border-l-4 border-dashed border-slate-200 [&>td]:opacity-75"
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <Bed className="h-4 w-4" />
                              </span>
                              <div className="space-y-0.5">
                                <div className="text-sm font-bold text-gray-900">
                                  {bed.bed_number}
                                </div>
                                <div className="text-xs font-medium text-muted-foreground">
                                  {bed.bed_type || "Standard"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {bed.ward_name}
                              </div>
                              <div className="text-xs text-gray-600">
                                Floor {bed.floor_number}
                                {bed.room_number ? ` • Room ${bed.room_number}` : ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.pill}`}
                            >
                              <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
                              {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
                              {statusStyle.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <div className="font-mono text-sm font-semibold text-primary">
                                {assignment.patient_mrn || (assignment as any).patients?.patient_id || '-'}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-gray-100 bg-white shadow-sm">
                                  <AvatarFallback className="text-xs font-semibold text-gray-600 bg-slate-100">
                                    {getNameInitials(assignment.patient_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-0.5">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {assignment.patient_name || "Patient"}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {assignment.patient_mrn && (
                                      <span className="font-mono uppercase text-[11px] tracking-wide text-gray-500">
                                        {assignment.patient_mrn}
                                      </span>
                                    )}
                                    {assignment.patient_age && (
                                      <span>{assignment.patient_age}y</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-dashed border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                                Vacant
                              </span>
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
                            <span className="font-mono text-sm font-semibold text-gray-900 tabular-nums">
                              ₹{bed.daily_rate.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                onClick={() => handleBedClick({ bed, assignment })}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {assignment && assignment.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-md text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                                  onClick={() => handleDischarge(assignment.id)}
                                  title="Discharge patient"
                                >
                                  <LogOut className="h-4 w-4" />
                                </Button>
                              )}
                              <BedForm
                                bedData={bed}
                                mode="edit"
                                onSuccess={fetchBeds}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-md text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                                  title="Edit bed"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </BedForm>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setDeletingBed({ id: bed.id, name: bed.bed_number })}
                                title="Delete bed"
                                disabled={bed.status === 'occupied'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )})
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
          if (selectedBed?.assignment?.id) {
            handleDischarge(selectedBed.assignment.id)
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

