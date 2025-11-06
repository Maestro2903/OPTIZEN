"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Stethoscope,
  FileText,
  CreditCard,
  Award,
  Database,
  UserCog,
  Eye,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/dashboard/patients", icon: Users },
  { name: "Cases", href: "/dashboard/cases", icon: FolderOpen },
  { name: "Operations", href: "/dashboard/operations", icon: Stethoscope },
  { name: "Discharges", href: "/dashboard/discharges", icon: FileText },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Certificates", href: "/dashboard/certificates", icon: Award },
  { name: "Master", href: "/dashboard/master", icon: Database },
  { name: "Employees", href: "/dashboard/employees", icon: UserCog },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-72 flex-col bg-white border-r border-neutral-200">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary rounded-2xl opacity-10"></div>
          <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-primary to-medical-teal">
            <Eye className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-neutral-900 tracking-tight">OpticNauts</span>
          <span className="text-xs text-neutral-500 font-medium">Ophthalmology System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-smooth",
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-smooth",
                isActive 
                  ? "bg-white/20" 
                  : "bg-neutral-100 group-hover:bg-neutral-200"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-smooth",
                  isActive ? "text-white" : "text-neutral-600 group-hover:text-neutral-900"
                )} />
              </div>
              <span className={cn(
                "transition-smooth",
                isActive ? "font-semibold" : ""
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section - User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-100 border border-neutral-200 transition-smooth hover:bg-neutral-50 cursor-pointer">
          <div className="relative">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-medical-purple flex items-center justify-center text-white font-semibold text-sm shadow-md">
              DA
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-medical-green border-2 border-white shadow-sm"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900 truncate">
              Dr. Admin
            </p>
            <p className="text-xs text-neutral-500 truncate font-medium">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

