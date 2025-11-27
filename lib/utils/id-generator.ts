/**
 * Secure ID Generation Utilities
 * Generates collision-resistant IDs for database records
 * Prevents client-side ID collision issues
 */

import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

/**
 * Generate a secure random string
 */
function generateRandomString(length: number = 6): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomValues = randomBytes(length)
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length]
  }
  
  return result
}

/**
 * Generate a unique patient ID with collision detection
 * Format: PAT-YYYYMMDD-XXXXXX
 * Where XXXXXX is a random alphanumeric string
 * 
 * Checks for existing IDs and retries if collision detected.
 * The actual uniqueness is enforced by the database unique constraint
 * on patients.patient_id, which will cause the insert to fail if a collision
 * occurs (the API route should handle this as a fallback).
 */
export async function generatePatientId(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 10
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = generateRandomString(6)
    const patientId = `PAT-${dateStr}-${random}`
    
    // Check if this patient_id already exists
    const { data, error } = await supabase
      .from('patients')
      .select('patient_id')
      .eq('patient_id', patientId)
      .limit(1)
      .single()
    
    // If no data found, the ID is available
    if (error && error.code === 'PGRST116') {
      // PGRST116 = no rows returned, which means ID is available
      return patientId
    }
    
    // If we got data, the ID exists - retry
    if (data) {
      console.warn(`Patient ID collision detected: ${patientId}, attempt ${attempt + 1}/${maxAttempts}`)
      // Add small delay to ensure different timestamp/random on retry
      await new Promise(resolve => setTimeout(resolve, 10))
      continue
    }
    
    // Other database error - log but continue to retry
    if (error) {
      console.warn(`Error checking patient ID existence: ${error.message}, attempt ${attempt + 1}/${maxAttempts}`)
      // Continue to retry with new ID
      continue
    }
  }
  
  // If we exhausted all attempts, generate one final ID
  // The database unique constraint will catch it if there's still a collision
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = generateRandomString(6)
  return `PAT-${dateStr}-${random}`
}

/**
 * Generate a unique case number - ATOMIC (prevents TOCTOU race)
 * Format: CASE-YYYY-XXXXXXXXXX
 * Where XXXXXXXXXX is timestamp + random
 * 
 * Uses atomic insert-or-fail to prevent race conditions.
 * Requires unique constraint on encounters.case_no.
 */
export async function generateCaseNumber(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 5
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-8) // Last 8 digits of timestamp
    const random = generateRandomString(4)
    const caseNumber = `CASE-${year}-${timestamp}${random}`
    
    // Atomic approach: attempt insert with only case_no
    // This requires a unique constraint on encounters.case_no
    const { data, error } = await supabase
      .from('encounters')
      .insert([{ case_no: caseNumber }])
      .select('case_no')
      .single()
    
    if (!error) {
      // Successfully inserted - case number is guaranteed unique
      return caseNumber
    }
    
    // Check if error is unique constraint violation
    if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
      console.warn(`Case number collision detected: ${caseNumber}, attempt ${attempt + 1}/${maxAttempts}`)
      // Retry with new random case number
      continue
    }
    
    // Other database error - fail immediately
    console.error('Error generating case number:', error)
    throw new Error(`Failed to generate case number: ${error.message}`)
  }
  
  throw new Error('Failed to generate unique case number after maximum attempts')
}

/**
 * Generate a unique invoice number using database sequence (ATOMIC)
 * Format: INV-YYYYMM-NNNNNN
 * Where NNNNNN is a sequential number for the month
 * 
 * Uses PostgreSQL sequence via RPC for atomic generation.
 * Prevents race conditions under concurrent load.
 * Requires migration 015_fix_invoice_sequence.sql
 */
