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

export interface SearchableSelectOption {
  value: string
  label: string
  [key: string]: any
}

/**
 * SearchableSelect component with default focus styles
 *
 * Note: This component always applies default focus styles ("focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2").
 * To override these default focus styles, users should use Tailwind's important modifier (e.g., !ring-0) or other specificity techniques
 * (custom CSS, higher-specificity selectors, or utility variants), as Tailwind class precedence is determined by the order of rules in the
 * generated CSS (not by the order in the className prop).
 */
interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  loading?: boolean
  dropdownClassName?: string
  dropdownMinWidth?: string | number
  id?: string
  name?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  className,
  loading = false,
  dropdownClassName,
  dropdownMinWidth,
  id,
  name,
}: SearchableSelectProps) {
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

  // Filter options based on search query
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

  const selectedOption = options.find((option) => option.value === value)

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("")
    setOpen(false)
  }

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
            ) : selectedOption ? (
              selectedOption.label
            ) : (
              placeholder
            )}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && !loading && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onMouseDown={(e) => {
                  e.preventDefault() // Prevent focus
                  e.stopPropagation()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClear(e as any)
                  }
                }}
                className="rounded-sm opacity-100 hover:opacity-100 hover:bg-red-50 hover:text-red-600 p-1 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Clear selection"
                title="Clear selection"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-0",
          dropdownMinWidth && !dropdownClassName && "!w-auto",
          !dropdownMinWidth && !dropdownClassName && "w-[--radix-popover-trigger-width]",
          dropdownClassName
        )}
        align="start"
        sideOffset={4}
        style={
          dropdownMinWidth && !dropdownClassName
            ? { 
                minWidth: typeof dropdownMinWidth === "number" ? `${dropdownMinWidth}px` : dropdownMinWidth,
                width: "auto",
                maxWidth: "min(90vw, 400px)"
              }
            : !dropdownMinWidth && !dropdownClassName
            ? { width: "var(--radix-popover-trigger-width)" }
            : undefined
        }
      >
        <div className="flex flex-col bg-popover text-popover-foreground rounded-md border shadow-md">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2 bg-background/50">
            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
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
                    onValueChange(searchQuery.trim())
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClear(e)
                }}
                className="h-7 px-2 text-xs ml-2 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                title="Clear selection"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Options List */}
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
                        onValueChange(searchQuery.trim())
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
                    const isSelected = value === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onValueChange(option.value === value ? "" : option.value)
                          setOpen(false)
                        }}
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
