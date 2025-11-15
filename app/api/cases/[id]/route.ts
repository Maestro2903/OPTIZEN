import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

// Helper function to resolve treatment drug names (shared with route.ts)
async function resolveTreatments(treatments: any[], supabase: any) {
  if (!treatments || treatments.length === 0) return []
  
  const drugIds = treatments.map(t => t.drug_id).filter(Boolean)
  const dosageIds = treatments.map(t => t.dosage_id).filter(Boolean)
  const routeIds = treatments.map(t => t.route_id).filter(Boolean)
  
  // Fetch drugs from master_data (medicines category)
  let drugs: any[] = []
  if (drugIds.length > 0) {
    const { data: masterDrugs } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', drugIds)
      .eq('category', 'medicines')
    
    if (masterDrugs) {
      drugs = masterDrugs
    }
  }
  
  // Fetch from pharmacy_items as fallback for any missing drugs
  const foundDrugIds = drugs.map(d => d.id)
  const missingDrugIds = drugIds.filter(id => !foundDrugIds.includes(id))
  
  if (missingDrugIds.length > 0) {
    const { data: pharmacyDrugs } = await supabase
      .from('pharmacy_items')
      .select('id, name')
      .in('id', missingDrugIds)
    
    if (pharmacyDrugs) {
      drugs = [...drugs, ...pharmacyDrugs]
    }
  }
  
  // Fetch dosages from master_data
  let dosages: any[] = []
  if (dosageIds.length > 0) {
    const { data: masterDosages } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', dosageIds)
      .eq('category', 'dosages')
    
    if (masterDosages) {
      dosages = masterDosages
    }
  }
  
  // Fetch routes from master_data
  let routes: any[] = []
  if (routeIds.length > 0) {
    const { data: masterRoutes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', routeIds)
      .eq('category', 'routes')
    
    if (masterRoutes) {
      routes = masterRoutes
    }
  }
  
  // Fetch eye selection from master_data
  const eyeIds = treatments.map(t => t.eye).filter(Boolean)
  let eyes: any[] = []
  if (eyeIds.length > 0) {
    const { data: masterEyes } = await supabase
      .from('master_data')
      .select('id, name')
      .in('id', eyeIds)
      .eq('category', 'eye_selection')
    
    if (masterEyes) {
      eyes = masterEyes
    }
  }
  
  // Resolve names and return enriched treatment objects
  return treatments.map(t => ({
    ...t,
    drug_name: drugs.find(d => d.id === t.drug_id)?.name || 'Unknown',
    dosage_name: t.dosage_id ? dosages.find(d => d.id === t.dosage_id)?.name : undefined,
    route_name: t.route_id ? routes.find(r => r.id === t.route_id)?.name : undefined,
    eye_name: t.eye ? (eyes.find(e => e.id === t.eye)?.name || t.eye) : undefined,
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

// GET /api/cases/[id] - Get a specific case by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch case with patient information
    const { data: encounter, error } = await supabase
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
          address,
          city,
          state
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
    }

    if (!encounter) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
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

    // Authorization check - users can only view their own cases
    // TODO: Add proper authorization based on case ownership or user role/permissions
    // For now, any authenticated user can view cases

    return NextResponse.json({
      success: true,
      data: encounterWithResolvedData
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/cases/[id] - Update a case
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization check - fetch case first (only fields needed for authorization)
    const { data: existingCase, error: fetchError } = await supabase
      .from('encounters')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Error fetching case:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
    }

    // Check authorization - user must own the case or have appropriate role
    // TODO: Also check for admin role or assigned doctor role
    if (existingCase.created_by !== session.user.id) {
      return NextResponse.json({ 
        error: 'Forbidden: You do not have permission to update this case' 
      }, { status: 403 })
    }
    // For now, any authenticated user can update cases

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Explicitly validate and extract only allowed fields (no mass assignment)
    const allowedFields = [
      'encounter_date',
      'visit_type',
      'chief_complaint',
      'history_of_present_illness',
      'past_medical_history',
      'examination_findings',
      'diagnosis',
      'treatment_plan',
      'medications_prescribed',
      'follow_up_instructions',
      'status',
      'complaints',
      'treatments',
      'diagnostic_tests',
      'vision_data',
      'examination_data'
    ]

    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Validate status if provided
    if (updateData.status) {
      const allowedStatuses = ['active', 'completed', 'cancelled', 'pending']
      if (!allowedStatuses.includes(updateData.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` 
        }, { status: 400 })
      }
    }

    // Validate JSONB fields if provided (basic validation)
    if (updateData.treatments !== undefined && !Array.isArray(updateData.treatments)) {
      return NextResponse.json({ error: 'treatments must be an array' }, { status: 400 })
    }

    if (updateData.complaints !== undefined && !Array.isArray(updateData.complaints)) {
      return NextResponse.json({ error: 'complaints must be an array' }, { status: 400 })
    }

    if (updateData.diagnostic_tests !== undefined && !Array.isArray(updateData.diagnostic_tests)) {
      return NextResponse.json({ error: 'diagnostic_tests must be an array' }, { status: 400 })
    }

    if (updateData.vision_data !== undefined && (typeof updateData.vision_data !== 'object' || Array.isArray(updateData.vision_data))) {
      return NextResponse.json({ error: 'vision_data must be an object' }, { status: 400 })
    }

    if (updateData.examination_data !== undefined && (typeof updateData.examination_data !== 'object' || Array.isArray(updateData.examination_data))) {
      return NextResponse.json({ error: 'examination_data must be an object' }, { status: 400 })
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update case
    const { data: encounter, error } = await supabase
      .from('encounters')
      .update(updateData)
      .eq('id', id)
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
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
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
      message: 'Case updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/cases/[id] - Delete a case (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorization check
  const authCheck = await requirePermission('cases', 'delete')
  if (!authCheck.authorized) {
    return (authCheck as { authorized: false; response: NextResponse }).response
  }
  
  try {
    const supabase = createClient()
    const { id} = await params

    // Authorization check - fetch case first
    const { data: existingCase, error: fetchError } = await supabase
      .from('encounters')
      .select('id, created_by, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Error fetching case:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
    }

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // RBAC check already done above, no additional ownership check needed
    // The requirePermission middleware handles all authorization

    // Soft delete by updating status to cancelled
    const { data: encounter, error } = await supabase
      .from('encounters')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: encounter,
      message: 'Case deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}