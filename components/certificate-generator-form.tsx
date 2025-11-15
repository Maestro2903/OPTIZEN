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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { patientsApi } from "@/lib/services/api"
import { Loader2, FileText } from "lucide-react"

const certificateSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  issued_by: z.string().min(1, "Doctor is required"),
  type: z.enum(["Fitness Certificate", "Medical Certificate", "Eye Test Certificate", "Sick Leave", "Custom"]),
  purpose: z.string().min(1, "Purpose is required"),
  content: z.string().min(10, "Certificate content must be at least 10 characters"),
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
      hospital_name: "EyeCare Medical Center",
      hospital_address: "123 Medical Plaza, Healthcare District",
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
          <div class="hospital-name">${certificate.hospital_name || 'EyeCare Medical Center'}</div>
          <div class="hospital-address">${certificate.hospital_address || '123 Medical Plaza, Healthcare District'}</div>
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

  async function onSubmit(values: CertificateFormValues) {
    setSubmitting(true)
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          issue_date: new Date().toISOString().split("T")[0],
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Medical Certificate
          </DialogTitle>
          <DialogDescription>
            Fill in the details to generate a professional medical certificate
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Patient Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={patients}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select patient"
                        searchPlaceholder="Search patients..."
                        loading={loadingPatients}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Doctor Selection */}
              <FormField
                control={form.control}
                name="issued_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issued By (Doctor) *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={doctors}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select doctor"
                        searchPlaceholder="Search doctors..."
                        loading={loadingDoctors}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Certificate Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fitness Certificate">Fitness Certificate</SelectItem>
                        <SelectItem value="Medical Certificate">Medical Certificate</SelectItem>
                        <SelectItem value="Eye Test Certificate">Eye Test Certificate</SelectItem>
                        <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Purpose */}
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Employment, School, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Certificate Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Content *</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={8} 
                      placeholder="Certificate content will appear here..."
                      className="font-mono text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hospital Details */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Hospital & Doctor Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hospital_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Hospital Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="doctor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Certificate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
