import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/patients/[id]/records - Get all patient-related records
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authorization check
  const authCheck = await requirePermission('patients', 'view')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }

  try {
    const supabase = createClient()
    const { id } = params

    // First, find the patient by UUID or patient_id
    let patient = null
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    if (uuidRegex.test(id)) {
      // Search by UUID
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!error && data) {
        patient = data
      }
    } else {
      // Search by patient_id (text)
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_id', id)
        .single()
      
      if (!error && data) {
        patient = data
      }
    }

    // Check for old patient records if no current patient found
    let oldRecords = null
    if (!patient) {
      const { data: oldRecordsData, error: oldRecordsError } = await supabase
        .from('old_patient_records')
        .select(`
          *,
          old_patient_record_files (*)
        `)
        .eq('old_patient_id', id)
        .order('upload_date', { ascending: false })

      if (!oldRecordsError && oldRecordsData && oldRecordsData.length > 0) {
        // Generate signed URLs for files
        const recordsWithUrls = await Promise.all(
          oldRecordsData.map(async (rec) => {
            if (rec.old_patient_record_files && rec.old_patient_record_files.length > 0) {
              const filesWithUrls = await Promise.all(
                rec.old_patient_record_files.map(async (file: any) => {
                  const { data: urlData } = await supabase.storage
                    .from('old-patient-records')
                    .createSignedUrl(file.file_path, 3600) // 1 hour expiry

                  return {
                    ...file,
                    file_url: urlData?.signedUrl || null
                  }
                })
              )

              return {
                ...rec,
                old_patient_record_files: filesWithUrls
              }
            }
            return rec
          })
        )

        oldRecords = recordsWithUrls

        // Return old records only (no current patient)
        return NextResponse.json({
          success: true,
          data: {
            patient: null,
            oldPatientId: id,
            oldRecords: oldRecords,
            cases: [],
            appointments: [],
            invoices: [],
            prescriptions: [],
            certificates: [],
            operations: [],
            discharges: [],
            bedAssignments: [],
            opticalOrders: [],
            summary: {
              totalCases: 0,
              totalAppointments: 0,
              totalInvoices: 0,
              totalPrescriptions: 0,
              totalCertificates: 0,
              totalOperations: 0,
              totalDischarges: 0,
              totalBedAssignments: 0,
              totalOpticalOrders: 0,
              totalOldRecords: oldRecords.length
            }
          }
        })
      }
    }

    // If no patient and no old records found
    if (!patient && !oldRecords) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const patientId = patient?.id

    // Also check for old records with matching old_patient_id
    const oldRecordsResult = patient
      ? await supabase
          .from('old_patient_records')
          .select(`
            *,
            old_patient_record_files (*)
          `)
          .eq('old_patient_id', id)
          .order('upload_date', { ascending: false })
      : { data: null, error: null }

    // Fetch all patient-related data in parallel
    const [
      casesResult,
      appointmentsResult,
      invoicesResult,
      prescriptionsResult,
      certificatesResult,
      operationsResult,
      dischargesResult,
      bedAssignmentsResult,
      opticalOrdersResult
    ] = await Promise.all([
      // Cases (encounters)
      supabase
        .from('encounters')
        .select('*')
        .eq('patient_id', patientId)
        .order('encounter_date', { ascending: false }),
      
      // Appointments
      supabase
        .from('appointments')
        .select(`
          *,
          users:provider_id (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false }),
      
      // Invoices
      supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (*)
        `)
        .eq('patient_id', patientId)
        .order('invoice_date', { ascending: false }),
      
      // Prescriptions
      supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_items (*),
          users:prescribed_by (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('patient_id', patientId)
        .order('prescription_date', { ascending: false }),
      
      // Certificates
      supabase
        .from('certificates')
        .select('*')
        .eq('patient_id', patientId)
        .order('issue_date', { ascending: false }),
      
      // Operations
      supabase
        .from('operations')
        .select(`
          *,
          encounters:case_id (
            id,
            case_no,
            encounter_date,
            diagnosis
          )
        `)
        .eq('patient_id', patientId)
        .is('deleted_at', null)
        .order('operation_date', { ascending: false }),
      
      // Discharges
      supabase
        .from('discharges')
        .select(`
          *,
          encounters:case_id (
            id,
            case_no,
            encounter_date,
            diagnosis
          )
        `)
        .eq('patient_id', patientId)
        .order('discharge_date', { ascending: false }),
      
      // Bed Assignments
      supabase
        .from('bed_assignments')
        .select(`
          *,
          beds:bed_id (
            id,
            bed_number,
            ward_name,
            ward_type,
            bed_type,
            floor_number,
            room_number
          ),
          users:assigned_doctor_id (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('patient_id', patientId)
        .order('admission_date', { ascending: false }),
      
      // Optical Orders
      supabase
        .from('optical_orders')
        .select(`
          *,
          inventory:frame_id (
            id,
            name,
            sku,
            category
          )
        `)
        .eq('patient_id', patientId)
        .order('ordered_at', { ascending: false })
    ])

    // Extract data and handle errors
    const cases = casesResult.data || []
    const appointments = appointmentsResult.data || []
    const invoices = invoicesResult.data || []
    const prescriptions = prescriptionsResult.data || []
    const certificates = certificatesResult.data || []
    const operations = operationsResult.data || []
    const discharges = dischargesResult.data || []
    const bedAssignments = bedAssignmentsResult.data || []
    const opticalOrders = opticalOrdersResult.data || []
    
    // Get old records from result (if patient was found, otherwise oldRecords is already set above)
    if (patient) {
      oldRecords = oldRecordsResult.data || []
    }

    // Generate signed URLs for old record files
    let oldRecordsWithUrls = oldRecords || []
    if (oldRecords.length > 0) {
      oldRecordsWithUrls = await Promise.all(
        oldRecords.map(async (rec: any) => {
          if (rec.old_patient_record_files && rec.old_patient_record_files.length > 0) {
            const filesWithUrls = await Promise.all(
              rec.old_patient_record_files.map(async (file: any) => {
                const { data: urlData } = await supabase.storage
                  .from('old-patient-records')
                  .createSignedUrl(file.file_path, 3600) // 1 hour expiry

                return {
                  ...file,
                  file_url: urlData?.signedUrl || null
                }
              })
            )

            return {
              ...rec,
              old_patient_record_files: filesWithUrls
            }
          }
          return rec
        })
      )
    }

    // Calculate summary
    const summary = {
      totalCases: cases.length,
      totalAppointments: appointments.length,
      totalInvoices: invoices.length,
      totalPrescriptions: prescriptions.length,
      totalCertificates: certificates.length,
      totalOperations: operations.length,
      totalDischarges: discharges.length,
      totalBedAssignments: bedAssignments.length,
      totalOpticalOrders: opticalOrders.length,
      totalOldRecords: oldRecordsWithUrls.length
    }

    return NextResponse.json({
      success: true,
      data: {
        patient,
        oldPatientId: !patient ? id : undefined,
        oldRecords: oldRecordsWithUrls,
        cases,
        appointments,
        invoices,
        prescriptions,
        certificates,
        operations,
        discharges,
        bedAssignments,
        opticalOrders,
        summary
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

