import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseArrayParam, validateArrayParam, applyArrayFilter } from '@/lib/utils/query-params'
import { requirePermission } from '@/lib/middleware/rbac'
import * as z from 'zod'

// Helper function to resolve treatment drug names, dosage names, and route names
async function resolveTreatments(treatments: any[], supabase: any) {
  if (!treatments || treatments.length === 0) return []
  
  const drugIds = treatments.map(t => t.drug_id).filter(Boolean)
  const dosageIds = treatments.map(t => t.dosage_id).filter(Boolean)
  const routeIds = treatments.map(t => t.route_id).filter(Boolean)
  
  // Fetch drug names from master_data (category: 'medicines')
  let drugsMap: Record<string, string> = {}
  if (drugIds.length > 0) {
    const { data: drugs } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', drugIds)
      .eq('category', 'medicines')
    
    if (drugs) {
      drugs.forEach((drug: any) => {
        drugsMap[drug.id] = drug.name
      })
    }
    
    // Fallback to pharmacy_items if not found in master_data
    const unresolvedDrugIds = drugIds.filter(id => !drugsMap[id])
    if (unresolvedDrugIds.length > 0) {
      const { data: pharmacyDrugs } = await supabase
        .from('pharmacy_items')
        .select('id, name')
        .in('id', unresolvedDrugIds)
      
      if (pharmacyDrugs) {
        pharmacyDrugs.forEach((drug: any) => {
          drugsMap[drug.id] = drug.name
        })
      }
    }
  }
  
  // Fetch dosage names from master_data (category: 'dosages')
  let dosagesMap: Record<string, string> = {}
  if (dosageIds.length > 0) {
    const { data: dosages } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', dosageIds)
      .eq('category', 'dosages')
    
    if (dosages) {
      dosages.forEach((dosage: any) => {
        dosagesMap[dosage.id] = dosage.name
      })
    }
  }
  
  // Fetch route names from master_data (category: 'routes')
  let routesMap: Record<string, string> = {}
  if (routeIds.length > 0) {
    const { data: routes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', routeIds)
      .eq('category', 'routes')
    
    if (routes) {
      routes.forEach((route: any) => {
        routesMap[route.id] = route.name
      })
    }
  }
  
  // Fetch eye selection names from master_data (category: 'eye_selection')
  const eyeIds = treatments.map(t => t.eye).filter(Boolean)
  let eyesMap: Record<string, string> = {}
  if (eyeIds.length > 0) {
    const { data: eyes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', eyeIds)
      .eq('category', 'eye_selection')
    
    if (eyes) {
      eyes.forEach((eye: any) => {
        eyesMap[eye.id] = eye.name
      })
    }
  }
  
  // Return enriched treatment objects
  return treatments.map(t => ({
    ...t,
    drug_name: t.drug_id ? (drugsMap[t.drug_id] || 'Unknown') : undefined,
    dosage_name: t.dosage_id ? (dosagesMap[t.dosage_id] || 'Unknown') : undefined,
    route_name: t.route_id ? (routesMap[t.route_id] || 'Unknown') : undefined,
    eye_name: t.eye ? (eyesMap[t.eye] || t.eye) : undefined,
  }))
}

// Helper function to resolve complaint names from master_data
async function resolveComplaints(complaints: any[], supabase: any) {
  if (!complaints || complaints.length === 0) return []
  
  const complaintIds = complaints.map(c => c.complaintId).filter(Boolean)
  const categoryIds = complaints.map(c => c.categoryId).filter(Boolean)
  
  // Fetch complaint names from master_data
  let complaintsMap: Record<string, string> = {}
  if (complaintIds.length > 0) {
    const { data: complaintData } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', complaintIds)
      .eq('category', 'complaints')
    
    if (complaintData) {
      complaintData.forEach((complaint: any) => {
        complaintsMap[complaint.id] = complaint.name
      })
    }
  }
  
  // Fetch category names from master_data
  let categoriesMap: Record<string, string> = {}
  if (categoryIds.length > 0) {
    const { data: categoryData } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', categoryIds)
      .eq('category', 'complaint_categories')
    
    if (categoryData) {
      categoryData.forEach((category: any) => {
        categoriesMap[category.id] = category.name
      })
    }
  }

  // Fetch eye selection names for complaints
  const eyeIds = complaints.map(c => c.eye).filter(Boolean)
  let eyesMap: Record<string, string> = {}
  if (eyeIds.length > 0) {
    const { data: eyes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', eyeIds)
      .eq('category', 'eye_selection')
    
    if (eyes) {
      eyes.forEach((eye: any) => {
        eyesMap[eye.id] = eye.name
      })
    }
  }
  
  // Return enriched complaint objects
  return complaints.map(c => ({
    ...c,
    complaint_name: c.complaintId ? (complaintsMap[c.complaintId] || c.complaintId) : undefined,
    category_name: c.categoryId ? (categoriesMap[c.categoryId] || c.categoryId) : undefined,
    eye_name: c.eye ? (eyesMap[c.eye] || c.eye) : undefined,
  }))
}

// Helper function to resolve diagnostic test names from master_data
async function resolveDiagnosticTests(diagnosticTests: any[], supabase: any) {
  if (!diagnosticTests || diagnosticTests.length === 0) return []
  
  const testIds = diagnosticTests.map(t => t.test_id).filter(Boolean)
  
  // Fetch test names from master_data
  let testsMap: Record<string, string> = {}
  if (testIds.length > 0) {
    const { data: tests } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', testIds)
      .eq('category', 'diagnostic_tests')
    
    if (tests) {
      tests.forEach((test: any) => {
        testsMap[test.id] = test.name
      })
    }
  }

  // Fetch eye selection names for diagnostic tests
  const eyeIds = diagnosticTests.map(t => t.eye).filter(Boolean)
  let eyesMap: Record<string, string> = {}
  if (eyeIds.length > 0) {
    const { data: eyes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', eyeIds)
      .eq('category', 'eye_selection')
    
    if (eyes) {
      eyes.forEach((eye: any) => {
        eyesMap[eye.id] = eye.name
      })
    }
  }
  
  // Return enriched diagnostic test objects
  return diagnosticTests.map(t => ({
    ...t,
    test_name: t.test_id ? (testsMap[t.test_id] || t.test_id) : undefined,
    eye_name: t.eye ? (eyesMap[t.eye] || t.eye) : undefined,
  }))
}

// Helper function to resolve surgeries from examination_data
async function resolveSurgeries(surgeries: any[], supabase: any) {
  if (!surgeries || surgeries.length === 0) return []
  
  const surgeryNames = surgeries.map(s => s.surgery_name).filter(Boolean)
  const anesthesiaIds = surgeries.map(s => s.anesthesia).filter(Boolean)
  
  // Check if surgery_name might be a UUID
  const possibleSurgeryUuids = surgeryNames.filter(name => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name))
  
  // Fetch surgery type names if surgery_name appears to be a UUID
  let surgeriesMap: Record<string, string> = {}
  if (possibleSurgeryUuids.length > 0) {
    // Try surgeries category first
    const { data: surgeryData } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', possibleSurgeryUuids)
      .eq('category', 'surgeries')
    
    if (surgeryData) {
      surgeryData.forEach((surgery: any) => {
        surgeriesMap[surgery.id] = surgery.name
      })
    }

    // Also try surgery_types category as fallback
    const unresolvedSurgeryIds = possibleSurgeryUuids.filter(id => !surgeriesMap[id])
    if (unresolvedSurgeryIds.length > 0) {
      const { data: surgeryTypes } = await supabase
        .from('master_data')
        .select('id, name')
        .in('id', unresolvedSurgeryIds)
        .eq('category', 'surgery_types')
      
      if (surgeryTypes) {
        surgeryTypes.forEach((surgery: any) => {
          surgeriesMap[surgery.id] = surgery.name
        })
      }
    }
  }

  // Fetch anesthesia type names
  let anesthesiaMap: Record<string, string> = {}
  if (anesthesiaIds.length > 0) {
    const { data: anesthesiaTypes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', anesthesiaIds)
      .eq('category', 'anesthesia_types')
    
    if (anesthesiaTypes) {
      anesthesiaTypes.forEach((anesthesia: any) => {
        anesthesiaMap[anesthesia.id] = anesthesia.name
      })
    }
  }

  // Fetch eye selection names for surgeries
  const eyeIds = surgeries.map(s => s.eye).filter(Boolean)
  let eyesMap: Record<string, string> = {}
  if (eyeIds.length > 0) {
    const { data: eyes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', eyeIds)
      .eq('category', 'eye_selection')
    
    if (eyes) {
      eyes.forEach((eye: any) => {
        eyesMap[eye.id] = eye.name
      })
    }
  }
  
  // Return enriched surgery objects
  return surgeries.map(s => {
    const surgeryName = s.surgery_name
    const isUuid = surgeryName && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(surgeryName)
    const resolvedSurgeryName = isUuid ? (surgeriesMap[surgeryName] || surgeryName) : surgeryName
    
    // Preserve original UUID only if it was actually a UUID
    // This helps the frontend know whether to use the original (UUID) or the resolved name
    return {
      ...s,
      surgery_name: resolvedSurgeryName, // Always the human-readable name for display
      surgery_name_original: isUuid ? surgeryName : undefined, // Only set if original was a UUID
      anesthesia_name: s.anesthesia ? (anesthesiaMap[s.anesthesia] || s.anesthesia) : undefined,
      eye_name: s.eye ? (eyesMap[s.eye] || s.eye) : undefined,
    }
  })
}

// Helper function to resolve examination_data surgeries
async function resolveExaminationData(examinationData: any, supabase: any) {
  if (!examinationData || typeof examinationData !== 'object') return examinationData
  
  const resolved = { ...examinationData }
  
  // Resolve surgeries if they exist
  if (resolved.surgeries && Array.isArray(resolved.surgeries) && resolved.surgeries.length > 0) {
    resolved.surgeries = await resolveSurgeries(resolved.surgeries, supabase)
  }
  
  return resolved
}

// Helper function to clean data before validation
function cleanCaseData(data: any): any {
  const cleaned = { ...data }
  
  // Clean complaints array - remove entries with empty complaintId
  if (cleaned.complaints && Array.isArray(cleaned.complaints)) {
    cleaned.complaints = cleaned.complaints
      .filter((c: any) => c.complaintId && c.complaintId.trim() !== '')
      .map((c: any) => ({
        categoryId: c.categoryId && c.categoryId.trim() !== '' ? c.categoryId : null,
        complaintId: c.complaintId,
        duration: c.duration || undefined,
        eye: c.eye || undefined,
        notes: c.notes || undefined,
      }))
  }
  
  // Clean treatments array - remove entries with empty drug_id
  if (cleaned.treatments && Array.isArray(cleaned.treatments)) {
    cleaned.treatments = cleaned.treatments
      .filter((t: any) => t.drug_id && t.drug_id.trim() !== '')
      .map((t: any) => ({
        drug_id: t.drug_id,
        dosage_id: t.dosage_id && t.dosage_id.trim() !== '' ? t.dosage_id : undefined,
        route_id: t.route_id && t.route_id.trim() !== '' ? t.route_id : undefined,
        duration: t.duration || undefined,
        eye: t.eye || undefined,
        quantity: t.quantity || undefined,
      }))
  }
  
  // Clean diagnostic_tests array - remove entries with empty test_id
  if (cleaned.diagnostic_tests && Array.isArray(cleaned.diagnostic_tests)) {
    cleaned.diagnostic_tests = cleaned.diagnostic_tests
      .filter((t: any) => t.test_id && t.test_id.trim() !== '')
      .map((t: any) => ({
        test_id: t.test_id,
        eye: t.eye || undefined,
        type: t.type || undefined,
        problem: t.problem || undefined,
        notes: t.notes || undefined,
      }))
  }
  
  return cleaned
}

// Validation schemas for JSONB fields
const complaintSchema = z.object({
  categoryId: z.union([z.string().uuid(), z.null()]).optional(),
  complaintId: z.string().uuid('Invalid complaint ID'),
  duration: z.string().optional(),
  eye: z.string().optional(),
  notes: z.string().optional(),
})

const treatmentSchema = z.object({
  drug_id: z.string().uuid('Invalid drug ID'),
  dosage_id: z.string().uuid('Invalid dosage ID').optional(),
  route_id: z.string().uuid('Invalid route ID').optional(),
  duration: z.string().optional(),
  eye: z.string().optional(),
  quantity: z.string().optional()
})

const diagnosticTestSchema = z.object({
  test_id: z.string().uuid('Invalid test ID'),
  eye: z.string().optional(),
  type: z.string().optional(),
  problem: z.string().optional(),
  notes: z.string().optional(),
})

const visionDataSchema = z.object({
  unaided: z.object({
    right: z.string().optional(),
    left: z.string().optional(),
  }).optional(),
  pinhole: z.object({
    right: z.string().optional(),
    left: z.string().optional(),
  }).optional(),
  aided: z.object({
    right: z.string().optional(),
    left: z.string().optional(),
  }).optional(),
  near: z.object({
    right: z.string().optional(),
    left: z.string().optional(),
  }).optional(),
})

// Case schema for validation
const caseSchema = z.object({
  case_no: z.string().min(1, 'Case number is required'),
  patient_id: z.string().uuid('Invalid patient ID'),
  encounter_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  visit_type: z.string().optional(),
  chief_complaint: z.string().optional(),
  history_of_present_illness: z.string().optional(),
  past_medical_history: z.string().optional(),
  examination_findings: z.string().optional(),
  diagnosis: z.union([z.array(z.string()), z.string(), z.null(), z.undefined()]).optional(),
  treatment_plan: z.string().optional(),
  medications_prescribed: z.string().optional(),
  follow_up_instructions: z.string().optional(),
  advice_remarks: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'pending']).default('active'),
  complaints: z.array(complaintSchema).optional(),
  treatments: z.array(treatmentSchema).optional(),
  diagnostic_tests: z.array(diagnosticTestSchema).optional(),
  vision_data: visionDataSchema.optional(),
  examination_data: z.record(z.string(), z.any()).optional(),
}).passthrough() // Allow additional fields

// GET /api/cases - List cases with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('cases', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    // Verify environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not defined!')
      return NextResponse.json({ 
        error: 'Server configuration error', 
        details: 'Supabase URL not configured' 
      }, { status: 500 })
    }
    
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    let page = parseInt(searchParams.get('page') || '1')
    let limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    let sortBy = searchParams.get('sortBy') || 'created_at'
    let sortOrder = searchParams.get('sortOrder') || 'desc'
    const status = searchParams.get('status') || ''
    const patient_id = searchParams.get('patient_id') || ''

    // Validate and constrain page and limit
    page = isNaN(page) || page < 1 ? 1 : page
    limit = isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 100)

    // Validate sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'
    }

    // Validate sortBy against allowlist (prevent column enumeration)
    const allowedSortColumns = [
      'created_at',
      'updated_at',
      'case_no',
      'encounter_date',
      'status',
      'visit_type',
      'patient_id'
    ]
    if (!allowedSortColumns.includes(sortBy)) {
      sortBy = 'created_at'
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with joins to get patient information
    let query = supabase
      .from('encounters')
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender,
          date_of_birth,
          state
        )
      `, { count: 'exact' })

    // Apply search filter with sanitization to prevent wildcard injection
    // Note: We can only search in the main table (encounters), not related tables (patients)
    // Users should search for patients in the patient selector, which will filter cases by patient_id
    if (search) {
      // Escape special wildcard characters: backslash first, then % and _
      const sanitizedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      // Search only in case_no field from encounters table
      query = query.ilike('case_no', `%${sanitizedSearch}%`)
    }

    // Parse and validate status parameter (supports arrays)
    const allowedStatuses = ['active', 'completed', 'cancelled', 'pending']
    const statusValues = status ? validateArrayParam(
      parseArrayParam(status),
      allowedStatuses,
      false
    ) : []

    // Apply status filter (supports multiple values)
    if (statusValues.length > 0) {
      query = applyArrayFilter(query, 'status', statusValues)
    } else {
      // By default, exclude cancelled cases (soft deleted)
      query = query.neq('status', 'cancelled')
    }

    // Apply patient filter
    if (patient_id) {
      query = query.eq('patient_id', patient_id)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: cases, error, count } = await query

    if (error) {
      console.error('Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: 'Failed to fetch cases',
        details: error.message 
      }, { status: 500 })
    }

    // Resolve treatment drug names, complaints, diagnostic tests, and examination_data surgeries for all cases
    if (cases && cases.length > 0) {
      for (const caseItem of cases) {
        if (caseItem.treatments && Array.isArray(caseItem.treatments) && caseItem.treatments.length > 0) {
          caseItem.treatments = await resolveTreatments(caseItem.treatments, supabase)
        }
        if (caseItem.complaints && Array.isArray(caseItem.complaints) && caseItem.complaints.length > 0) {
          caseItem.complaints = await resolveComplaints(caseItem.complaints, supabase)
        }
        if (caseItem.diagnostic_tests && Array.isArray(caseItem.diagnostic_tests) && caseItem.diagnostic_tests.length > 0) {
          caseItem.diagnostic_tests = await resolveDiagnosticTests(caseItem.diagnostic_tests, supabase)
        }
        if (caseItem.examination_data) {
          caseItem.examination_data = await resolveExaminationData(caseItem.examination_data, supabase)
        }
      }
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: cases,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cases - Create a new case/encounter
export async function POST(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('cases', 'create')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const body = await request.json()

    // Clean the data before validation - remove empty/invalid entries from arrays
    const cleanedBody = cleanCaseData(body)

    // Validate request body with Zod
    const validationResult = caseSchema.safeParse(cleanedBody)
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', validatedData.patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Prepare data for insertion
    const insertData: any = {
      case_no: validatedData.case_no,
      patient_id: validatedData.patient_id,
      provider_id: context.user_id, // Required field - set to current user
      encounter_date: validatedData.encounter_date,
      visit_type: validatedData.visit_type,
      chief_complaint: validatedData.chief_complaint,
      history_of_present_illness: validatedData.history_of_present_illness,
      past_medical_history: validatedData.past_medical_history,
      examination_findings: validatedData.examination_findings,
      diagnosis: Array.isArray(validatedData.diagnosis) ? validatedData.diagnosis : validatedData.diagnosis ? [validatedData.diagnosis] : null,
      treatment_plan: validatedData.treatment_plan,
      medications_prescribed: validatedData.medications_prescribed,
      follow_up_instructions: validatedData.follow_up_instructions,
      advice_remarks: validatedData.advice_remarks,
      status: validatedData.status,
      created_by: context.user_id,
    }

    // Add JSONB fields if provided
    if (validatedData.complaints && Array.isArray(validatedData.complaints) && validatedData.complaints.length > 0) {
      insertData.complaints = validatedData.complaints
    }

    if (validatedData.treatments && Array.isArray(validatedData.treatments) && validatedData.treatments.length > 0) {
      insertData.treatments = validatedData.treatments
    }

    if (validatedData.diagnostic_tests && Array.isArray(validatedData.diagnostic_tests) && validatedData.diagnostic_tests.length > 0) {
      insertData.diagnostic_tests = validatedData.diagnostic_tests
    }

    if (validatedData.vision_data && Object.keys(validatedData.vision_data).length > 0) {
      insertData.vision_data = validatedData.vision_data
    }

    if (validatedData.examination_data && Object.keys(validatedData.examination_data).length > 0) {
      insertData.examination_data = validatedData.examination_data
    }

    // Add any other fields that were passed but not explicitly handled
    const { complaints, treatments, diagnostic_tests, vision_data, examination_data, ...rest } = body
    Object.keys(rest).forEach(key => {
      if (!insertData.hasOwnProperty(key) && key !== 'complaints' && key !== 'treatments' && key !== 'diagnostic_tests' && key !== 'vision_data' && key !== 'examination_data') {
        insertData[key] = rest[key]
      }
    })

    // Insert new case/encounter
    const { data: encounter, error } = await supabase
      .from('encounters')
      .insert([insertData])
      .select(`
        *,
        patients:patient_id (
          id,
          patient_id,
          full_name,
          email,
          mobile,
          gender,
          date_of_birth,
          state
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Case number already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create case', details: error.message }, { status: 500 })
    }

    // Resolve treatment drug names, complaints, diagnostic tests, and examination_data surgeries if they exist
    let encounterWithResolvedData = encounter
    if (encounter.treatments && Array.isArray(encounter.treatments) && encounter.treatments.length > 0) {
      encounterWithResolvedData.treatments = await resolveTreatments(encounter.treatments, supabase)
    }
    if (encounter.complaints && Array.isArray(encounter.complaints) && encounter.complaints.length > 0) {
      encounterWithResolvedData.complaints = await resolveComplaints(encounter.complaints, supabase)
    }
    if (encounter.diagnostic_tests && Array.isArray(encounter.diagnostic_tests) && encounter.diagnostic_tests.length > 0) {
      encounterWithResolvedData.diagnostic_tests = await resolveDiagnosticTests(encounter.diagnostic_tests, supabase)
    }
    if (encounter.examination_data) {
      encounterWithResolvedData.examination_data = await resolveExaminationData(encounter.examination_data, supabase)
    }

    return NextResponse.json({
      success: true,
      data: encounterWithResolvedData,
      message: 'Case created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}