"use client"

import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface ComboboxContextValue {
  value?: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string; disabled?: boolean }>
  open: boolean
  setOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)

interface ComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  defaultValue?: string
  disabled?: boolean
  children: React.ReactNode
}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  ({ value, onValueChange, defaultValue, disabled, children }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [options, setOptions] = React.useState<
      Array<{ value: string; label: string; disabled?: boolean }>
    >([])

    // Extract options from children
    React.useEffect(() => {
      const extractedOptions: Array<{
        value: string
        label: string
        disabled?: boolean
      }> = []

      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === ComboboxContent) {
            React.Children.forEach(child.props.children, (item) => {
              if (React.isValidElement(item) && item.type === ComboboxItem) {
                extractedOptions.push({
                  value: item.props.value,
                  label: item.props.children || item.props.value,
                  disabled: item.props.disabled,
                })
              }
            })
          }
        }
      })

      setOptions(extractedOptions)
    }, [children])

    const contextValue: ComboboxContextValue = {
      value: value ?? defaultValue,
      onValueChange,
      options,
      open,
      setOpen,
      searchQuery,
      setSearchQuery,
    }

    return (
      <ComboboxContext.Provider value={contextValue}>
        <Popover open={open} onOpenChange={setOpen}>
          <div ref={ref} className="w-full">
            {children}
          </div>
        </Popover>
      </ComboboxContext.Provider>
    )
  }
)
Combobox.displayName = "Combobox"

const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> & {
    asChild?: boolean
  }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error("ComboboxTrigger must be used within Combobox")
  }

  const { value, options, open, setOpen, onValueChange } = context
  const selectedOption = options.find((opt) => opt.value === value)

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("")
    setOpen(false)
  }

  return (
    <PopoverTrigger asChild>
      <Button
        ref={ref}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          !value && "text-muted-foreground",
          className
        )}
        disabled={props.disabled}
        {...props}
      >
        {children || (
          <span className="truncate text-left flex-1">
            {selectedOption ? selectedOption.label : "Select..."}
          </span>
        )}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
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
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        </div>
      </Button>
    </PopoverTrigger>
  )
})
ComboboxTrigger.displayName = "ComboboxTrigger"

const ComboboxValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string
  }
>(({ className, placeholder, ...props }, ref) => {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error("ComboboxValue must be used within Combobox")
  }

  const { value, options } = context
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <span
      ref={ref}
      className={cn("truncate", className)}
      {...props}
    >
      {selectedOption ? selectedOption.label : placeholder}
    </span>
  )
})
ComboboxValue.displayName = "ComboboxValue"

const ComboboxContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: "popper" | "item-aligned"
  }
>(({ className, children, position = "popper", ...props }, ref) => {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error("ComboboxContent must be used within Combobox")
  }

  const {
    value,
    onValueChange,
    options,
    open,
    setOpen,
    searchQuery,
    setSearchQuery,
  } = context
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
  }, [open, setSearchQuery])

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options

    const query = searchQuery.toLowerCase().trim()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  // Check if search query matches any option
  const searchMatchesOption = React.useMemo(() => {
    if (!searchQuery.trim()) return false
    const query = searchQuery.toLowerCase().trim()
    return options.some(
      (option) =>
        option.label.toLowerCase() === query ||
        option.value.toLowerCase() === query
    )
  }, [options, searchQuery])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("")
    setOpen(false)
  }

  const handleManualEntry = () => {
    const customValue = searchQuery.trim()
    if (customValue) {
      onValueChange(customValue)
      setSearchQuery("")
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <PopoverContent
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md p-0",
        className
      )}
      align="start"
      sideOffset={4}
      {...props}
    >
      <div className="flex flex-col bg-popover text-popover-foreground rounded-md border shadow-md">
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2 bg-background/50">
          <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false)
              } else if (e.key === "Enter" && searchQuery.trim()) {
                e.preventDefault()
                // If search query doesn't match any option, add it as custom value
                if (!searchMatchesOption) {
                  handleManualEntry()
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
        <div
          className="max-h-[280px] overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="p-1">
            {filteredOptions.length === 0 && !searchQuery.trim() ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No options available.
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* Show option to add custom value if search doesn't match */}
                {searchQuery.trim() && !searchMatchesOption && (
                  <button
                    type="button"
                    onClick={handleManualEntry}
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
                        if (!option.disabled) {
                          onValueChange(option.value === value ? "" : option.value)
                          setOpen(false)
                        }
                      }}
                      disabled={option.disabled}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none",
                        "transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground",
                        isSelected && "bg-accent/50",
                        option.disabled &&
                          "pointer-events-none opacity-50 cursor-not-allowed"
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
  )
})
ComboboxContent.displayName = "ComboboxContent"

const ComboboxItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    disabled?: boolean
  }
>(({ className, children, value, disabled, ...props }, ref) => {
  // This component is used for extracting options from children
  // The actual rendering is handled by ComboboxContent
  return null
})
ComboboxItem.displayName = "ComboboxItem"

const ComboboxLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
      {...props}
    />
  )
})
ComboboxLabel.displayName = "ComboboxLabel"

const ComboboxSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  )
})
ComboboxSeparator.displayName = "ComboboxSeparator"

export {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxItem,
  ComboboxLabel,
  ComboboxSeparator,
}

