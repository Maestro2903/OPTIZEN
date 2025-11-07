"use client"

import * as React from "react"
import { Grid, List, SortAsc, SortDesc, Filter, Download, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export interface ViewOption {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface FilterOption {
  id: string
  label: string
  count?: number
}

export interface SortOption {
  id: string
  label: string
  direction?: 'asc' | 'desc'
}

export interface ViewOptionsConfig {
  views?: ViewOption[]
  filters?: FilterOption[]
  sortOptions?: SortOption[]
  showExport?: boolean
  showSettings?: boolean
}

export interface ViewOptionsProps {
  config: ViewOptionsConfig
  currentView?: string
  appliedFilters?: string[]
  currentSort?: string
  sortDirection?: 'asc' | 'desc'
  onViewChange?: (view: string) => void
  onFilterChange?: (filters: string[]) => void
  onSortChange?: (sort: string, direction: 'asc' | 'desc') => void
  onExport?: () => void
  onSettings?: () => void
  className?: string
}

export function ViewOptions({
  config,
  currentView = "list",
  appliedFilters = [],
  currentSort,
  sortDirection = 'asc',
  onViewChange,
  onFilterChange,
  onSortChange,
  onExport,
  onSettings,
  className
}: ViewOptionsProps) {
  const handleFilterToggle = (filterId: string) => {
    if (!onFilterChange) return

    const newFilters = appliedFilters.includes(filterId)
      ? appliedFilters.filter(f => f !== filterId)
      : [...appliedFilters, filterId]

    onFilterChange(newFilters)
  }

  const handleSortSelect = (sortId: string) => {
    if (!onSortChange) return

    const newDirection = currentSort === sortId && sortDirection === 'asc' ? 'desc' : 'asc'
    onSortChange(sortId, newDirection)
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {/* View Toggle */}
      {config.views && config.views.length > 0 && (
        <div className="flex rounded-md border">
          {config.views.map((view) => (
            <Button
              key={view.id}
              variant={currentView === view.id ? "default" : "ghost"}
              size="sm"
              className="rounded-none first:rounded-l-md last:rounded-r-md"
              onClick={() => onViewChange?.(view.id)}
            >
              {view.icon || (view.id === "grid" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />)}
              <span className="ml-1 hidden sm:inline">{view.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Filter Dropdown */}
      {config.filters && config.filters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {appliedFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {appliedFilters.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {config.filters.map((filter) => (
              <DropdownMenuCheckboxItem
                key={filter.id}
                checked={appliedFilters.includes(filter.id)}
                onCheckedChange={() => handleFilterToggle(filter.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{filter.label}</span>
                  {filter.count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {filter.count}
                    </Badge>
                  )}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sort Dropdown */}
      {config.sortOptions && config.sortOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={currentSort || ""}>
              {config.sortOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.id}
                  value={option.id}
                  onClick={() => handleSortSelect(option.id)}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Export Button */}
      {config.showExport && (
        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      )}

      {/* Settings Button */}
      {config.showSettings && (
        <Button variant="outline" size="sm" onClick={onSettings} className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      )}
    </div>
  )
}