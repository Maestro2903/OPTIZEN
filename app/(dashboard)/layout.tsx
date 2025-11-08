"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/layout/header"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Toaster } from "@/components/ui/toaster"
import { MasterDataProvider } from "@/contexts/master-data-context"
import { usePathname } from "next/navigation"

// Map of paths to page names
const pathToPageName: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/patients": "Patients",
  "/dashboard/cases": "Cases",
  "/dashboard/billing": "Billing & Invoices",
  "/dashboard/documents": "Documents",
  "/dashboard/certificates": "Certificates",
  "/dashboard/appointments": "Appointments",
  "/dashboard/pharmacy": "Pharmacy",
  "/dashboard/attendance": "Staff Attendance",
  "/dashboard/revenue": "Revenue",
  "/dashboard/beds": "Bed Management",
  "/dashboard/operations": "Operations",
  "/dashboard/settings": "Settings",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const currentPageName = pathToPageName[pathname] || "Overview"

  return (
    <MasterDataProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPageName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </MasterDataProvider>
  )
}

