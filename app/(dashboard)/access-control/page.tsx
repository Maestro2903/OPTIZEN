"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search, 
  Filter,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Module categories with descriptions
const MODULE_CATEGORIES = [
  {
    id: 'clinical',
    label: 'Clinical Operations',
    description: 'Patient care and medical procedures',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'master_data',
    label: 'Master Data / Medical Records',
    description: 'Medical reference data and templates',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'financial',
    label: 'Financial Management',
    description: 'Billing, revenue, and expense tracking',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Day-to-day hospital operations',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    id: 'administration',
    label: 'System & Administration',
    description: 'User management and system configuration',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
]

// All modules in the system with descriptions and categories
const MODULES = [
  // Clinical Operations
  { 
    key: 'patients', 
    label: 'Patients', 
    category: 'clinical',
    description: 'Patient registration, demographics, and medical history'
  },
  { 
    key: 'appointments', 
    label: 'Appointments', 
    category: 'clinical',
    description: 'Schedule and manage patient appointments'
  },
  { 
    key: 'bookings', 
    label: 'Appointment Requests / Bookings', 
    category: 'clinical',
    description: 'Manage public appointment requests and bookings'
  },
  { 
    key: 'doctor_schedule', 
    label: 'Doctor Schedule', 
    category: 'clinical',
    description: 'Manage doctor schedules and availability'
  },
  { 
    key: 'cases', 
    label: 'Cases', 
    category: 'clinical',
    description: 'Medical cases, encounters, and clinical notes'
  },
  { 
    key: 'operations', 
    label: 'Operations', 
    category: 'clinical',
    description: 'Surgical procedures and operation theater scheduling'
  },
  { 
    key: 'discharges', 
    label: 'Discharges', 
    category: 'clinical',
    description: 'Patient discharge summaries and records'
  },
  { 
    key: 'certificates', 
    label: 'Certificates', 
    category: 'clinical',
    description: 'Medical certificates and fitness documents'
  },
  
  // Master Data / Medical Records
  { 
    key: 'lens', 
    label: 'Lens', 
    category: 'master_data',
    description: 'Optical lens types and specifications'
  },
  { 
    key: 'complaint', 
    label: 'Complaints', 
    category: 'master_data',
    description: 'Common patient complaints and symptoms'
  },
  { 
    key: 'treatment', 
    label: 'Treatments', 
    category: 'master_data',
    description: 'Treatment plans and procedures'
  },
  { 
    key: 'medicine', 
    label: 'Medicines', 
    category: 'master_data',
    description: 'Medicine catalog and drug information'
  },
  { 
    key: 'dosage', 
    label: 'Dosages', 
    category: 'master_data',
    description: 'Dosage forms and frequencies'
  },
  { 
    key: 'surgery', 
    label: 'Surgery Types', 
    category: 'master_data',
    description: 'Surgical procedure types and templates'
  },
  { 
    key: 'blood_investigation', 
    label: 'Blood Investigations', 
    category: 'master_data',
    description: 'Blood test types and lab investigations'
  },
  { 
    key: 'diagnosis', 
    label: 'Diagnoses', 
    category: 'master_data',
    description: 'Diagnosis codes and descriptions'
  },
  { 
    key: 'master_data', 
    label: 'Master Data', 
    category: 'master_data',
    description: 'General master data and system lookups'
  },
  
  // Financial Management
  { 
    key: 'invoices', 
    label: 'Billing/Invoices', 
    category: 'financial',
    description: 'Patient billing and invoice management'
  },
  { 
    key: 'revenue', 
    label: 'Revenue Records', 
    category: 'financial',
    description: 'Individual revenue transactions and income tracking'
  },
  { 
    key: 'expenses', 
    label: 'Expense Records', 
    category: 'financial',
    description: 'Expense records and cost management'
  },
  { 
    key: 'finance', 
    label: 'Finance Dashboard', 
    category: 'financial',
    description: 'Finance overview, reports, and financial analytics'
  },
  
  // Operations
  { 
    key: 'beds', 
    label: 'Beds', 
    category: 'operations',
    description: 'Bed management and patient assignments'
  },
  { 
    key: 'pharmacy', 
    label: 'Pharmacy', 
    category: 'operations',
    description: 'Pharmacy inventory and medication dispensing'
  },
  { 
    key: 'attendance', 
    label: 'Attendance', 
    category: 'operations',
    description: 'Staff attendance tracking and management'
  },
  
  // System & Administration
  { 
    key: 'employees', 
    label: 'Employees', 
    category: 'administration',
    description: 'Employee records and staff management'
  },
  { 
    key: 'users', 
    label: 'Users', 
    category: 'administration',
    description: 'User accounts and authentication'
  },
  { 
    key: 'roles', 
    label: 'Roles', 
    category: 'administration',
    description: 'Role definitions and access control'
  },
  { 
    key: 'audit_logs', 
    label: 'Audit Logs', 
    category: 'administration',
    description: 'System audit logs and activity tracking'
  },
  { 
    key: 'reports', 
    label: 'Reports', 
    category: 'administration',
    description: 'System reports and analytics'
  },
]

// Permission actions
const ACTIONS = [
  { key: 'read', label: 'ACCESS', description: 'View and read data' },
  { key: 'create', label: 'CREATE', description: 'Add new records' },
  { key: 'print', label: 'PRINT', description: 'Print documents' },
  { key: 'update', label: 'EDIT', description: 'Modify existing data' },
  { key: 'delete', label: 'DELETE', description: 'Remove records', critical: true },
]

// Available roles
const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-yellow-500' },
  { value: 'admin', label: 'Hospital Admin', color: 'bg-blue-500' },
  { value: 'doctor', label: 'Doctor', color: 'bg-green-500' },
  { value: 'nurse', label: 'Nurse', color: 'bg-purple-500' },
  { value: 'receptionist', label: 'Receptionist', color: 'bg-pink-500' },
  { value: 'finance', label: 'Billing Staff', color: 'bg-orange-500' },
  { value: 'pharmacy', label: 'Pharmacy Staff', color: 'bg-teal-500' },
  { value: 'lab_technician', label: 'Lab Technician', color: 'bg-indigo-500' },
]

