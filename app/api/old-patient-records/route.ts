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

// GET /api/old-patient-records - List old patient records
export async function GET(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const old_patient_id = searchParams.get('old_patient_id')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('old_patient_records')
      .select(`
        *,
        old_patient_record_files (
          id,
          file_name,
          file_size,
          file_type,
          created_at
        )
      `, { count: 'exact' })
      .order('upload_date', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`old_patient_id.ilike.%${search}%,patient_name.ilike.%${search}%`)
    }

    if (old_patient_id) {
      query = query.eq('old_patient_id', old_patient_id)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: records, error, count } = await query

    if (error) {
      console.error('Error fetching old patient records:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Calculate file counts
    const recordsWithCounts = records?.map(record => ({
      ...record,
      file_count: record.old_patient_record_files?.length || 0
    })) || []

    return NextResponse.json({
      success: true,
      data: recordsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/old-patient-records - Upload old patient records
export async function POST(request: NextRequest) {
  try {
    // RBAC check
    const authCheck = await requirePermission('patients', 'create')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }
    const { context } = authCheck

    const supabase = createClient()
    
    // Parse formData with error handling
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

    // Extract form fields
    const old_patient_id = formData.get('old_patient_id') as string
    const patient_name = formData.get('patient_name') as string | null
    const notes = formData.get('notes') as string | null

    // Validate required fields
    if (!old_patient_id || old_patient_id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'old_patient_id is required' },
        { status: 400 }
      )
    }

    // Get files from formData
    const files: File[] = []
    let totalSize = 0
    const fileErrors: string[] = []

    // Collect all files (formData can have multiple entries with same key)
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('files') && value instanceof File) {
        // Validate file size
        if (value.size > MAX_FILE_SIZE) {
          fileErrors.push(`File "${value.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
          continue
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(value.type)) {
          fileErrors.push(`File "${value.name}" has unsupported type: ${value.type}. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`)
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

    // Create old patient record
    const { data: record, error: recordError } = await supabase
      .from('old_patient_records')
      .insert({
        old_patient_id: old_patient_id.trim(),
        patient_name: patient_name?.trim() || null,
        notes: notes?.trim() || null,
        uploaded_by: context.user_id,
        upload_date: new Date().toISOString()
      })
      .select()
      .single()

    if (recordError) {
      console.error('Error creating old patient record:', {
        error: recordError,
        code: recordError.code,
        message: recordError.message,
        details: recordError.details,
        hint: recordError.hint,
        old_patient_id: old_patient_id.trim()
      })
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create patient record'
      if (recordError.code === '23505') {
        errorMessage = 'A record with this patient ID already exists'
      } else if (recordError.code === '23503') {
        errorMessage = 'Invalid user reference'
      } else if (recordError.message) {
        errorMessage = recordError.message
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          code: recordError.code,
          details: recordError.details || recordError.hint
        },
        { status: 500 }
      )
    }

    if (!record) {
      console.error('Record creation returned no data')
      return NextResponse.json(
        { success: false, error: 'Failed to create patient record - no data returned' },
        { status: 500 }
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
        filePath = `${old_patient_id.trim()}/${timestamp}_${sanitizedFilename}`

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
          console.error(`Error uploading file "${file.name}":`, {
            error: uploadError,
            message: uploadError.message
          })
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
            old_patient_record_id: record.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: context.user_id
          })
          .select()
          .single()

        if (fileError) {
          console.error(`Error saving file metadata for "${file.name}":`, {
            error: fileError,
            code: fileError.code,
            message: fileError.message
          })
          
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
        console.error(`Unexpected error processing file "${file.name}":`, {
          error,
          message: error?.message,
          stack: error?.stack
        })
        
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

    // If no files were uploaded successfully, delete the record and return error
    if (uploadedFiles.length === 0) {
      console.error('No files uploaded successfully. Failed files:', failedFiles)
      
      // Cleanup: delete the record
      try {
        await supabase
          .from('old_patient_records')
          .delete()
          .eq('id', record.id)
      } catch (deleteError) {
        console.error('Error deleting record after failed upload:', deleteError)
      }

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
      .eq('id', record.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete record:', {
        error: fetchError,
        message: fetchError.message,
        recordId: record.id
      })
      // Don't fail the request if we can't fetch the complete record
      // The upload was successful, we just can't return the full details
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
    console.error('Unexpected API error in POST /old-patient-records:', {
      error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    
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

