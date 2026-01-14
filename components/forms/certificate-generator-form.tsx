"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select"
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
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { patientsApi } from "@/lib/services/api"
import { Loader2, Printer, FileBadge } from "lucide-react"

const certificateSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  issued_by: z.string().min(1, "Doctor is required"),
  type: z.enum(["Fitness Certificate", "Medical Certificate", "Eye Test Certificate", "Sick Leave", "Custom"]),
  purpose: z.string().min(1, "Purpose is required"),
  content: z.string().min(10, "Certificate content must be at least 10 characters"),
  issue_date: z.string().min(1, "Issue date is required"),
  hospital_name: z.string().optional(),
  hospital_address: z.string().optional(),
  doctor_name: z.string().optional(),
  doctor_qualification: z.string().optional(),
  doctor_registration_number: z.string().optional(),
})

type CertificateFormValues = z.infer<typeof certificateSchema>

interface CertificateGeneratorProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function CertificateGeneratorForm({ children, onSuccess }: CertificateGeneratorProps) {
  const [open, setOpen] = React.useState(false)
  const [patients, setPatients] = React.useState<SearchableSelectOption[]>([])
  const [doctors, setDoctors] = React.useState<SearchableSelectOption[]>([])
  const [loadingPatients, setLoadingPatients] = React.useState(false)
  const [loadingDoctors, setLoadingDoctors] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      type: "Medical Certificate",
      purpose: "",
      content: "",
      issue_date: new Date().toISOString().split('T')[0], // Default to today's date
      hospital_name: "Sri Ramana Maharishi Eye Hospital",
      hospital_address: "51-C, Somavarakula Street, Tiruvannamalai – 606 603",
      doctor_name: "",
      doctor_qualification: "MBBS, MS (Ophthalmology)",
      doctor_registration_number: "REG/12345/2020",
    },
  })

  const certificateType = form.watch("type")
  const selectedDoctorId = form.watch("issued_by")

  // Auto-fill doctor details when doctor is selected
  React.useEffect(() => {
    if (selectedDoctorId) {
      const selectedDoctor = doctors.find(d => d.value === selectedDoctorId)
      if (selectedDoctor) {
        form.setValue("doctor_name", selectedDoctor.label)
      }
    }
  }, [selectedDoctorId, doctors, form])

  // Load patients and doctors
  React.useEffect(() => {
    const loadData = async () => {
      if (!open) return
      
      // Load patients
      setLoadingPatients(true)
      try {
        const response = await patientsApi.list({ limit: 1000 })
        if (response.success && response.data) {
          const patientOptions = response.data.map((patient) => ({
            value: patient.id,
            label: `${patient.full_name} (${patient.patient_id})`,
          }))
          setPatients(patientOptions)
        }
      } catch (error) {
        console.error("Error loading patients:", error)
      } finally {
        setLoadingPatients(false)
      }

      // Load doctors
      setLoadingDoctors(true)
      try {
        const response = await fetch("/api/employees?role=doctor&limit=100")
        const data = await response.json()
        if (data.success && data.data) {
          const doctorOptions = data.data.map((doctor: any) => ({
            value: doctor.id,
            label: doctor.full_name,
            email: doctor.email,
            phone: doctor.phone,
          }))
          setDoctors(doctorOptions)
        }
      } catch (error) {
        console.error("Error loading doctors:", error)
      } finally {
        setLoadingDoctors(false)
      }
    }
    loadData()
  }, [open])

  // Update content based on certificate type
  React.useEffect(() => {
    const selectedPatient = patients.find(p => p.value === form.getValues("patient_id"))
    const patientName = selectedPatient?.label.split(" (")[0] || "[Patient Name]"
    
    const templates = {
      "Fitness Certificate": `This is to certify that ${patientName} has been examined by me and is found to be MEDICALLY FIT for the intended purpose.

Based on my medical examination, there are no significant health concerns that would prevent the above-mentioned person from undertaking normal activities.

This certificate is valid from the date of issue unless otherwise specified.`,
      
      "Medical Certificate": `This is to certify that ${patientName} was under my medical care and treatment.

The patient has been diagnosed and treated as per standard medical protocols. This certificate is issued for medical purposes as requested.`,
      
      "Eye Test Certificate": `This is to certify that ${patientName} has undergone comprehensive eye examination.

Visual Acuity Assessment:
- Right Eye: [To be filled]
- Left Eye: [To be filled]

Color Vision: [To be filled]

Based on the examination findings, the patient is assessed for visual fitness.`,
      
      "Sick Leave": `This is to certify that ${patientName} was under my medical treatment and requires medical rest.

The patient is advised to take rest and refrain from work/duties as per medical recommendation.

This certificate is issued for the purpose of medical leave application.`,
      
      "Custom": `This is to certify that ${patientName} [add your custom content here]`
    }

    if (certificateType && !form.getValues("content")) {
      form.setValue("content", templates[certificateType] || "")
    }
  }, [certificateType, form, patients])

  const printCertificate = (certificate: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow popups to print the certificate")
      return
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      })
    }


    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${certificate.certificate_number}</title>
        <style>
          @page { size: A4; margin: 0.75in; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 0;
            padding: 20pt;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 15pt;
            margin-bottom: 30pt;
          }
          .hospital-name {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 8pt;
            color: #1a1a1a;
          }
          .hospital-address {
            font-size: 11pt;
            color: #555;
            margin-bottom: 12pt;
          }
          .cert-title {
            font-size: 18pt;
            font-weight: bold;
            margin-top: 10pt;
            text-decoration: underline;
          }
          .certificate-body {
            border: 4px double #000;
            padding: 30pt;
            margin: 30pt 0;
            min-height: 300pt;
          }
          .cert-number {
            text-align: right;
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 20pt;
          }
          .content {
            text-align: justify;
            white-space: pre-wrap;
            line-height: 1.8;
            font-size: 12pt;
          }
          .signature-section {
            margin-top: 50pt;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #000;
            padding-top: 8pt;
            margin-top: 40pt;
          }
          .doctor-name {
            font-weight: bold;
            font-size: 13pt;
          }
          .footer {
            margin-top: 40pt;
            padding-top: 15pt;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 9pt;
            color: #666;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hospital-name">${certificate.hospital_name || 'Sri Ramana Maharishi Eye Hospital'}</div>
          <div class="hospital-address">${certificate.hospital_address || '51-C, Somavarakula Street, Tiruvannamalai – 606 603'}</div>
          <div class="cert-title">${certificate.type?.toUpperCase() || 'MEDICAL CERTIFICATE'}</div>
        </div>

        <div class="certificate-body">
          <div class="cert-number">Certificate No: ${certificate.certificate_number}</div>
          <div class="cert-number">Date: ${formatDate(certificate.issue_date || certificate.date)}</div>

          <div class="content">${certificate.content || 'Certificate content not available.'}</div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div>Date: ${formatDate(certificate.issue_date || certificate.date)}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <div class="doctor-name">${certificate.doctor_name || 'Dr. [Doctor Name]'}</div>
              <div style="font-size: 10pt; margin-top: 5pt;">${certificate.doctor_qualification || 'Medical Practitioner'}</div>
              <div style="font-size: 10pt; margin-top: 5pt;">Reg. No: ${certificate.doctor_registration_number || 'REG/XXXXX'}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div><strong>Certificate Verification</strong></div>
          <div>Certificate No: ${certificate.certificate_number} | Issue Date: ${formatDate(certificate.issue_date || certificate.date)}</div>
          <div style="margin-top: 5pt;">For verification, please contact the hospital with this certificate number.</div>
        </div>

        <div class="no-print" style="margin-top: 20pt; text-align: center; padding: 20pt; background: #f0f0f0; border-radius: 5px;">
          <p style="margin-bottom: 10pt;"><strong>Print Options:</strong></p>
          <button onclick="window.print()" style="padding: 10pt 20pt; font-size: 12pt; cursor: pointer; background: #4CAF50; color: white; border: none; border-radius: 4px; margin-right: 10pt;">Print Certificate</button>
          <button onclick="window.close()" style="padding: 10pt 20pt; font-size: 12pt; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 4px;">Close</button>
        </div>

        <script>
          // Auto-print after a short delay
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  // Function to safely extract patient ID from selectedPatient object
  const getPatientId = (selectedPatient?: any): string => {
    if (!selectedPatient) {
      return "[Patient ID]";
    }

    // Try to get patient_id from the object directly (e.g., selectedPatient.patient_id, selectedPatient.id, selectedPatient.patientId)
    if (selectedPatient.patient_id) {
      return selectedPatient.patient_id;
    } else if (selectedPatient.id) {
      if (selectedPatient.id.startsWith("PAT")) {
        return selectedPatient.id;
      } else {
        // Check if the id is a UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(selectedPatient.id)) {
          return selectedPatient.id;
        }
        // If it's not a PAT id or UUID, continue to check other properties
      }
    } else if (selectedPatient.patientId) {
      return selectedPatient.patientId;
    }

    // If the value looks like a UUID, parse the patient ID from the label
    if (selectedPatient.label && typeof selectedPatient.label === "string") {
      // Try to extract patient ID from format like "Name (PAT001)"
      const match = selectedPatient.label.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If value exists and doesn't appear to be a UUID, use it as the patient ID
    if (selectedPatient.value && typeof selectedPatient.value === "string" && !selectedPatient.value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return selectedPatient.value;
    }

    // If we can't determine a proper patient ID, return the fallback
    return "[Patient ID]";
  };

  // Function to replace placeholders in content with actual values
  const replacePlaceholders = (content: string, values: CertificateFormValues, selectedPatient?: any) => {
    // Get patient name from the selected patient, with defensive checks
    let patientName = "[Patient Name]";
    if (selectedPatient && selectedPatient.label && typeof selectedPatient.label === "string") {
      if (selectedPatient.label.includes(" (")) {
        patientName = selectedPatient.label.split(" (")[0];
      } else {
        patientName = selectedPatient.label;
      }
    }

    // Replace common placeholders
    let processedContent = content
      .replace(/\[Patient Name\]/g, patientName)
      .replace(/\[Patient ID\]/g, getPatientId(selectedPatient))
      .replace(/\[Doctor Name\]/g, values.doctor_name || "[Doctor Name]")
      .replace(/\[Doctor Qualification\]/g, values.doctor_qualification || "[Doctor Qualification]")
      .replace(/\[Doctor Registration Number\]/g, values.doctor_registration_number || "[Registration Number]")
      .replace(/\[Hospital Name\]/g, values.hospital_name || "[Hospital Name]")
      .replace(/\[Hospital Address\]/g, values.hospital_address || "[Hospital Address]")
      .replace(/\[Issue Date\]/g, values.issue_date ? new Date(values.issue_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }) : new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }))
      .replace(/\[Certificate Type\]/g, values.type || "[Certificate Type]")
      .replace(/\[Purpose\]/g, values.purpose || "[Purpose]")

    // Define the whitelist of supported placeholders
    const supportedPlaceholders = [
      "Patient Name", "Patient ID", "Doctor Name", "Doctor Qualification",
      "Doctor Registration Number", "Hospital Name", "Hospital Address",
      "Issue Date", "Certificate Type", "Purpose"
    ];

    // Find any remaining placeholders and only warn for unsupported ones
    processedContent = processedContent.replace(/\[(.*?)\]/g, (match, placeholder) => {
      if (!supportedPlaceholders.includes(placeholder)) {
        // Log a warning for unrecognized placeholders but keep them visible to the user
        console.warn(`Unrecognized placeholder found: ${match}`);
        return match; // Keep the original placeholder if not recognized
      }
      // For placeholders that were already replaced, they will return their actual values
      // This handles any edge cases where a supported placeholder might remain
      return match;
    });

    return processedContent;
  }

  async function onSubmit(values: CertificateFormValues) {
    setSubmitting(true)
    try {
      // Get the selected patient to access their details
      const selectedPatient = patients.find(p => p.value === values.patient_id);

      // Process the content to replace placeholders with actual values
      const processedContent = replacePlaceholders(values.content, values, selectedPatient);

      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          content: processedContent, // Use the processed content with placeholders replaced
          issue_date: values.issue_date || new Date().toISOString().split("T")[0],
          status: "Issued",
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate certificate")
      }

      // Success! Now print the certificate
      const certificate = data.data

      // Close the form dialog
      form.reset()
      setOpen(false)

      // Open print window with the certificate
      setTimeout(() => {
        printCertificate(certificate)
      }, 300)

      // Refresh the certificate list
      onSuccess?.()
    } catch (error: any) {
      console.error("Error generating certificate:", error)
      alert(error.message || "Failed to generate certificate. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col" onCloseButtonClickOnly={true}>
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <FileBadge className="h-5 w-5" />
            Generate Medical Certificate
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Fill in the details to generate a professional medical certificate
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Form {...form}>
            <form id="certificate-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Certificate Meta-Data (Top Grid) */}
              <div className="grid grid-cols-12 gap-5">
                {/* Patient - Col-span-6 */}
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-500 uppercase">Patient *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={patients}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select patient"
                          searchPlaceholder="Search patients..."
                          loading={loadingPatients}
                          className="bg-white border-gray-200 rounded-lg focus:border-gray-800"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Doctor - Col-span-6 */}
                <FormField
                  control={form.control}
                  name="issued_by"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel className="text-xs font-bold text-gray-500 uppercase">Issued By (Doctor) *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={doctors}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select doctor"
                          searchPlaceholder="Search doctors..."
                          loading={loadingDoctors}
                          className="bg-white border-gray-200 rounded-lg focus:border-gray-800"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Certificate Type - Col-span-4 */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormLabel className="text-xs font-bold text-gray-500 uppercase">Certificate Type *</FormLabel>
                      <Combobox value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <ComboboxTrigger className="bg-white border-gray-200 rounded-lg focus:border-gray-800">
                            <ComboboxValue placeholder="Select type" />
                          </ComboboxTrigger>
                        </FormControl>
                        <ComboboxContent>
                          <ComboboxItem value="Fitness Certificate">Fitness Certificate</ComboboxItem>
                          <ComboboxItem value="Medical Certificate">Medical Certificate</ComboboxItem>
                          <ComboboxItem value="Eye Test Certificate">Eye Test Certificate</ComboboxItem>
                          <ComboboxItem value="Sick Leave">Sick Leave</ComboboxItem>
                          <ComboboxItem value="Custom">Custom</ComboboxItem>
                        </ComboboxContent>
                      </Combobox>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Purpose - Col-span-4 */}
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormLabel className="text-xs font-bold text-gray-500 uppercase">Purpose *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Employment, School, etc." 
                          className="bg-white border-gray-200 rounded-lg focus:border-gray-800"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Issue Date - Col-span-4 */}
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem className="col-span-4 flex flex-col">
                      <FormLabel className="text-xs font-bold text-gray-500 uppercase">Issue Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-white border-gray-200 rounded-lg focus:border-gray-800",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date.toISOString().split('T')[0])
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 2: The "Editor" (Certificate Content) */}
              <div>
                <FormLabel className="text-xs font-bold text-gray-500 uppercase mb-2 block">Certificate Body</FormLabel>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <FormControl>
                          <Textarea 
                            className="w-full min-h-[200px] p-6 bg-slate-50 border border-slate-300 rounded-xl font-medium text-gray-800 text-base leading-relaxed focus:bg-white focus:ring-2 focus:ring-gray-200 transition-colors resize-none"
                            placeholder="Certificate content will appear here..."
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Use [brackets] for dynamic placeholders.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section 3: Issuer Details (The 'Footer' Box) */}
              <div className="bg-gray-50 border-t border-gray-100 p-6 mt-6 -mx-6 -mb-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Hospital Info - Left */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Hospital Information</h4>
                    <FormField
                      control={form.control}
                      name="hospital_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-gray-500 uppercase">Hospital Name</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-9 text-xs bg-white border-gray-200 rounded-lg focus:border-gray-800"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hospital_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-gray-500 uppercase">Hospital Address</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-9 text-xs bg-white border-gray-200 rounded-lg focus:border-gray-800"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Doctor Credentials - Right */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Doctor Credentials</h4>
                    <FormField
                      control={form.control}
                      name="doctor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-gray-500 uppercase">Doctor Name</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-9 text-xs bg-white border-gray-200 rounded-lg focus:border-gray-800"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doctor_qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-gray-500 uppercase">Qualification</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-9 text-xs bg-white border-gray-200 rounded-lg focus:border-gray-800"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doctor_registration_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-gray-500 uppercase">Registration Number</FormLabel>
                          <FormControl>
                            <Input 
                              className="h-9 text-xs bg-white border-gray-200 rounded-lg focus:border-gray-800"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* Fixed Footer (Sticky Action Bar) */}
        <DialogFooter className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="certificate-form"
            disabled={submitting}
            className="bg-gray-900 hover:bg-black text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Generate & Print
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
