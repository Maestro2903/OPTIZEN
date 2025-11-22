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
  floor_number: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true; // Optional
    const num = Number(val);
    return !isNaN(num) && num >= 1;
  }, { message: "Floor number must be at least 1" }),
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
      floor_number: bedData?.metadata?.floor_number ? bedData.metadata.floor_number.toString() : "",
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
          floor_number: values.floor_number ? Number(values.floor_number) : null,
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
      bedPayload.metadata.floor_number = values.floor_number || null
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{mode === "edit" ? "Edit Bed" : "Add New Bed"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update bed information and settings" : "Register a new bed in the hospital system"}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="bed-form">
              <div className="grid grid-cols-2 gap-5">
                {/* Section 1: Bed Identity */}
                {/* Bed Number */}
                <FormField
                  control={form.control}
                  name="bed_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Bed Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 101, 201A" 
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bed Type */}
                <FormField
                  control={form.control}
                  name="bed_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Bed Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11">
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

                {/* Section 2: Location Hierarchy (Grouped) */}
                {/* Ward Type */}
                <FormField
                  control={form.control}
                  name="ward_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ward Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11">
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

                {/* Ward Name */}
                <FormField
                  control={form.control}
                  name="ward_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Ward Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., General Ward A, ICU Block 1" 
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Floor Number */}
                <FormField
                  control={form.control}
                  name="floor_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Floor Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1, 2, 3..."
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Room Number */}
                <FormField
                  control={form.control}
                  name="room_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Room Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="A, 101, etc." 
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Section 3: Financials & Specs (Grey Box) */}
                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  {/* Daily Rate */}
                  <FormField
                    control={form.control}
                    name="daily_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Daily Rate *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="1500"
                              className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg h-11 pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {selectedWardType && suggestedRates[selectedWardType] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Suggested: ₹{suggestedRates[selectedWardType].toLocaleString()}
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Facilities - Tag Builder Style */}
                  <FormField
                    control={form.control}
                    name="facilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Facilities</FormLabel>
                        <FormControl>
                          <div className="bg-white border border-gray-200 rounded-lg p-2 min-h-[44px]">
                            <Input 
                              placeholder="AC, TV, Oxygen" 
                              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          Separate by comma (e.g., AC, TV, Oxygen)
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs font-bold text-gray-700 uppercase tracking-wide">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional information about this bed..." 
                          rows={3} 
                          className="bg-white border-gray-200 focus:border-gray-600 text-sm rounded-lg"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setIsOpen(false)} 
            disabled={isSubmitting}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="bed-form"
            disabled={isSubmitting}
            className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            {isSubmitting ? "Saving..." : (mode === "edit" ? "Update Bed" : "Add Bed")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