// Helper function to build empty permissions object
function buildEmptyPermissions() {
  const emptyPermissions: Record<string, boolean> = {}
  MODULES.forEach(module => {
    ACTIONS.forEach(action => {
      const key = `${module.key}-${action.key}`
      emptyPermissions[key] = false
    })
  })
  return emptyPermissions
}

export default function AccessControlPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedRole, setSelectedRole] = useState('super_admin')
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {}
  })

  // Fetch permissions from database when role changes
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    
    const fetchPermissions = async () => {
      console.log('📥 Fetching permissions from database for role:', selectedRole)
      setLoading(true)
      
      try {
        const response = await fetch(`/api/access-control?role=${selectedRole}`, { signal })
        
        // Check if request was aborted
        if (signal.aborted) {
          console.log('⚠️ Request aborted for role:', selectedRole)
          return
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ Failed to fetch permissions:', response.status, errorData)
          
          if (!signal.aborted) {
            toast({
              title: 'Error Loading Permissions',
              description: errorData.error || 'Failed to load permissions',
              variant: 'destructive',
            })
            
            setPermissions(buildEmptyPermissions())
          }
          return
        }

        const data = await response.json()
        
        // Check again if aborted after receiving data
        if (signal.aborted) {
          console.log('⚠️ Request aborted after receiving data for role:', selectedRole)
          return
        }
        
        console.log('✅ Fetched permissions:', data)
        
        // Convert nested structure to flat key-value pairs
        const flatPermissions: Record<string, boolean> = {}
        MODULES.forEach(module => {
          ACTIONS.forEach(action => {
            const key = `${module.key}-${action.key}`
            flatPermissions[key] = data.permissions?.[module.key]?.[action.key] === true
          })
        })
        
        console.log('📊 Loaded permissions count:', Object.values(flatPermissions).filter(v => v).length)
        setPermissions(flatPermissions)
        
      } catch (error: any) {
        // Don't show errors for aborted requests
        if (error.name === 'AbortError' || signal.aborted) {
          console.log('⚠️ Fetch aborted for role:', selectedRole)
          return
        }
        
        console.error('💥 Error fetching permissions:', error)
        
        if (!signal.aborted) {
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to database. Please try again.',
            variant: 'destructive',
          })
          
          setPermissions(buildEmptyPermissions())
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }
    
    fetchPermissions()
    
    // Cleanup: abort the fetch when role changes or component unmounts
    return () => {
      controller.abort()
    }
  }, [selectedRole, toast])

  // Handle toggle with proper state management
  const handleToggle = async (module: string, action: string) => {
    const key = `${module}-${action}`
    const currentValue = permissions[key] || false
    const newValue = !currentValue
    
    console.log(`🔄 Toggle clicked: ${key}`, { currentValue, newValue, role: selectedRole })
    
    // Mark as saving
    setSavingKeys(prev => new Set(prev).add(key))
    
    try {
      // Save to database WITHOUT optimistic update
      console.log('📡 Sending request to database...')
      const response = await fetch('/api/access-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: selectedRole,
          resource: module,
          action: action,
          enabled: newValue,
        }),
      })

      console.log('📡 Response:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ API Error:', errorData)
        
        toast({
          title: `Failed to ${newValue ? 'enable' : 'disable'} permission`,
          description: errorData.error || 'Could not save to database',
          variant: 'destructive',
        })
        return
      }

      const result = await response.json()
      console.log('✅ Database updated successfully:', result)
      
      // ONLY update state after successful save
      setPermissions(prev => ({
        ...prev,
        [key]: newValue
      }))
      
      toast({
        title: 'Permission Updated',
        description: `${module}.${action} is now ${newValue ? 'enabled' : 'disabled'}`,
      })
      
    } catch (error) {
      console.error('💥 Connection Error:', error)
      
      toast({
        title: 'Connection Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      // Remove from saving set
      setSavingKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
      console.log('✅ Toggle operation completed')
    }
  }

  // Bulk toggle for entire module (row)
  const handleToggleModule = async (moduleKey: string, enable: boolean) => {
    const affectedPermissions = ACTIONS.filter(action => {
      const key = `${moduleKey}-${action.key}`
      return permissions[key] !== enable
    })

    if (affectedPermissions.length === 0) {
      toast({
        title: 'No Changes',
        description: `All permissions for this module are already ${enable ? 'enabled' : 'disabled'}`,
      })
      return
    }

    setConfirmDialog({
      open: true,
      title: `${enable ? 'Enable' : 'Disable'} All Permissions?`,
      description: `This will ${enable ? 'enable' : 'disable'} ${affectedPermissions.length} permission(s) for the ${moduleKey} module. Continue?`,
      action: async () => {
        for (const action of affectedPermissions) {
          await handleToggle(moduleKey, action.key)
        }
        toast({
          title: 'Bulk Update Complete',
          description: `${affectedPermissions.length} permissions updated`,
        })
      }
    })
  }

  // Bulk toggle for entire action (column)
  const handleToggleAction = async (actionKey: string, enable: boolean) => {
    const filteredModules = getFilteredModules()
    const affectedPermissions = filteredModules.filter(module => {
      const key = `${module.key}-${actionKey}`
      return permissions[key] !== enable
    })

    if (affectedPermissions.length === 0) {
      toast({
        title: 'No Changes',
        description: `All ${actionKey} permissions are already ${enable ? 'enabled' : 'disabled'}`,
      })
      return
    }

    const action = ACTIONS.find(a => a.key === actionKey)
    if (action?.critical && !enable) {
      setConfirmDialog({
        open: true,
        title: `Disable Critical Permissions?`,
        description: `You're about to disable ${affectedPermissions.length} ${actionKey.toUpperCase()} permission(s). This is a critical operation. Continue?`,
        action: async () => {
          for (const mod of affectedPermissions) {
            await handleToggle(mod.key, actionKey)
          }
          toast({
            title: 'Bulk Update Complete',
            description: `${affectedPermissions.length} permissions updated`,
          })
        }
      })
    } else {
      setConfirmDialog({
        open: true,
        title: `${enable ? 'Enable' : 'Disable'} Multiple Permissions?`,
        description: `This will ${enable ? 'enable' : 'disable'} ${affectedPermissions.length} ${actionKey.toUpperCase()} permission(s). Continue?`,
        action: async () => {
          for (const mod of affectedPermissions) {
            await handleToggle(mod.key, actionKey)
          }
          toast({
            title: 'Bulk Update Complete',
            description: `${affectedPermissions.length} permissions updated`,
          })
        }
      })
    }
  }

  // Check if permission is enabled
  const isEnabled = (module: string, action: string): boolean => {
    const key = `${module}-${action}`
    return permissions[key] === true
  }

  // Check if currently saving
  const isSaving = (module: string, action: string): boolean => {
    const key = `${module}-${action}`
    return savingKeys.has(key)
  }

  // Toggle category collapse
  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Filter modules based on search and category
  const getFilteredModules = () => {
    return MODULES.filter(module => {
      const matchesSearch = searchQuery === '' || 
        module.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === null || module.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }

  // Group modules by category
  const getModulesByCategory = () => {
    const filteredModules = getFilteredModules()
    const grouped = new Map<string, typeof MODULES>()
    
    MODULE_CATEGORIES.forEach(cat => {
      const categoryModules = filteredModules.filter(m => m.category === cat.id)
      if (categoryModules.length > 0) {
        grouped.set(cat.id, categoryModules)
      }
    })
    
    return grouped
  }

  // Calculate statistics
  const getStatistics = () => {
    const filteredModules = getFilteredModules()
    const total = filteredModules.length * ACTIONS.length
    const enabled = filteredModules.reduce((count, module) => {
      return count + ACTIONS.filter(action => isEnabled(module.key, action.key)).length
    }, 0)
    
    const byCategory = MODULE_CATEGORIES.map(cat => {
      const categoryModules = filteredModules.filter(m => m.category === cat.id)
      const categoryTotal = categoryModules.length * ACTIONS.length
      const categoryEnabled = categoryModules.reduce((count, module) => {
        return count + ACTIONS.filter(action => isEnabled(module.key, action.key)).length
      }, 0)
      return {
        category: cat,
        total: categoryTotal,
        enabled: categoryEnabled
      }
    }).filter(stat => stat.total > 0)
    
    return { total, enabled, byCategory }
  }

  const selectedRoleData = ROLES.find(r => r.value === selectedRole)
  const statistics = getStatistics()
  const modulesByCategory = getModulesByCategory()

  return (
    <div className="space-y-6 p-6">
      {/* Header with Role Selector */}
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Access Control</CardTitle>
                <CardDescription className="text-base">
                  Manage role permissions and access levels
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-yellow-500 text-white px-4 py-2 text-sm">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Super Admin Only
            </Badge>
          </div>
          
          {/* Role Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${role.color}`} />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedRoleData && (
              <Badge className={`${selectedRoleData.color} text-white px-3 py-1`}>
                {selectedRoleData.label}
              </Badge>
            )}
            {!loading && (
              <Badge variant="secondary" className="px-3 py-1">
                {statistics.enabled} / {statistics.total} enabled
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      {!loading && statistics.byCategory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statistics.byCategory.map(stat => (
            <Card key={stat.category.id} className={`border ${stat.category.color}`}>
              <CardContent className="pt-6">
                <div className="text-sm font-medium mb-2">{stat.category.label}</div>
                <div className="text-2xl font-bold">
                  {stat.enabled} / {stat.total}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.total > 0 ? Math.round((stat.enabled / stat.total) * 100) : 0}% enabled
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select 
              value={selectedCategory || 'all'} 
              onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[250px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MODULE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Toggle switches to enable/disable permissions. Click row/column icons for bulk operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(modulesByCategory).map(([categoryId, categoryModules]) => {
                const category = MODULE_CATEGORIES.find(c => c.id === categoryId)!
                const isCollapsed = collapsedCategories.has(categoryId)
                
                return (
                  <div key={categoryId} className="space-y-2">
                    {/* Category Header */}
                    <div 
                      className={`flex items-center justify-between p-3 rounded-lg border ${category.color} cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => toggleCategoryCollapse(categoryId)}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        <div>
                          <div className="font-semibold">{category.label}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {categoryModules.length} module{categoryModules.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {/* Category Table */}
                    {!isCollapsed && (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-bold min-w-[250px]">
                                MODULE
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3 w-3 ml-2 inline text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Click icons at end of row for bulk operations</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableHead>
                              {ACTIONS.map(action => (
                                <TableHead key={action.key} className="text-center font-bold min-w-[120px]">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center gap-1">
                                          <span>{action.label}</span>
                                          {action.critical && (
                                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{action.description}</p>
                                        {action.critical && <p className="text-orange-500 mt-1">Critical operation</p>}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableHead>
                              ))}
                              <TableHead className="text-center font-bold w-[120px]">
                                BULK
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryModules.map(module => {
                              const allEnabled = ACTIONS.every(action => isEnabled(module.key, action.key))
                              const noneEnabled = ACTIONS.every(action => !isEnabled(module.key, action.key))
                              
                              return (
                                <TableRow key={module.key} className="hover:bg-muted/30">
                                  <TableCell className="font-medium">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="cursor-help">
                                            <div className="font-semibold">{module.label}</div>
                                            <div className="text-xs text-muted-foreground">{module.description}</div>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="max-w-xs">{module.description}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  {ACTIONS.map(action => {
                                    const enabled = isEnabled(module.key, action.key)
                                    const saving = isSaving(module.key, action.key)
                                    const key = `${module.key}-${action.key}`
                                    const switchId = `switch-${key}`
                                    
                                    return (
                                      <TableCell key={action.key} className="text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              id={switchId}
                                              checked={enabled}
                                              onCheckedChange={() => handleToggle(module.key, action.key)}
                                              disabled={saving}
                                              className="data-[state=checked]:bg-green-500"
                                            />
                                            <Label
                                              htmlFor={switchId}
                                              className="cursor-pointer"
                                            >
                                              {saving ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                              ) : enabled ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                              ) : (
                                                <XCircle className="h-4 w-4 text-gray-300" />
                                              )}
                                            </Label>
                                          </div>
                                        </div>
                                      </TableCell>
                                    )
                                  })}
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleToggleModule(module.key, true)}
                                              disabled={allEnabled}
                                              className="h-8 w-8 p-0"
                                            >
                                              <ToggleRight className="h-4 w-4 text-green-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Enable all</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleToggleModule(module.key, false)}
                                              disabled={noneEnabled}
                                              className="h-8 w-8 p-0"
                                            >
                                              <ToggleLeft className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Disable all</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                            
                            {/* Column bulk operations row */}
                            <TableRow className="bg-muted/30 border-t-2">
                              <TableCell className="font-bold">
                                BULK OPERATIONS
                              </TableCell>
                              {ACTIONS.map(action => {
                                const allEnabled = categoryModules.every(module => isEnabled(module.key, action.key))
                                const noneEnabled = categoryModules.every(module => !isEnabled(module.key, action.key))
                                
                                return (
                                  <TableCell key={action.key} className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleToggleAction(action.key, true)}
                                              disabled={allEnabled}
                                              className="h-8 w-8 p-0"
                                            >
                                              <ToggleRight className="h-4 w-4 text-green-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Enable all {action.label}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleToggleAction(action.key, false)}
                                              disabled={noneEnabled}
                                              className="h-8 w-8 p-0"
                                            >
                                              <ToggleLeft className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Disable all {action.label}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                )
                              })}
                              <TableCell />
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {modulesByCategory.size === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No modules found matching your search criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({...confirmDialog, open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                confirmDialog.action()
                setConfirmDialog({...confirmDialog, open: false})
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
