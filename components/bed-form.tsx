"use client"

import * as React from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { masterDataApi } from "@/lib/services/api"
import { useToast } from "@/hooks/use-toast"

const bedFormSchema = z.object({
  bed_number: z.string().min(1, "Bed number is required"),
  ward_name: z.string().min(1, "Ward name is required"),
  ward_type: z.enum(["general", "icu", "private", "semi_private", "emergency"]),
  bed_type: z.string().min(1, "Bed type is required"),
  floor_number: z.string().min(1, "Floor number is required"),
  room_number: z.string().optional(),
  daily_rate: z.string().min(1, "Daily rate is required"),
  description: z.string().optional(),
  facilities: z.string().optional(),
})

// Suggested daily rates based on ward type
const suggestedRates = {
  general: 1500,
  icu: 5000,
  private: 3500,
  semi_private: 2500,
  emergency: 2000,
}

interface BedFormProps {
  children: React.ReactNode
  bedData?: any
  mode?: "create" | "edit"
  onSuccess?: () => void
}

export function BedForm({ children, bedData, mode = "create", onSuccess }: BedFormProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<z.infer<typeof bedFormSchema>>({
    resolver: zodResolver(bedFormSchema),
    defaultValues: {
      bed_number: bedData?.bed_number || "",
      ward_name: bedData?.name || "",
      ward_type: bedData?.metadata?.ward_type || "general",
      bed_type: bedData?.metadata?.bed_type || "Standard",
      floor_number: bedData?.metadata?.floor_number?.toString() || "",
      room_number: bedData?.metadata?.room_number || "",
      daily_rate: bedData?.metadata?.daily_rate?.toString() || "",
      description: bedData?.description || "",
      facilities: bedData?.metadata?.facilities?.join(", ") || "",
    },
  })

  const selectedWardType = form.watch("ward_type") as keyof typeof suggestedRates

  React.useEffect(() => {
    if (mode === "create" && !form.getValues("daily_rate") && selectedWardType && suggestedRates[selectedWardType]) {
      form.setValue("daily_rate", suggestedRates[selectedWardType].toString())
    }
  }, [selectedWardType, mode, form])

  async function onSubmit(values: z.infer<typeof bedFormSchema>) {
    setIsSubmitting(true)
    try {
      // Prepare facilities array
      const facilitiesArray = values.facilities 
        ? values.facilities.split(",").map(f => f.trim()).filter(f => f.length > 0)
        : []

      // Prepare data for master_data API
      // Store bed-specific fields in metadata
      const bedPayload: any = {
        category: 'beds',
        name: values.ward_name, // Ward name is the main name
        bed_number: values.bed_number,
        description: values.description || undefined,
        is_active: true,
        sort_order: bedData?.sort_order || 1, // Provide a default sort_order
        metadata: {
          bed_type: values.bed_type,
          ward_type: values.ward_type,
          floor_number: parseInt(values.floor_number),
          room_number: values.room_number || null,
          daily_rate: parseFloat(values.daily_rate),
          facilities: facilitiesArray,
          status: mode === "create" ? "available" : (bedData?.metadata?.status || "available"),
          // Preserve any existing metadata
          ...(mode === "edit" && bedData?.metadata ? bedData.metadata : {})
        }
      }

      // Override with new values
      bedPayload.metadata.bed_type = values.bed_type
      bedPayload.metadata.ward_type = values.ward_type
      bedPayload.metadata.floor_number = parseInt(values.floor_number)
      bedPayload.metadata.room_number = values.room_number || null
      bedPayload.metadata.daily_rate = parseFloat(values.daily_rate)
      bedPayload.metadata.facilities = facilitiesArray

      const response = mode === "create" 
        ? await masterDataApi.create(bedPayload)
        : await masterDataApi.update(bedData?.id || '', bedPayload)

      if (response.success) {
        toast({
          title: "Success",
          description: mode === "create" ? "Bed added successfully" : "Bed updated successfully",
        })
        setIsOpen(false)
        form.reset()
        onSuccess?.() // Refresh the beds list
      } else {
        throw new Error(response.error || "Failed to save bed")
      }
    } catch (error) {
      console.error("Error saving bed:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save bed. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Bed" : "Add New Bed"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update bed information and settings" : "Register a new bed in the hospital system"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bed_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 101, 201A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ward_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ward type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General Ward</SelectItem>
                        <SelectItem value="icu">ICU (Intensive Care)</SelectItem>
                        <SelectItem value="private">Private Room</SelectItem>
                        <SelectItem value="semi_private">Semi-Private</SelectItem>
                        <SelectItem value="emergency">Emergency Ward</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ward_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ward Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., General Ward A, ICU Block 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="floor_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor Number *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1, 2, 3..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="room_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input placeholder="A, 101, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bed_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Deluxe">Deluxe</SelectItem>
                        <SelectItem value="ICU">ICU Bed</SelectItem>
                        <SelectItem value="Electric">Electric</SelectItem>
                        <SelectItem value="Pediatric">Pediatric</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border bg-blue-50/50 p-4">
              <FormField
                control={form.control}
                name="daily_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Daily Rate (₹) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="1500" 
                        {...field}
                        className="text-lg font-semibold"
                      />
                    </FormControl>
                    <FormMessage />
                    {selectedWardType && suggestedRates[selectedWardType] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Suggested rate for {selectedWardType.replace("_", " ")}: ₹{suggestedRates[selectedWardType].toLocaleString()}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="facilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facilities</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AC, TV, Attached Bathroom (comma-separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Enter facilities separated by commas</p>
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
                    <Textarea placeholder="Additional information about this bed..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (mode === "edit" ? "Update Bed" : "Add Bed")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

