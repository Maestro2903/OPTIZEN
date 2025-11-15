"use client"

import * as React from "react"
import { z, ZodType } from "zod"
import { useForm, type UseFormReturn, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type ViewEditDialogProps<T extends FieldValues = Record<string, unknown>> = {
  children: React.ReactNode
  title: string
  description?: string
  // Initial data to display/edit
  data?: T
  // Render the read-only view
  renderViewAction: (data?: T) => React.ReactNode
  // Optional: render editable form using provided form instance
  renderEditAction?: (form: UseFormReturn<T>) => React.ReactNode
  // Optional Zod schema to validate values when saving
  schema?: ZodType<T>
  // Called when user saves. Should persist changes.
  onSaveAction?: (values: T) => Promise<void> | void
  // Optional className override for content
  contentClassName?: string
  // If true, open dialog initially in edit mode
  defaultEdit?: boolean
}

export function ViewEditDialog<T extends FieldValues = Record<string, unknown>>({
  children,
  title,
  description,
  data,
  renderViewAction,
  renderEditAction,
  schema,
  onSaveAction,
  contentClassName,
  defaultEdit,
}: ViewEditDialogProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [isEdit, setIsEdit] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const form = useForm<T>({
    resolver: schema ? zodResolver(schema as any) : undefined,
    defaultValues: (data || {}) as any,
    mode: "onChange",
  })

  // Track previous open state to detect transitions
  const prevOpenRef = React.useRef(false)
  const resetFormRef = React.useRef(form.reset)
  
  // Keep resetFormRef up to date
  React.useEffect(() => {
    resetFormRef.current = form.reset
  })

  // Handle dialog open/close state changes
  React.useEffect(() => {
    // Dialog just opened
    if (open && !prevOpenRef.current) {
      resetFormRef.current((data || {}) as any)
      setIsEdit(!!defaultEdit)
    }
    // Dialog just closed
    if (!open && prevOpenRef.current) {
      setIsEdit(false)
    }
    prevOpenRef.current = open
  }, [open, data, defaultEdit])
  
  // Separate effect to sync data changes when dialog is already open
  React.useEffect(() => {
    if (open && prevOpenRef.current) {
      resetFormRef.current((data || {}) as any)
    }
  }, [data, open])

  const handleSave = async () => {
    if (!renderEditAction) return
    setSaving(true)
    try {
      const valid = await form.trigger()
      if (!valid) return
      const current = form.getValues()
      if (onSaveAction) await onSaveAction(current)
      setIsEdit(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={contentClassName || "max-w-4xl max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && renderViewAction(data)}
          {isEdit && renderEditAction ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
              className="space-y-4"
            >
              {renderEditAction(form)}
            </form>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            {!isEdit ? (
              <Button variant="outline" onClick={() => setIsEdit(true)}>
                Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEdit(false)} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
          <div>
            {isEdit && renderEditAction ? (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
