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
  CalendarClock,
  CalendarCheck,
  Eye,
  FolderTree,
  Upload,
} from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { cn } from "@/lib/utils"

import { NavMain } from "@/components/shared/nav-main"
import { NavUser } from "@/components/shared/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUser } from "@/contexts/user-context"

// Navigation groups
const navigationGroups = [
  {
    header: "CLINICAL",
    items: [
      {
        title: "Patients",
        url: "/patients",
        icon: Users,
        requiredPermission: "patients" as const,
      },
      {
        title: "Appointments",
        url: "/appointments",
        icon: Calendar,
        requiredPermission: "appointments" as const,
      },
      {
        title: "Bookings",
        url: "/bookings",
        icon: CalendarCheck,
        requiredPermission: "appointments" as const,
      },
      {
        title: "My Schedule",
        url: "/doctor-schedule",
        icon: CalendarClock,
        requiredPermission: "doctor_schedule" as const,
      },
      {
        title: "Cases",
        url: "/cases",
        icon: FolderOpen,
        requiredPermission: "cases" as const,
      },
      {
        title: "Medical Records",
        url: "/medical-records",
        icon: FolderTree,
        requiredPermission: "patients" as const,
      },
      {
        title: "Out Patient Records",
        url: "/out-patient-records",
        icon: FileText,
        requiredPermission: "patients" as const,
      },
      {
        title: "Vision Records",
        url: "/vision",
        icon: Eye,
        requiredPermission: "patients" as const,
      },
      {
        title: "Diagnosis & Tests",
        url: "/diagnosis-tests",
        icon: FileText,
        requiredPermission: "patients" as const,
      },
      {
        title: "Treatments & Medications",
        url: "/treatments-medications",
        icon: FileText,
        requiredPermission: "patients" as const,
      },
      {
        title: "Blood & Advice",
        url: "/blood-advice",
        icon: FileText,
        requiredPermission: "patients" as const,
      },
      {
        title: "Operations",
        url: "/operations",
        icon: Stethoscope,
        requiredPermission: "operations" as const,
      },
      {
        title: "Discharges",
        url: "/discharges",
        icon: FileText,
        requiredPermission: "discharges" as const,
      },
      {
        title: "Beds",
        url: "/beds",
        icon: Bed,
        requiredPermission: "beds" as const,
      },
      {
        title: "Certificates",
        url: "/certificates",
        icon: Award,
        requiredPermission: "certificates" as const,
      },
      {
        title: "Optical Plan",
        url: "/optical-plan",
        icon: Eye,
        requiredPermission: "optical_plan" as const,
      },
    ],
  },
  {
    header: "ADMIN",
    items: [
      {
        title: "All Billing",
        url: "/billing",
        icon: CreditCard,
        requiredPermission: "invoices" as const,
      },
      {
        title: "Consultation & Operation Billing",
        url: "/billing/consultation-operation",
        icon: CreditCard,
        requiredPermission: "invoices" as const,
      },
      {
        title: "Medical Billing",
        url: "/billing/medical",
        icon: CreditCard,
        requiredPermission: "invoices" as const,
      },
      {
        title: "Optical Billing",
        url: "/billing/optical",
        icon: CreditCard,
        requiredPermission: "invoices" as const,
      },
      {
        title: "Finance",
        url: "/finance",
        icon: TrendingUp,
        requiredPermission: "finance" as const,
      },
      {
        title: "Pharmacy",
        url: "/pharmacy",
        icon: Package,
        requiredPermission: "pharmacy" as const,
      },
      {
        title: "Attendance",
        url: "/attendance",
        icon: Clock,
        requiredPermission: "attendance" as const,
      },
      {
        title: "Employees",
        url: "/employees",
        icon: UserCog,
        requiredPermission: "employees" as const,
      },
      {
        title: "Old Patient Records",
        url: "/old-patient-records",
        icon: Upload,
        requiredPermission: "patients" as const,
      },
    ],
  },
  {
    header: "SYSTEM",
    items: [
      {
        title: "Master Data",
        url: "/master",
        icon: Database,
        requiredPermission: "master_data" as const,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { hasModuleAccess, isSuperAdmin, loading } = useUser()
  const { state } = useSidebar()

  // Filter navigation groups based on user permissions
  const filteredNavGroups = React.useMemo(() => {
    // During loading, show all items in disabled state
    if (loading) {
      return navigationGroups.map(group => ({
        ...group,
        items: group.items.map(item => ({ ...item, disabled: true })),
      }))
    }
    
    const groups = navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        hasModuleAccess(item.requiredPermission)
      ),
    })).filter(group => group.items.length > 0) // Remove empty groups

    // Add Access Control to SYSTEM group for super admin
    if (isSuperAdmin()) {
      const systemGroup = groups.find(g => g.header === "SYSTEM")
      if (systemGroup) {
        systemGroup.items.push({
          title: "Access Control",
          url: "/access-control",
          icon: Shield,
          requiredPermission: "roles" as any,
        })
      } else {
        // If SYSTEM group doesn't exist, create it
        groups.push({
          header: "SYSTEM",
          items: [{
            title: "Access Control",
            url: "/access-control",
            icon: Shield,
            requiredPermission: "roles" as any,
          }],
        })
      }
    }

    return groups
  }, [hasModuleAccess, isSuperAdmin, loading])

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "h-screen w-64 !bg-white border-r border-gray-200 [&_[data-sidebar=sidebar]]:!bg-white",
        state === "collapsed" && "[&_[data-sidebar=sidebar]]:flex [&_[data-sidebar=sidebar]]:flex-col [&_[data-sidebar=sidebar]]:items-center"
      )}
      style={
        state === "collapsed"
          ? ({ "--sidebar-width-icon": "5rem" } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      <SidebarHeader className={cn(
        "flex items-center shrink-0",
        state === "collapsed" ? "h-20 justify-center" : "h-16"
      )}>
        {state === "collapsed" ? (
          <div className="flex items-center justify-center w-full">
            <Logo className="w-8 h-8" width={32} height={32} />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3 w-full">
            <Logo className="size-10 shrink-0" width={40} height={40} />
            <div className="flex flex-col flex-1 text-left leading-tight">
              <span className="truncate text-xl font-bold tracking-tight text-gray-900 font-jakarta">OptiZen</span>
              <span className="truncate text-xs text-gray-500">Hospital Management</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className={cn(
        "flex-1 overflow-y-auto min-h-0",
        state === "collapsed" && "flex flex-col items-center"
      )}>
        <NavMain groups={filteredNavGroups} isLoading={loading} />
      </SidebarContent>
      <SidebarFooter className="shrink-0">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

