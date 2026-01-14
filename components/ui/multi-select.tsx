"use client"

import * as React from "react"
import { X, Check, ChevronsUpDown, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  maxDisplay?: number
  id?: string
  name?: string
  searchInputSize?: "default" | "large"
}

export function MultiSelect({
  options = [],
  value = [],
  onValueChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyText = "No items found.",
  className,
  disabled = false,
  loading = false,
  maxDisplay = 3,
  id,
  name,
  searchInputSize = "default",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOptions = React.useMemo(() => {
    // Get options that match selected values
    const matchedOptions = options.filter((option) => value.includes(option.value))
    // Get custom values (values not in options)
    const customValues = value.filter((v) => !options.some((opt) => opt.value === v))
    // Combine matched options with custom values as options
    return [
      ...matchedOptions,
      ...customValues.map((v) => ({ value: v, label: v }))
    ]
  }, [options, value])

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase().trim()
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // Check if search query matches any option
  const searchMatchesOption = React.useMemo(() => {
    if (!searchQuery.trim()) return false
    const query = searchQuery.toLowerCase().trim()
    return options.some((option) =>
      option.label.toLowerCase() === query || option.value.toLowerCase() === query
    )
  }, [options, searchQuery])

  const handleSelect = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    
    onValueChange?.(newValue)
  }

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newValue = value.filter((v) => v !== optionValue)
    onValueChange?.(newValue)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onValueChange?.([])
  }

  // Reset search when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("")
    }
  }, [open])

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
            "w-full justify-between h-auto min-h-[40px] px-3 py-2 text-sm font-normal",
            "border border-input bg-background",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value.length && "text-muted-foreground",
            className
          )}
          disabled={disabled || loading}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </span>
            ) : value.length === 0 ? (
              <span className="text-sm">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxDisplay).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="mr-1 mb-1"
                  >
                    {option.label}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  </Badge>
                ))}
                {value.length > maxDisplay && (
                  <Badge variant="secondary" className="mr-1 mb-1">
                    +{value.length - maxDisplay} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value.length > 0 && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm opacity-100 hover:opacity-100 hover:bg-red-50 hover:text-red-600 p-1 transition-all"
                aria-label="Clear all selections"
                title="Clear all selections"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-0",
          "w-[--radix-popover-trigger-width]"
        )}
        align="start" 
        sideOffset={4}
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <div className="flex flex-col bg-popover text-popover-foreground rounded-md border shadow-md">
          {/* Search Input - matches SearchableSelect */}
          <div className={`flex items-center border-b bg-background/50 ${searchInputSize === "large" ? "px-4 py-3" : "px-3 py-2"}`}>
            <Search className={`mr-2 shrink-0 opacity-50 ${searchInputSize === "large" ? "h-5 w-5" : "h-4 w-4"}`} />
            <Input
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
                    const customValue = searchQuery.trim()
                    // Check if custom value already exists in selected values
                    if (!value.includes(customValue)) {
                      onValueChange?.([...value, customValue])
                    }
                    setSearchQuery("")
                    setOpen(false)
                  }
                }
              }}
              className={cn(
                "border-0 bg-transparent px-0 py-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                searchInputSize === "large" ? "h-12 text-lg" : "h-8 text-sm"
              )}
              autoComplete="off"
              autoFocus
            />
            {value.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClear(e)
                }}
                className="h-7 px-2 text-xs ml-2 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                title="Clear all selections"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Options List - matches SearchableSelect */}
          <div className="max-h-[280px] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-1">
              {filteredOptions.length === 0 && !searchQuery.trim() ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {/* Show option to add custom value if search doesn't match */}
                  {searchQuery.trim() && !searchMatchesOption && (
                    <button
                      type="button"
                      onClick={() => {
                        const customValue = searchQuery.trim()
                        if (!value.includes(customValue)) {
                          onValueChange?.([...value, customValue])
                        }
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
                  {filteredOptions.map((option) => {
                    const isSelected = value.includes(option.value)
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none",
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
                        <span className="flex-1 text-left whitespace-normal break-words">
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
