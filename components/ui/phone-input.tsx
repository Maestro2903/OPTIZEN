"use client"

import * as React from "react"
import PhoneInput, { type Country } from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
  value?: string
  onChange: (value: string | undefined) => void
  disabled?: boolean
  className?: string
  defaultCountry?: Country
  id?: string
  name?: string
}

export function PhoneNumberInput({
  value,
  onChange,
  disabled = false,
  className,
  defaultCountry = "IN",
  id,
  name,
}: PhoneInputProps) {
  return (
    <PhoneInput
      international
      defaultCountry={defaultCountry}
      value={value}
      onChange={onChange}
      disabled={disabled}
      id={id}
      name={name}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  )
}
