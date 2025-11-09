"use client"

import * as React from "react"
import {
  Users,
  Calendar,
  FileText,
  CreditCard,
  Package,
  Stethoscope,
  FolderOpen,
  Award,
  Database,
  UserCog,
  Clock,
  TrendingUp,
  Bed,
  Shield,
} from "lucide-react"
import { Logo } from "@/components/logo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUser } from "@/contexts/user-context"

// Map navigation items to their required permissions
const navigationItems = [
  {
    title: "Patients",
    url: "/dashboard/patients",
    icon: Users,
    requiredPermission: "patients" as const,
  },
  {
    title: "Appointments",
    url: "/dashboard/appointments",
    icon: Calendar,
    requiredPermission: "appointments" as const,
  },
  {
    title: "Cases",
    url: "/dashboard/cases",
    icon: FolderOpen,
    requiredPermission: "cases" as const,
  },
  {
    title: "Operations",
    url: "/dashboard/operations",
    icon: Stethoscope,
    requiredPermission: "operations" as const,
  },
  {
    title: "Discharges",
    url: "/dashboard/discharges",
    icon: FileText,
    requiredPermission: "discharges" as const,
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: CreditCard,
    requiredPermission: "invoices" as const,
  },
  {
    title: "Pharmacy",
    url: "/dashboard/pharmacy",
    icon: Package,
    requiredPermission: "pharmacy" as const,
  },
  {
    title: "Revenue",
    url: "/dashboard/revenue",
    icon: TrendingUp,
    requiredPermission: "revenue" as const,
  },
  {
    title: "Beds",
    url: "/dashboard/beds",
    icon: Bed,
    requiredPermission: "beds" as const,
  },
  {
    title: "Certificates",
    url: "/dashboard/certificates",
    icon: Award,
    requiredPermission: "certificates" as const,
  },
  {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon: Clock,
    requiredPermission: "attendance" as const,
  },
  {
    title: "Employees",
    url: "/dashboard/employees",
    icon: UserCog,
    requiredPermission: "employees" as const,
  },
  {
    title: "Master Data",
    url: "/dashboard/master",
    icon: Database,
    requiredPermission: "master_data" as const,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasModuleAccess, isSuperAdmin, loading } = useUser()
  const { state } = useSidebar()

  // Filter navigation items based on user permissions
  const filteredNavItems = React.useMemo(() => {
    // During loading, show all items in disabled state
    if (loading) {
      const allItems = navigationItems.map(item => ({ ...item, disabled: true }))
      return allItems
    }
    
    const items = navigationItems.filter(item => 
      hasModuleAccess(item.requiredPermission)
    )

    // Add Access Control for super admin
    if (isSuperAdmin()) {
      items.push({
        title: "Access Control",
        url: "/dashboard/access-control",
        icon: Shield,
        requiredPermission: "roles" as const,
      })
    }

    return items
  }, [hasModuleAccess, isSuperAdmin, loading])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {state === "collapsed" ? (
          <div className="flex items-center justify-center py-4">
            <Logo className="size-8" width={32} height={32} />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 py-4">
            <Logo className="size-10 shrink-0" width={40} height={40} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-base">EyeZen</span>
              <span className="truncate text-xs text-muted-foreground">Hospital Management</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavItems} isLoading={loading} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

