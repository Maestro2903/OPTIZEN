import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// GET /api/old-patient-records/[id] - Get old patient records by old_patient_id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { id } = await params

    // Fetch old patient record by old_patient_id
    const { data: record, error: recordError } = await supabase
      .from('old_patient_records')
      .select(`
        *,
        old_patient_record_files (*)
      `)
      .eq('old_patient_id', id)
      .order('upload_date', { ascending: false })

    if (recordError) {
      console.error('Error fetching old patient record:', recordError)
      return NextResponse.json(
        { success: false, error: recordError.message },
        { status: 500 }
      )
    }

    if (!record || record.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Old patient record not found' },
        { status: 404 }
      )
    }

    // Generate signed URLs for files (valid for 1 hour)
    const recordsWithUrls = await Promise.all(
      record.map(async (rec) => {
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

    return NextResponse.json({
      success: true,
      data: recordsWithUrls
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/old-patient-records/[id] - Delete old patient record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'delete')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { id } = await params

    // First, get the record and its files
    const { data: record, error: fetchError } = await supabase
      .from('old_patient_records')
      .select(`
        *,
        old_patient_record_files (*)
      `)
      .eq('old_patient_id', id)
      .single()

    if (fetchError || !record) {
      return NextResponse.json(
        { success: false, error: 'Old patient record not found' },
        { status: 404 }
      )
    }

    // Delete files from storage
    if (record.old_patient_record_files && record.old_patient_record_files.length > 0) {
      const filePaths = record.old_patient_record_files.map((file: any) => file.file_path)
      
      const { error: storageError } = await supabase.storage
        .from('old-patient-records')
        .remove(filePaths)

      if (storageError) {
        console.error('Error deleting files from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete record from database (cascade will delete file records)
    const { error: deleteError } = await supabase
      .from('old_patient_records')
      .delete()
      .eq('id', record.id)

    if (deleteError) {
      console.error('Error deleting record:', deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Old patient record deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

