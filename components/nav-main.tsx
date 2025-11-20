"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  groups,
  isLoading = false,
}: {
  groups: {
    header: string
    items: {
      title: string
      url: string
      icon?: LucideIcon
      isActive?: boolean
      badge?: string
      disabled?: boolean
    }[]
  }[]
  isLoading?: boolean
}) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.header} className={cn(
          isCollapsed && "w-full flex flex-col items-center p-0"
        )}>
          {/* Hide group labels when collapsed */}
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[11px] font-bold text-gray-400 uppercase px-4 py-2 mt-4">
              {group.header}
            </SidebarGroupLabel>
          )}
          <SidebarMenu className={cn(
            isCollapsed && "w-full flex flex-col items-center gap-4"
          )}>
            {group.items.map((item) => {
              const isActive = pathname === item.url || pathname?.startsWith(`${item.url}/`)
              
              // Collapsed state layout
              if (isCollapsed) {
                return (
                  <SidebarMenuItem key={item.title} className="relative group/tooltip">
                    <SidebarMenuButton 
                      asChild={!isLoading && !item.disabled} 
                      isActive={isActive}
                      disabled={isLoading || item.disabled}
                      className={cn(
                        "flex items-center justify-center",
                        "w-12 h-12 rounded-xl",
                        "transition-all duration-200",
                        // Inactive state
                        !isActive && "text-gray-400 hover:text-gray-900 hover:bg-gray-100",
                        // Active state - Centered Squircle background
                        isActive && "bg-indigo-50 text-indigo-600",
                        // Disabled state
                        (isLoading || item.disabled) && "opacity-50"
                      )}
                    >
                      {isLoading || item.disabled ? (
                        <div className="flex items-center justify-center" aria-busy="true" aria-label="loading">
                          {item.icon && (
                            <item.icon className={cn(
                              "w-6 h-6 shrink-0",
                              !isActive && "text-gray-400",
                              isActive && "text-indigo-600"
                            )} />
                          )}
                        </div>
                      ) : (
                        <Link href={item.url} className="flex items-center justify-center w-full h-full">
                          {item.icon && (
                            <item.icon className={cn(
                              "w-6 h-6 shrink-0",
                              !isActive && "text-gray-400",
                              isActive && "text-indigo-600"
                            )} />
                          )}
                        </Link>
                      )}
                    </SidebarMenuButton>
                    {/* Custom tooltip for collapsed state */}
                    <div className={cn(
                      "absolute left-full ml-2 top-1/2 -translate-y-1/2",
                      "bg-gray-900 text-white text-xs font-medium",
                      "rounded-md px-2 py-1",
                      "z-50 whitespace-nowrap",
                      "opacity-0 pointer-events-none",
                      "group-hover/tooltip:opacity-100",
                      "transition-opacity duration-200",
                      (isLoading || item.disabled) && "hidden"
                    )}>
                      {item.title}
                    </div>
                  </SidebarMenuItem>
                )
              }
              
              // Expanded state layout (existing)
              return (
                <SidebarMenuItem key={item.title} className="relative">
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r" />
                  )}
                  <SidebarMenuButton 
                    tooltip={item.title} 
                    asChild={!isLoading && !item.disabled} 
                    isActive={isActive}
                    disabled={isLoading || item.disabled}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 mx-3 rounded-lg text-sm font-medium",
                      "transition-all duration-200",
                      // Inactive state
                      !isActive && "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      // Active state
                      isActive && "bg-indigo-50 text-indigo-600",
                      // Disabled state
                      (isLoading || item.disabled) && "opacity-50"
                    )}
                  >
                    {isLoading || item.disabled ? (
                      <div className="flex items-center w-full" aria-busy="true" aria-label="loading">
                        {item.icon && (
                          <item.icon className={cn(
                            "w-5 h-5 shrink-0",
                            !isActive && "text-gray-400",
                            isActive && "text-indigo-600"
                          )} />
                        )}
                        <span>{item.title}</span>
                        {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                      </div>
                    ) : (
                      <Link href={item.url} className="flex items-center w-full">
                        {item.icon && (
                          <item.icon className={cn(
                            "w-5 h-5 shrink-0",
                            !isActive && "text-gray-400",
                            isActive && "text-indigo-600"
                          )} />
                        )}
                        <span>{item.title}</span>
                        {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

