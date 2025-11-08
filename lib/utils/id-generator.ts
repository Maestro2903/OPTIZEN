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
 * Generate a unique patient ID
 * Format: PAT-YYYYMMDD-XXXXXX
 * Where XXXXXX is a random alphanumeric string
 */
export async function generatePatientId(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 5
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = generateRandomString(6)
    const patientId = `PAT-${dateStr}-${random}`
    
    // Check if ID already exists
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .eq('patient_id', patientId)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking patient ID uniqueness:', error)
      throw new Error('Failed to generate patient ID')
    }
    
    if (!data) {
      // ID is unique
      return patientId
    }
    
    // Collision detected, try again
    console.warn(`Patient ID collision detected: ${patientId}, attempt ${attempt + 1}/${maxAttempts}`)
  }
  
  throw new Error('Failed to generate unique patient ID after maximum attempts')
}

/**
 * Generate a unique case number
 * Format: CASE-YYYY-XXXXXXXXXX
 * Where XXXXXXXXXX is timestamp + random
 */
export async function generateCaseNumber(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 5
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-8) // Last 8 digits of timestamp
    const random = generateRandomString(4)
    const caseNumber = `CASE-${year}-${timestamp}${random}`
    
    // Check if case number already exists
    const { data, error } = await supabase
      .from('encounters')
      .select('id')
      .eq('case_no', caseNumber)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking case number uniqueness:', error)
      throw new Error('Failed to generate case number')
    }
    
    if (!data) {
      // Case number is unique
      return caseNumber
    }
    
    // Collision detected, try again
    console.warn(`Case number collision detected: ${caseNumber}, attempt ${attempt + 1}/${maxAttempts}`)
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
 * Generate a unique employee ID
 * Format: EMP-YYYY-XXXX
 * Where XXXX is a random alphanumeric string
 */
export async function generateEmployeeId(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 5
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const year = new Date().getFullYear()
    const random = generateRandomString(4)
    const employeeId = `EMP-${year}-${random}`
    
    // Check if ID already exists
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking employee ID uniqueness:', error)
      throw new Error('Failed to generate employee ID')
    }
    
    if (!data) {
      // ID is unique
      return employeeId
    }
    
    // Collision detected, try again
    console.warn(`Employee ID collision detected: ${employeeId}, attempt ${attempt + 1}/${maxAttempts}`)
  }
  
  throw new Error('Failed to generate unique employee ID after maximum attempts')
}

/**
 * Generate a unique operation ID
 * Format: OP-YYYYMMDD-XXXX
 */
export async function generateOperationId(): Promise<string> {
  const supabase = createClient()
  const maxAttempts = 5
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = generateRandomString(4)
    const operationId = `OP-${dateStr}-${random}`
    
    // Check if ID already exists
    const { data, error } = await supabase
      .from('surgeries')
      .select('id')
      .eq('surgery_id', operationId)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking operation ID uniqueness:', error)
      throw new Error('Failed to generate operation ID')
    }
    
    if (!data) {
      // ID is unique
      return operationId
    }
    
    // Collision detected, try again
    console.warn(`Operation ID collision detected: ${operationId}, attempt ${attempt + 1}/${maxAttempts}`)
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