export async function generateInvoiceNumber(): Promise<string> {
  const supabase = createClient()
  const date = new Date()
  const yearMonth = date.toISOString().slice(0, 7).replace('-', '')
  
  try {
    // Call database function for atomic sequence generation
    const { data, error } = await supabase
      .rpc('get_next_invoice_number', { year_month: yearMonth })
    
    if (error) {
      console.error('Error generating invoice number via RPC:', error)
      throw new Error(`Failed to generate invoice number: ${error.message}`)
    }
    
    if (!data) {
      throw new Error('Database function returned null invoice number')
    }
    
    // Validate format INV-YYYYMM-NNNNNN
    const invoiceRegex = /^INV-\d{6}-\d{6}$/
    if (!invoiceRegex.test(data)) {
      throw new Error(`Invalid invoice number format from database: ${data}`)
    }
    
    return data
  } catch (error) {
    console.error('Fatal error in generateInvoiceNumber:', error)
    throw error instanceof Error 
      ? error 
      : new Error('Unknown error generating invoice number')
  }
}

/**
 * Generate a unique employee ID - ATOMIC (prevents TOCTOU race)
 * Format: EMP-YYYY-XXXX
 * Where XXXX is a random alphanumeric string
 * 
 * Uses atomic insert-or-fail to prevent race conditions.
 * Requires unique constraint on employees.employee_id.
 */
export async function generateEmployeeId(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 5
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const year = new Date().getFullYear()
    const random = generateRandomString(4)
    const employeeId = `EMP-${year}-${random}`
    
    // Atomic approach: attempt insert with only employee_id
    // This requires a unique constraint on employees.employee_id
    const { data, error } = await supabase
      .from('employees')
      .insert([{ employee_id: employeeId }])
      .select('employee_id')
      .single()
    
    if (!error) {
      // Successfully inserted - ID is guaranteed unique
      return employeeId
    }
    
    // Check if error is unique constraint violation
    if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
      console.warn(`Employee ID collision detected: ${employeeId}, attempt ${attempt + 1}/${maxAttempts}`)
      // Retry with new random ID
      continue
    }
    
    // Other database error - fail immediately
    console.error('Error generating employee ID:', error)
    throw new Error(`Failed to generate employee ID: ${error.message}`)
  }
  
  throw new Error('Failed to generate unique employee ID after maximum attempts')
}

/**
 * Generate a unique operation ID - ATOMIC (prevents TOCTOU race)
 * Format: OP-YYYYMMDD-XXXX
 * 
 * Uses atomic insert-or-fail to prevent race conditions.
 * Requires unique constraint on surgeries.surgery_id.
 */
export async function generateOperationId(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 5
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = generateRandomString(4)
    const operationId = `OP-${dateStr}-${random}`
    
    // Atomic approach: attempt insert with only surgery_id
    // This requires a unique constraint on surgeries.surgery_id
    const { data, error } = await supabase
      .from('surgeries')
      .insert([{ surgery_id: operationId }])
      .select('surgery_id')
      .single()
    
    if (!error) {
      // Successfully inserted - ID is guaranteed unique
      return operationId
    }
    
    // Check if error is unique constraint violation
    if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
      console.warn(`Operation ID collision detected: ${operationId}, attempt ${attempt + 1}/${maxAttempts}`)
      // Retry with new random ID
      continue
    }
    
    // Other database error - fail immediately
    console.error('Error generating operation ID:', error)
    throw new Error(`Failed to generate operation ID: ${error.message}`)
  }
  
  throw new Error('Failed to generate unique operation ID after maximum attempts')
}

/**
 * Example usage in API routes:
 * 
 * // In POST /api/patients
 * const patient_id = await generatePatientId()
 * const { data, error } = await supabase
 *   .from('patients')
 *   .insert([{ patient_id, ...otherFields }])
 * 
 * // In POST /api/cases
 * const case_no = await generateCaseNumber()
 * const { data, error } = await supabase
 *   .from('encounters')
 *   .insert([{ case_no, ...otherFields }])
 * 
 * // In POST /api/invoices
 * const invoice_number = await generateInvoiceNumber()
 * const { data, error } = await supabase
 *   .from('invoices')
 *   .insert([{ invoice_number, ...otherFields }])
 */
