"use client"

import * as React from "react"
import { PrintLayout, PrintSection, PrintRow, PrintCol, PrintField, PrintSignature } from "./print-layout"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface CertificatePrintProps {
  certificate: {
    id: string
    date: string
    patient_name: string
    type: string
    purpose?: string
    status: string
    exam_date?: string
    findings?: string
    diagnosis?: string
    treatment_period?: string
    recommendations?: string
    visual_acuity_right?: string
    visual_acuity_left?: string
    color_vision?: string
    driving_fitness?: string
    illness?: string
    leave_from?: string
    leave_to?: string
    title?: string
    content?: string
  }
  children: React.ReactNode
}

export function CertificatePrint({ certificate, children }: CertificatePrintProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const renderCertificateBody = () => {
    switch (certificate.type) {
      case 'Fitness Certificate':
        return (
          <div className="print-certificate">
            <h2 style={{ textAlign: 'center', marginBottom: '20pt', fontSize: '18pt' }}>
              MEDICAL FITNESS CERTIFICATE
            </h2>
            <div className="print-certificate-body">
              <p>This is to certify that <strong>{certificate.patient_name}</strong> has been examined by me on <strong>{certificate.exam_date || certificate.date}</strong>.</p>

              <div style={{ margin: '15pt 0' }}>
                <strong>Examination Findings:</strong>
                <div style={{ marginTop: '5pt', padding: '8pt', border: '1px solid #ccc' }}>
                  {certificate.findings || 'No significant abnormalities detected.'}
                </div>
              </div>

              <p>Based on my medical examination, I certify that the above-mentioned person is <strong>MEDICALLY FIT</strong> for {certificate.purpose || 'the intended purpose'}.</p>

              <p>This certificate is valid from the date of issue unless otherwise specified.</p>
            </div>
          </div>
        )

      case 'Medical Certificate':
        return (
          <div className="print-certificate">
            <h2 style={{ textAlign: 'center', marginBottom: '20pt', fontSize: '18pt' }}>
              MEDICAL CERTIFICATE
            </h2>
            <div className="print-certificate-body">
              <p>This is to certify that <strong>{certificate.patient_name}</strong> was under my medical care and treatment.</p>

              <div style={{ margin: '15pt 0' }}>
                <strong>Diagnosis:</strong>
                <div style={{ marginTop: '5pt', padding: '8pt', border: '1px solid #ccc' }}>
                  {certificate.diagnosis || 'As per medical examination'}
                </div>
              </div>

              {certificate.treatment_period && (
                <p>Treatment Period: <strong>{certificate.treatment_period}</strong></p>
              )}

              {certificate.recommendations && (
                <div style={{ margin: '15pt 0' }}>
                  <strong>Recommendations:</strong>
                  <div style={{ marginTop: '5pt', padding: '8pt', border: '1px solid #ccc' }}>
                    {certificate.recommendations}
                  </div>
                </div>
              )}

              <p>This certificate is issued for {certificate.purpose || 'medical purposes'} as requested.</p>
            </div>
          </div>
        )

      case 'Eye Test':
        return (
          <div className="print-certificate">
            <h2 style={{ textAlign: 'center', marginBottom: '20pt', fontSize: '18pt' }}>
              EYE EXAMINATION CERTIFICATE
            </h2>
            <div className="print-certificate-body">
              <p>This is to certify that <strong>{certificate.patient_name}</strong> has undergone comprehensive eye examination on <strong>{certificate.exam_date || certificate.date}</strong>.</p>

              <div style={{ margin: '15pt 0' }}>
                <strong>Visual Acuity Assessment:</strong>
                <div style={{ display: 'flex', marginTop: '10pt' }}>
                  <div className="print-vision-box">
                    <strong>Right Eye</strong><br />
                    {certificate.visual_acuity_right || '6/6'}
                  </div>
                  <div className="print-vision-box">
                    <strong>Left Eye</strong><br />
                    {certificate.visual_acuity_left || '6/6'}
                  </div>
                </div>
              </div>

              {certificate.color_vision && (
                <p><strong>Color Vision:</strong> {certificate.color_vision}</p>
              )}

              {certificate.driving_fitness && (
                <div style={{ margin: '15pt 0' }}>
                  <strong>Driving Fitness:</strong>
                  <div style={{ marginTop: '5pt', padding: '8pt', border: '1px solid #ccc' }}>
                    {certificate.driving_fitness}
                  </div>
                </div>
              )}

              <p>This certificate is issued for {certificate.purpose || 'driving license and related purposes'}.</p>
            </div>
          </div>
        )

      case 'Sick Leave':
        return (
          <div className="print-certificate">
            <h2 style={{ textAlign: 'center', marginBottom: '20pt', fontSize: '18pt' }}>
              MEDICAL LEAVE CERTIFICATE
            </h2>
            <div className="print-certificate-body">
              <p>This is to certify that <strong>{certificate.patient_name}</strong> was under my medical treatment for the following condition:</p>

              <div style={{ margin: '15pt 0' }}>
                <strong>Medical Condition:</strong>
                <div style={{ marginTop: '5pt', padding: '8pt', border: '1px solid #ccc' }}>
                  {certificate.illness || 'Medical condition as diagnosed'}
                </div>
              </div>

              <p>The patient is advised medical rest from <strong>{certificate.leave_from ? formatDate(certificate.leave_from) : 'date of consultation'}</strong> to <strong>{certificate.leave_to ? formatDate(certificate.leave_to) : 'as per medical advice'}</strong>.</p>

              {certificate.recommendations && (
                <div style={{ margin: '15pt 0' }}>
                  <strong>Medical Recommendations:</strong>
                  <div style={{ marginTop: '5pt', padding: '8pt', border: '1px solid #ccc' }}>
                    {certificate.recommendations}
                  </div>
                </div>
              )}

              <p>This certificate is issued for the purpose of {certificate.purpose || 'medical leave application'}.</p>
            </div>
          </div>
        )

      case 'Custom':
        return (
          <div className="print-certificate">
            <h2 style={{ textAlign: 'center', marginBottom: '20pt', fontSize: '18pt' }}>
              {certificate.title?.toUpperCase() || 'MEDICAL CERTIFICATE'}
            </h2>
            <div className="print-certificate-body">
              <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                {certificate.content || 'Custom certificate content'}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="print-certificate">
            <h2 style={{ textAlign: 'center', marginBottom: '20pt', fontSize: '18pt' }}>
              MEDICAL CERTIFICATE
            </h2>
            <div className="print-certificate-body">
              <p>This is to certify that <strong>{certificate.patient_name}</strong> has been examined and treated by me.</p>
              <p>This certificate is issued for {certificate.purpose || 'medical purposes'} as requested.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PrintLayout
          documentType="Medical Certificate"
          documentTitle={`Certificate No: ${certificate.id}`}
          isDraft={certificate.status === 'Draft'}
        >
          {/* Certificate Details */}
          <PrintSection title="Certificate Information">
            <PrintRow>
              <PrintCol>
                <PrintField label="Certificate No." value={certificate.id} uppercase />
                <PrintField label="Issue Date" value={formatDate(certificate.date)} />
              </PrintCol>
              <PrintCol>
                <PrintField label="Certificate Type" value={certificate.type} />
                <PrintField label="Status" value={certificate.status} uppercase />
              </PrintCol>
            </PrintRow>
            <PrintRow>
              <PrintCol>
                <PrintField label="Patient Name" value={certificate.patient_name} uppercase />
              </PrintCol>
              <PrintCol>
                <PrintField label="Purpose" value={certificate.purpose} />
              </PrintCol>
            </PrintRow>
          </PrintSection>

          {/* Certificate Body */}
          {renderCertificateBody()}

          {/* Doctor Signature */}
          <PrintSignature date={formatDate(certificate.date)} />
        </PrintLayout>
      </DialogContent>
    </Dialog>
  )
}

// Quick print function for certificates
export function QuickCertificatePrint({ certificate }: { certificate: any }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-GB')
    }

    let certificateBody = ''
    switch (certificate.type) {
      case 'Fitness Certificate':
        certificateBody = `
          <div class="certificate">
            <h2>MEDICAL FITNESS CERTIFICATE</h2>
            <div class="certificate-body">
              <p>This is to certify that <strong>${certificate.patient_name}</strong> has been examined by me on <strong>${certificate.exam_date || certificate.date}</strong>.</p>
              <div class="findings-box">
                <strong>Examination Findings:</strong><br>
                ${certificate.findings || 'No significant abnormalities detected.'}
              </div>
              <p>Based on my medical examination, I certify that the above-mentioned person is <strong>MEDICALLY FIT</strong> for ${certificate.purpose || 'the intended purpose'}.</p>
            </div>
          </div>
        `
        break
      case 'Eye Test':
        certificateBody = `
          <div class="certificate">
            <h2>EYE EXAMINATION CERTIFICATE</h2>
            <div class="certificate-body">
              <p>This is to certify that <strong>${certificate.patient_name}</strong> has undergone comprehensive eye examination on <strong>${certificate.exam_date || certificate.date}</strong>.</p>
              <div class="vision-results">
                <div class="vision-box">
                  <strong>Right Eye:</strong> ${certificate.visual_acuity_right || '6/6'}
                </div>
                <div class="vision-box">
                  <strong>Left Eye:</strong> ${certificate.visual_acuity_left || '6/6'}
                </div>
              </div>
              <p>This certificate is issued for ${certificate.purpose || 'driving license and related purposes'}.</p>
            </div>
          </div>
        `
        break
      default:
        certificateBody = `
          <div class="certificate">
            <h2>MEDICAL CERTIFICATE</h2>
            <div class="certificate-body">
              <p>This is to certify that <strong>${certificate.patient_name}</strong> has been examined and treated by me.</p>
              <p>This certificate is issued for ${certificate.purpose || 'medical purposes'} as requested.</p>
            </div>
          </div>
        `
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${certificate.id}</title>
        <style>
          @media print {
            @page { size: A4; margin: 1in 0.75in; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; margin: 0; padding: 0; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15pt; margin-bottom: 20pt; }
            .clinic-name { font-size: 20pt; font-weight: bold; margin-bottom: 5pt; }
            .clinic-details { font-size: 10pt; margin-bottom: 8pt; }
            .certificate { border: 3px solid #000; padding: 20pt; margin: 20pt 0; text-align: center; }
            .certificate h2 { font-size: 18pt; font-weight: bold; margin-bottom: 20pt; }
            .certificate-body { text-align: justify; font-size: 12pt; line-height: 1.6; }
            .findings-box { margin: 15pt 0; padding: 8pt; border: 1px solid #ccc; text-align: left; }
            .vision-results { display: flex; justify-content: space-between; margin: 15pt 0; }
            .vision-box { flex: 1; border: 1px solid #ccc; padding: 8pt; margin: 0 5pt; text-align: center; }
            .signature-section { margin-top: 40pt; }
            .signature-box { float: right; width: 200pt; text-align: center; border-top: 1px solid #000; padding-top: 5pt; margin-top: 30pt; }
            .footer { margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #ccc; font-size: 10pt; text-align: center; clear: both; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">EyeCare Medical Center</div>
          <div class="clinic-details">123 Medical Plaza, Healthcare District, City - 123456<br>Phone: +91 98765 43210</div>
          <div style="font-size: 14pt; font-weight: bold; margin-top: 10pt;">Certificate No: ${certificate.id}</div>
        </div>

        ${certificateBody}

        <div class="signature-section">
          <div class="signature-box">
            <div style="height: 30pt;"></div>
            <div><strong>Dr. [Doctor Name]</strong></div>
            <div style="font-size: 10pt;">MBBS, MS (Ophthalmology)</div>
            <div style="font-size: 10pt;">Registration: REG/12345/2020</div>
            <div style="font-size: 10pt; margin-top: 5pt;">Date: ${formatDate(certificate.date)}</div>
          </div>
        </div>

        <div class="footer">
          <div>Certificate No: ${certificate.id} | Date: ${formatDate(certificate.date)}</div>
          <div style="margin-top: 5pt;">For verification, please contact the clinic with this certificate number.</div>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return { handlePrint }
}