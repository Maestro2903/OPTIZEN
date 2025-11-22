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

  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value]
  )

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase().trim()
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
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
          <div className="flex items-center gap-1 ml-2">
            {value.length > 0 && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm opacity-70 hover:opacity-100 hover:bg-accent p-0.5 transition-opacity"
                aria-label="Clear all selections"
              >
                <X className="h-3.5 w-3.5" />
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
                onClick={handleClear}
                className="h-7 px-2 text-xs ml-2 shrink-0"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Options List - matches SearchableSelect */}
          <ScrollArea className="h-auto max-h-[280px]">
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <div className="space-y-0.5">
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
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
