import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024 // 100MB total per upload
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

// DELETE /api/old-patient-records/record/[recordId] - Delete a specific record by UUID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'delete')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { recordId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(recordId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID format' },
        { status: 400 }
      )
    }

    // First, get the record and its files
    const { data: record, error: fetchError } = await supabase
      .from('old_patient_records')
      .select(`
        *,
        old_patient_record_files (*)
      `)
      .eq('id', recordId)
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
      .eq('id', recordId)

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

// POST /api/old-patient-records/record/[recordId]/files - Add files to existing record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'create')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createClient()
    const { recordId } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(recordId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID format' },
        { status: 400 }
      )
    }

    // Verify record exists
    const { data: record, error: recordError } = await supabase
      .from('old_patient_records')
      .select('id, old_patient_id')
      .eq('id', recordId)
      .single()

    if (recordError || !record) {
      return NextResponse.json(
        { success: false, error: 'Old patient record not found' },
        { status: 404 }
      )
    }

    // Parse formData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error: any) {
      console.error('Error parsing formData:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse form data',
          details: error?.message || 'Unknown error'
        },
        { status: 400 }
      )
    }

    // Get files from formData
    const files: File[] = []
    let totalSize = 0
    const fileErrors: string[] = []

    // Collect all files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('files') && value instanceof File) {
        // Validate file size
        if (value.size > MAX_FILE_SIZE) {
          fileErrors.push(`File "${value.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
          continue
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(value.type)) {
          fileErrors.push(`File "${value.name}" has unsupported type: ${value.type}`)
          continue
        }

        // Validate file name
        if (!value.name || value.name.trim() === '') {
          fileErrors.push('One or more files have invalid names')
          continue
        }

        totalSize += value.size
        files.push(value)
      }
    }

    // Return validation errors if any
    if (fileErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File validation failed',
          details: fileErrors
        },
        { status: 400 }
      )
    }

    // Validate total size
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { success: false, error: `Total file size exceeds maximum of ${MAX_TOTAL_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one file is required' },
        { status: 400 }
      )
    }

    // Upload files to Supabase Storage
    const uploadedFiles = []
    const failedFiles: Array<{ name: string; error: string }> = []
    const timestamp = Date.now()

    for (const file of files) {
      let filePath: string | null = null
      try {
        // Generate file path: old-patient-records/{old_patient_id}/{timestamp}_{filename}
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        filePath = `${record.old_patient_id.trim()}/${timestamp}_${sanitizedFilename}`

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('old-patient-records')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error(`Error uploading file "${file.name}":`, uploadError)
          failedFiles.push({ 
            name: file.name, 
            error: uploadError.message || 'Storage upload failed' 
          })
          continue
        }

        // Save file metadata to database
        const { data: fileRecord, error: fileError } = await supabase
          .from('old_patient_record_files')
          .insert({
            old_patient_record_id: recordId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: context.user_id
          })
          .select()
          .single()

        if (fileError) {
          console.error(`Error saving file metadata for "${file.name}":`, fileError)
          
          // Try to delete the uploaded file from storage
          if (filePath) {
            try {
              await supabase.storage
                .from('old-patient-records')
                .remove([filePath])
            } catch (cleanupError) {
              console.error(`Failed to cleanup uploaded file "${filePath}":`, cleanupError)
            }
          }
          
          failedFiles.push({ 
            name: file.name, 
            error: fileError.message || 'Failed to save file metadata' 
          })
          continue
        }

        if (!fileRecord) {
          console.error(`File record creation returned no data for "${file.name}"`)
          failedFiles.push({ 
            name: file.name, 
            error: 'File record creation failed - no data returned' 
          })
          continue
        }

        uploadedFiles.push(fileRecord)
      } catch (error: any) {
        console.error(`Unexpected error processing file "${file.name}":`, error)
        
        // Try to cleanup if file was uploaded but metadata save failed
        if (filePath) {
          try {
            await supabase.storage
              .from('old-patient-records')
              .remove([filePath])
          } catch (cleanupError) {
            console.error(`Failed to cleanup file "${filePath}" after error:`, cleanupError)
          }
        }
        
        failedFiles.push({ 
          name: file.name, 
          error: error?.message || 'Unexpected error processing file' 
        })
      }
    }

    // If no files were uploaded successfully, return error
    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to upload any files',
          details: failedFiles.length > 0 
            ? failedFiles.map(f => `${f.name}: ${f.error}`).join('; ')
            : 'All files failed validation or upload'
        },
        { status: 500 }
      )
    }

    // Fetch the complete record with files
    const { data: completeRecord, error: fetchError } = await supabase
      .from('old_patient_records')
      .select(`
        *,
        old_patient_record_files (*)
      `)
      .eq('id', recordId)
      .single()

    if (fetchError) {
      console.error('Error fetching complete record:', fetchError)
    }

    // Build response message
    let message = `Successfully uploaded ${uploadedFiles.length} file(s)`
    if (failedFiles.length > 0) {
      message += `. ${failedFiles.length} file(s) failed to upload`
    }

    return NextResponse.json({
      success: true,
      data: completeRecord || record,
      message,
      uploadedCount: uploadedFiles.length,
      failedCount: failedFiles.length,
      ...(failedFiles.length > 0 && { failedFiles })
    })

  } catch (error: any) {
    console.error('Unexpected API error in POST /old-patient-records/record/[recordId]/files:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? error?.message 
          : undefined
      },
      { status: 500 }
    )
  }
}














