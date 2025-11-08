// Query Parameter Utilities for handling array parameters

/**
 * Parse query parameter that may be a string or comma-separated array
 * Returns an array of strings
 */
export function parseArrayParam(value: string | null): string[] {
  if (!value) return []
  
  // If value contains comma, split it
  if (value.includes(',')) {
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0)
  }
  
  // Single value
  return [value.trim()].filter(v => v.length > 0)
}

/**
 * Validate array parameter values against an allowlist
 * Returns only valid values
 */
export function validateArrayParam(
  values: string[],
  allowedValues: string[],
  caseSensitive: boolean = false
): string[] {
  if (!caseSensitive) {
    const allowedLower = allowedValues.map(v => v.toLowerCase())
    return values
      .filter(v => allowedLower.includes(v.toLowerCase()))
      .map(v => {
        // Return the canonical value from allowedValues
        const index = allowedLower.indexOf(v.toLowerCase())
        return allowedValues[index]
      })
  }
  
  return values.filter(v => allowedValues.includes(v))
}

/**
 * Parse and validate status parameter
 * Supports both single value and comma-separated array
 */
export function parseStatusParam(
  value: string | null,
  allowedStatuses: string[]
): string[] {
  const values = parseArrayParam(value)
  return validateArrayParam(values, allowedStatuses, false)
}

/**
 * Apply array filter to Supabase query
 * Uses .in() for multiple values, .eq() for single value
 */
export function applyArrayFilter(
  query: any,
  column: string,
  values: string[]
): any {
  if (values.length === 0) return query
  
  if (values.length === 1) {
    return query.eq(column, values[0])
  }
  
  return query.in(column, values)
}

/**
 * Example usage in API routes:
 * 
 * const statusParam = searchParams.get('status') || ''
 * const allowedStatuses = ['active', 'inactive', 'pending']
 * const statusValues = parseStatusParam(statusParam, allowedStatuses)
 * 
 * if (statusValues.length > 0) {
 *   query = applyArrayFilter(query, 'status', statusValues)
 * }
 */
