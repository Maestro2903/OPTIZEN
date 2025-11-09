"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Shield, ShieldAlert, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// All modules in the system
const MODULES = [
  { key: 'patients', label: 'Patient' },
  { key: 'appointments', label: 'Appointment' },
  { key: 'cases', label: 'Case' },
  { key: 'operations', label: 'Operation' },
  { key: 'discharges', label: 'Discharge' },
  { key: 'certificates', label: 'Certificate' },
  { key: 'invoices', label: 'Billing' },
  { key: 'beds', label: 'Bed' },
  { key: 'lens', label: 'Lens' },
  { key: 'complaint', label: 'Complaint' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'dosage', label: 'Dosage' },
  { key: 'surgery', label: 'Surgery' },
  { key: 'blood_investigation', label: 'Blood Investigation' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'employees', label: 'Employee' },
  { key: 'roles', label: 'Role' },
]

// Permission actions
const ACTIONS = [
  { key: 'read', label: 'ACCESS' },
  { key: 'create', label: 'CREATE' },
  { key: 'print', label: 'PRINT' },
  { key: 'update', label: 'EDIT' },
  { key: 'delete', label: 'DELETE' },
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

export default function AccessControlPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedRole, setSelectedRole] = useState('super_admin')
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

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
            
            // Initialize empty permissions
            const emptyPermissions: Record<string, boolean> = {}
            MODULES.forEach(module => {
              ACTIONS.forEach(action => {
                const key = `${module.key}-${action.key}`
                emptyPermissions[key] = false
              })
            })
            setPermissions(emptyPermissions)
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
            description: 'Failed to connect to database',
            variant: 'destructive',
          })
          
          // Initialize empty permissions
          const emptyPermissions: Record<string, boolean> = {}
          MODULES.forEach(module => {
            ACTIONS.forEach(action => {
              const key = `${module.key}-${action.key}`
              emptyPermissions[key] = false
            })
          })
          setPermissions(emptyPermissions)
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
          title: `❌ Failed (${response.status})`,
          description: errorData.error || 'Could not save to database',
          variant: 'destructive',
          duration: 5000,
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
        title: '✅ Saved',
        description: `${module}.${action} is now ${newValue ? 'enabled' : 'disabled'}`,
        duration: 2000,
      })
      
    } catch (error) {
      console.error('💥 Connection Error:', error)
      
      toast({
        title: '💥 Connection Error',
        description: error instanceof Error ? error.message : 'Network error',
        variant: 'destructive',
        duration: 5000,
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

  const selectedRoleData = ROLES.find(r => r.value === selectedRole)
  const enabledCount = Object.values(permissions).filter(v => v).length
  const totalCount = MODULES.length * ACTIONS.length

  return (
    <div className="space-y-6 p-6">
      {/* Header with Role Selector - Merged Card */}
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
                {enabledCount} / {totalCount} enabled
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Toggle switches to enable/disable permissions
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold min-w-[200px]">MODULE</TableHead>
                    {ACTIONS.map(action => (
                      <TableHead key={action.key} className="text-center font-bold min-w-[120px]">
                        {action.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map(module => (
                    <TableRow key={module.key} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {module.label}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
