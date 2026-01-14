"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const masterDataSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  bed_number: z.string().optional(),
})

interface MasterDataFormProps {
  children: React.ReactNode
  title: string
  fieldLabel: string
  category?: string
  onSubmit?: (data: { name: string; description?: string; bed_number?: string }) => void
}

export function MasterDataForm({ children, title, fieldLabel, category, onSubmit: onSubmitCallback }: MasterDataFormProps) {
  const [open, setOpen] = React.useState(false)
  const isBedCategory = category === 'beds'

  const form = useForm<z.infer<typeof masterDataSchema>>({
    resolver: zodResolver(masterDataSchema),
    defaultValues: {
      name: "",
      description: "",
      bed_number: "",
    },
  })

  function onSubmit(values: z.infer<typeof masterDataSchema>) {
    if (onSubmitCallback) {
      onSubmitCallback({
        name: values.name,
        description: values.description,
        bed_number: isBedCategory ? values.bed_number : undefined
      })
    }
    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md" onCloseButtonClickOnly={true}>
        <DialogHeader>
          <DialogTitle>Add {title}</DialogTitle>
          <DialogDescription>
            Add new {fieldLabel.toLowerCase()} to the master data
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isBedCategory && (
              <FormField
                control={form.control}
                name="bed_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Number *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., A-101, B-202" 
                        {...field}
                        onChange={(e) => {
                          // Auto-uppercase the input
                          field.onChange(e.target.value.toUpperCase())
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">Format: Ward-Number (e.g., A-101)</p>
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fieldLabel} *</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${fieldLabel.toLowerCase()}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

