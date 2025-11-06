"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  Package,
  Stethoscope,
  BarChart3,
  Settings,
  Eye,
  BellRing,
  Search,
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  Plus,
  FolderOpen,
  Award,
  Database,
  UserCog,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Dr. Admin",
    email: "admin@eyecare.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "OpticNauts",
      logo: Eye,
      plan: "Ophthalmology System",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Patients",
      url: "/dashboard/patients",
      icon: Users,
    },
    {
      title: "Cases",
      url: "/dashboard/cases",
      icon: FolderOpen,
    },
    {
      title: "Operations",
      url: "/dashboard/operations",
      icon: Stethoscope,
    },
    {
      title: "Discharges",
      url: "/dashboard/discharges",
      icon: FileText,
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: "Certificates",
      url: "/dashboard/certificates",
      icon: Award,
    },
    {
      title: "Master",
      url: "/dashboard/master",
      icon: Database,
    },
    {
      title: "Employees",
      url: "/dashboard/employees",
      icon: UserCog,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

