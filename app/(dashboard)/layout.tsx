"use client"

import { AppSidebar } from "@/components/shared/app-sidebar"
import { Header } from "@/components/layout/header"
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { UserProvider } from "@/contexts/user-context"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Map of paths to page names
const pathToPageName: Record<string, string> = {
  "/": "Overview",
  "/patients": "Patients",
  "/cases": "Cases",
  "/medical-records": "Medical Records",
  "/old-patient-records": "Old Patient Records",
  "/out-patient-records": "Out Patient Records",
  "/vision": "Vision Records",
  "/diagnosis-tests": "Diagnosis & Tests",
  "/treatments-medications": "Treatments & Medications",
  "/blood-advice": "Blood & Advice",
  "/billing": "Billing & Invoices",
  "/billing/consultation-operation": "Consultation & Operation Billing",
  "/billing/medical": "Medical Billing",
  "/billing/optical": "Optical Billing",
  "/documents": "Documents",
  "/certificates": "Certificates",
  "/appointments": "Appointments",
  "/bookings": "Bookings",
  "/pharmacy": "Pharmacy",
  "/attendance": "Staff Attendance",
  "/revenue": "Revenue",
  "/beds": "Bed Management",
  "/operations": "Operations",
  "/settings": "Settings",
  "/master": "Master Data",
  "/employees": "Employees",
  "/discharges": "Discharges",
  "/finance": "Finance",
  "/doctor-schedule": "My Schedule",
  "/access-control": "Access Control",
  "/optical-plan": "Optical Plan",
}

function HeaderContent() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className={cn(
          "-ml-1 transition-all duration-300",
          isCollapsed && "ml-[20px]"
        )} />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const currentPageName = pathToPageName[pathname] || "Overview"
  const isDashboardRoot = pathname === "/"

  return (
    <UserProvider>
      <SidebarProvider>
        <LayoutContent 
          currentPageName={currentPageName} 
          isDashboardRoot={isDashboardRoot}
          pathname={pathname}
          router={router}
        >
          {children}
        </LayoutContent>
      </SidebarProvider>
      <Toaster />
    </UserProvider>
  )
}

function LayoutContent({
  children,
  currentPageName,
  isDashboardRoot,
  pathname,
  router,
}: {
  children: React.ReactNode
  currentPageName: string
  isDashboardRoot: boolean
  pathname: string
  router: ReturnType<typeof useRouter>
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <>
      <AppSidebar />
      <SidebarInset className="bg-slate-50">
        <HeaderContent />
        <div className={cn(
          "flex flex-1 flex-col pt-6 pr-6 pb-6",
          isCollapsed ? "pl-[20px]" : "pl-6"
        )}>
          {/* Page Header with Breadcrumbs */}
          <div className="mb-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              {/* Optional Back Button */}
              {!isDashboardRoot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 mr-1"
                  onClick={() => router.back()}
                  title="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Go back</span>
                </Button>
              )}
              
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Dashboard
              </Link>
              
              {!isDashboardRoot && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <span className="text-gray-900 font-semibold">
                    {currentPageName}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Page Content */}
          <div className="flex flex-1 flex-col gap-4">
            {children}
          </div>
        </div>
      </SidebarInset>
    </>
  )
}

