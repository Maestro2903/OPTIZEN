"use client"

import { LogOut } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export function NavUser() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { state } = useSidebar()

  const handleLogout = () => {
    router.push('/auth/logout')
  }

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-24 w-full" />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    return null
  }

  // Get user initials for avatar fallback
  const fullName = (user.full_name || '').trim()
  const initials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  // Role display name
  const role = typeof user.role === 'string' ? user.role : ''
  const roleDisplayName = role
    ? role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown'

  // Role badge color - handles all role types from database
  const getRoleBadgeColor = () => {
    const roleStr = String(user.role || '')
    
    // Super admin
    if (roleStr === 'super_admin') return 'bg-yellow-500 text-white'
    
    // Admin roles
    if (roleStr === 'admin' || roleStr === 'hospital_admin') return 'bg-blue-500 text-white'
    
    // Medical professionals
    if (roleStr === 'doctor' || roleStr === 'ophthalmologist' || roleStr === 'optometrist') {
      return 'bg-green-500 text-white'
    }
    
    // Nurse
    if (roleStr === 'nurse') return 'bg-purple-500 text-white'
    
    // Receptionist
    if (roleStr === 'receptionist') return 'bg-pink-500 text-white'
    
    // Finance/Billing
    if (roleStr === 'finance' || roleStr === 'billing_staff') return 'bg-orange-500 text-white'
    
    // Pharmacy
    if (roleStr === 'pharmacy' || roleStr === 'pharmacy_staff') return 'bg-teal-500 text-white'
    
    // Lab technician
    if (roleStr === 'lab_technician') return 'bg-indigo-500 text-white'
    
    // Generic technician
    if (roleStr === 'technician') return 'bg-purple-500 text-white'
    
    // Default
    return 'bg-gray-500 text-white'
  }

  // When sidebar is collapsed, show only avatar
  if (state === "collapsed") {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="list-none">
          <div className="flex items-center justify-center p-2">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="rounded-lg bg-blue-700 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // When sidebar is expanded, show full user info and logout
  return (
    <SidebarMenu>
      <SidebarMenuItem className="list-none">
        <div className="flex flex-col gap-3 px-4 py-3 pb-6">
          {/* User Info Section */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 rounded-lg shrink-0">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="rounded-lg bg-blue-700 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="truncate font-semibold text-sm leading-tight">{user.full_name}</span>
              <span className="truncate text-xs text-muted-foreground leading-tight mt-0.5">{user.email}</span>
              <Badge className={`${getRoleBadgeColor()} text-xs mt-2 w-fit px-2 py-0.5`}>
                {roleDisplayName}
              </Badge>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-center gap-2 h-9"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </Button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

