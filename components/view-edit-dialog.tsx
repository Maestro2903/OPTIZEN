"use client"

import * as React from "react"
import { z, ZodType } from "zod"
import { useForm, type UseFormReturn } from "react-hook-form"
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

export type ViewEditDialogProps = {
  children: React.ReactNode
  title: string
  description?: string
  // Initial data to display/edit
  data?: Record<string, any>
  // Render the read-only view
  renderViewAction: (data?: Record<string, any>) => React.ReactNode
  // Optional: render editable form using provided form instance
  renderEditAction?: (form: UseFormReturn<any>) => React.ReactNode
  // Optional Zod schema to validate values when saving
  schema?: ZodType<any>
  // Called when user saves. Should persist changes.
  onSaveAction?: (values: Record<string, any>) => Promise<void> | void
  // Optional className override for content
  contentClassName?: string
  // If true, open dialog initially in edit mode
  defaultEdit?: boolean
}

export function ViewEditDialog({
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
}: ViewEditDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isEdit, setIsEdit] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const form = useForm<any>({
    resolver: schema ? zodResolver(schema as any) : undefined,
    defaultValues: data || {},
    mode: "onChange",
  })

  React.useEffect(() => {
    // Reset form when dialog opens with new data
    if (open) {
      form.reset(data || {})
      setIsEdit(!!defaultEdit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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
