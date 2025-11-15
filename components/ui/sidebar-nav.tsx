"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface SidebarNavCategory {
  key: string
  label: string
  title: string
  count?: number
}

export interface SidebarNavGroup {
  key: string
  label: string
  icon: LucideIcon
  description: string
  categories: SidebarNavCategory[]
}

interface SidebarNavProps {
  groups: SidebarNavGroup[]
  activeCategory: string
  onCategoryChange: (categoryKey: string) => void
  className?: string
}

export function SidebarNav({
  groups,
  activeCategory,
  onCategoryChange,
  className
}: SidebarNavProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(() => {
    // Auto-expand group containing active category
    const activeGroup = groups.find(g => 
      g.categories.some(cat => cat.key === activeCategory)
    )
    return new Set(activeGroup ? [activeGroup.key] : [])
  })

  // Auto-expand group when active category changes
  React.useEffect(() => {
    const activeGroup = groups.find(g => 
      g.categories.some(cat => cat.key === activeCategory)
    )
    if (activeGroup) {
      setExpandedGroups(prev => new Set([...prev, activeGroup.key]))
    }
  }, [activeCategory, groups])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  const getTotalItemsInGroup = (group: SidebarNavGroup) => {
    return group.categories.reduce((sum, cat) => sum + (cat.count || 0), 0)
  }

  return (
    <nav className={cn("flex flex-col h-full", className)}>
      <div className="px-4 py-6 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Categories
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => {
          const Icon = group.icon
          const isExpanded = expandedGroups.has(group.key)
          const totalItems = getTotalItemsInGroup(group)
          const hasActiveCategory = group.categories.some(cat => cat.key === activeCategory)

          return (
            <div key={group.key} className="mb-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                  "hover:bg-muted/50",
                  hasActiveCategory && "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{group.label}</span>
                  {totalItems > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                      {totalItems}
                    </Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Group Items */}
              {isExpanded && (
                <div className="py-1">
                  {group.categories.map((category) => {
                    const isActive = category.key === activeCategory

                    return (
                      <button
                        key={category.key}
                        onClick={() => onCategoryChange(category.key)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 pl-11 pr-4 py-1.5 text-sm transition-colors",
                          "hover:bg-muted/50",
                          isActive && "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                        )}
                      >
                        <span className="truncate">{category.label}</span>
                        {category.count !== undefined && category.count > 0 && (
                          <Badge 
                            variant={isActive ? "default" : "outline"} 
                            className="text-xs px-1.5 py-0"
                          >
                            {category.count}
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

