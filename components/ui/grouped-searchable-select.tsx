"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface GroupedOption {
  id: string | null
  name: string
  description?: string
  children: Array<{
    id: string
    name: string
    description?: string
  }>
}

export interface GroupedSearchableSelectOption {
  categoryId: string | null
  categoryName: string
  complaintId: string
  complaintName: string
  description?: string
}

interface GroupedSearchableSelectProps {
  groups: GroupedOption[]
  value?: string // complaintId
  onValueChange: (complaintId: string, categoryId: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  loading?: boolean
  id?: string
  name?: string
}

export function GroupedSearchableSelect({
  groups,
  value,
  onValueChange,
  placeholder = "Select a complaint...",
  searchPlaceholder = "Search complaints...",
  emptyText = "No complaints found.",
  disabled = false,
  className,
  loading = false,
  id,
  name,
}: GroupedSearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when popover opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    } else {
      setSearchQuery("")
    }
  }, [open])

  // Flatten groups to create searchable options
  const flattenedOptions = React.useMemo(() => {
    const options: GroupedSearchableSelectOption[] = []
    groups.forEach((group) => {
      group.children.forEach((child) => {
        options.push({
          categoryId: group.id,
          categoryName: group.name,
          complaintId: child.id,
          complaintName: child.name,
          description: child.description,
        })
      })
    })
    return options
  }, [groups])

  // Find selected option
  const selectedOption = flattenedOptions.find((opt) => opt.complaintId === value)

  // Check if search query matches any complaint
  const searchMatchesOption = React.useMemo(() => {
    if (!searchQuery.trim()) return false
    const query = searchQuery.toLowerCase().trim()
    return flattenedOptions.some(
      (option) =>
        option.complaintName.toLowerCase() === query ||
        option.complaintId.toLowerCase() === query
    )
  }, [flattenedOptions, searchQuery])

  // Filter groups based on search query
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groups

    const query = searchQuery.toLowerCase().trim()
    return groups
      .map((group) => {
        // Filter children that match search
        const matchingChildren = group.children.filter(
          (child) =>
            child.name.toLowerCase().includes(query) ||
            child.description?.toLowerCase().includes(query) ||
            group.name.toLowerCase().includes(query)
        )

        // Include group if it has matching children or if group name matches
        if (matchingChildren.length > 0 || group.name.toLowerCase().includes(query)) {
          return {
            ...group,
            children: matchingChildren.length > 0 
              ? matchingChildren 
              : group.children, // Show all children if category matches
          }
        }
        return null
      })
      .filter((group): group is GroupedOption => group !== null)
  }, [groups, searchQuery])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("", null)
    setOpen(false)
  }

  const handleSelect = (complaintId: string, categoryId: string | null) => {
    onValueChange(complaintId === value ? "" : complaintId, categoryId)
    setOpen(false)
  }

  // Display text for selected value - show just the complaint name
  const displayText = selectedOption
    ? selectedOption.complaintName
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10 px-3 py-2 text-sm font-normal",
            "border border-input bg-background",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled || loading}
        >
          <span className="truncate text-left flex-1">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </span>
            ) : (
              displayText
            )}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {value && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm opacity-70 hover:opacity-100 hover:bg-accent p-0.5 transition-opacity"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col bg-popover text-popover-foreground rounded-md border shadow-md">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2 bg-background/50">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                } else if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault()
                  // If search query doesn't match any option, add it as custom value
                  if (!searchMatchesOption) {
                    onValueChange(searchQuery.trim(), null)
                    setSearchQuery("")
                    setOpen(false)
                  }
                }
              }}
              className="h-8 border-0 bg-transparent px-0 py-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 px-2 text-xs ml-2 shrink-0"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[280px] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-1">
              {!loading && filteredGroups.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading complaints...
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Show option to add custom value if search doesn't match */}
                  {searchQuery.trim() && !searchMatchesOption && (
                    <button
                      type="button"
                      onClick={() => {
                        onValueChange(searchQuery.trim(), null)
                        setSearchQuery("")
                        setOpen(false)
                      }}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none",
                        "transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground",
                        "bg-blue-50 border border-blue-200"
                      )}
                    >
                      <span className="flex-1 text-left whitespace-normal break-words">
                        Add &quot;{searchQuery.trim()}&quot; (Press Enter)
                      </span>
                    </button>
                  )}
                  {filteredGroups.map((group) => (
                    <div key={group.id ?? 'other'} className="space-y-0.5">
                      {/* Category Header */}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-popover/95 backdrop-blur-sm z-10">
                        {group.name}
                      </div>
                      {/* Category Children */}
                      {group.children.length > 0 ? (
                        group.children.map((child) => {
                          const isSelected = value === child.id
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => handleSelect(child.id, group.id)}
                              className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-6 py-2 text-sm outline-none",
                                "transition-colors",
                                "hover:bg-accent hover:text-accent-foreground",
                                "focus:bg-accent focus:text-accent-foreground",
                                isSelected && "bg-accent/50"
                              )}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="flex-1 truncate text-left">
                                {child.name}
                              </span>
                              {child.description && (
                                <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">
                                  {child.description}
                                </span>
                              )}
                            </button>
                          )
                        })
                      ) : (
                        <div className="px-6 py-2 text-xs text-muted-foreground">
                          No complaints in this category
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

