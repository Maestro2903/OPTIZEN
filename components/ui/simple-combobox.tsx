"use client"

import * as React from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SearchableSelectOption } from "@/components/ui/searchable-select"

interface SimpleComboboxProps {
  options: SearchableSelectOption[]
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SimpleCombobox({
  options,
  value,
  onChange,
  placeholder,
  className,
}: SimpleComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  
  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption?.label || ""
  
  React.useEffect(() => {
    if (!isTyping) {
      setInputValue(displayValue)
    }
  }, [displayValue, isTyping])

  const [debounced, setDebounced] = React.useState(inputValue)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(inputValue), 150)
    return () => clearTimeout(t)
  }, [inputValue])

  const filtered = React.useMemo(() => {
    if (!options || !Array.isArray(options)) return []
    if (!isTyping && open) return options
    const q = (debounced || "").trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, debounced, isTyping, open])

  // Check if search query matches any option
  const searchMatchesOption = React.useMemo(() => {
    if (!inputValue.trim()) return false
    const query = inputValue.toLowerCase().trim()
    return options.some((option) =>
      option.label.toLowerCase() === query || option.value.toLowerCase() === query
    )
  }, [options, inputValue])

  const [active, setActive] = React.useState(0)
  React.useEffect(() => {
    setActive(0)
  }, [debounced, open])

  const handleSelect = (opt: SearchableSelectOption) => {
    onChange(opt.value)
    setInputValue(opt.label)
    setIsTyping(false)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange("")
    setInputValue("")
    setOpen(false)
  }

  const handleManualEntry = () => {
    const customValue = inputValue.trim()
    if (customValue) {
      onChange(customValue)
      setInputValue("")
      setIsTyping(false)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && 'text-muted-foreground',
            className || 'border-gray-200 focus:border-gray-800 focus:ring-gray-200 rounded-md text-sm'
          )}
        >
          <span className="truncate">{displayValue || placeholder || "Select option"}</span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm opacity-100 hover:opacity-100 hover:bg-red-50 hover:text-red-600 p-0.5 transition-all"
                aria-label="Clear selection"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="text-gray-400">▼</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] z-[100]" align="start" sideOffset={4}>
        <div className="flex flex-col bg-popover text-popover-foreground rounded-md border shadow-md">
          <div className="p-2 border-b bg-background/50">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setIsTyping(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((p) => Math.min(p + 1, Math.max(filtered.length - 1, 0)))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((p) => Math.max(p - 1, 0))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    if (filtered[active]) {
                      handleSelect(filtered[active])
                    } else if (inputValue.trim() && !searchMatchesOption) {
                      handleManualEntry()
                    }
                  } else if (e.key === 'Escape') {
                    setOpen(false)
                  }
                }}
                className="h-8 border-gray-300 focus-visible:ring-gray-300 bg-white text-foreground flex-1"
                autoComplete="off"
                autoFocus
              />
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 px-2 text-xs shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  title="Clear selection"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto bg-white">
            {filtered.length === 0 && !inputValue.trim() ? (
              <div className="p-2 text-sm text-muted-foreground">No results</div>
            ) : (
              <div className="p-1">
                {/* Show option to add custom value if search doesn't match */}
                {inputValue.trim() && !searchMatchesOption && (
                  <button
                    type="button"
                    onClick={handleManualEntry}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm",
                      "bg-blue-50 border border-blue-200"
                    )}
                  >
                    Add &quot;{inputValue.trim()}&quot; (Press Enter)
                  </button>
                )}
                {filtered.map((opt, idx) => {
                  const isSelected = value === opt.value
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2",
                        idx === active && 'bg-gray-100',
                        isSelected && 'bg-accent/50'
                      )}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setActive(idx)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}











