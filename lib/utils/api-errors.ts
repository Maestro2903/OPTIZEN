import { NextResponse } from 'next/server'

/**
 * Standardized error response utility for API routes
 * Provides consistent error formatting with context and helpful messages
 */

export interface ApiErrorOptions {
  message?: string
  statusCode?: number
  errorCode?: string
  details?: string | string[]
  hint?: string
  context?: Record<string, any>
  originalError?: Error | unknown
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(options: ApiErrorOptions = {}): NextResponse {
  const {
    message = 'An error occurred',
    statusCode = 500,
    errorCode,
    details,
    hint,
    context,
    originalError
  } = options

  // Log error for debugging
  if (originalError) {
    console.error('API Error:', {
      message,
      statusCode,
      errorCode,
      details,
      hint,
      context,
      originalError: originalError instanceof Error ? {
        message: originalError.message,
        stack: originalError.stack,
        name: originalError.name
      } : originalError
    })
  }

  const responseBody: any = {
    success: false,
    error: message
  }

  if (errorCode) {
    responseBody.errorCode = errorCode
  }

  if (details) {
    responseBody.details = Array.isArray(details) ? details : [details]
  }

  if (hint) {
    responseBody.hint = hint
  }

  if (context && Object.keys(context).length > 0) {
    responseBody.context = context
  }

  return NextResponse.json(responseBody, { status: statusCode })
}

/**
 * Handle database errors with specific messages
 */
export function handleDatabaseError(
  error: unknown,
  operation: string,
  resource: string = 'resource'
): NextResponse {
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code?: string; message?: string; details?: string; constraint?: string }

    // Handle specific PostgreSQL error codes
    switch (dbError.code) {
      case '23505': // Unique constraint violation
        const fieldName = extractFieldName(dbError.constraint || dbError.details || 'field')
        return createErrorResponse({
          message: `${fieldName} already exists`,
          statusCode: 409,
          errorCode: 'DUPLICATE_ENTRY',
          hint: `The ${fieldName} you're trying to use is already in use. Please choose a different value.`,
          context: { operation, resource, constraint: dbError.constraint },
          originalError: error
        })

      case '23503': // Foreign key constraint violation
        return createErrorResponse({
          message: `Cannot ${operation} ${resource}: referenced record does not exist`,
          statusCode: 400,
          errorCode: 'FOREIGN_KEY_VIOLATION',
          hint: 'The operation references data that does not exist. Please check related records.',
          context: { operation, resource, constraint: dbError.constraint },
          originalError: error
        })

      case '23514': // Check constraint violation
        return createErrorResponse({
          message: `Invalid data for ${resource}: validation constraint failed`,
          statusCode: 400,
          errorCode: 'VALIDATION_FAILED',
          hint: 'The data provided does not meet the required validation rules.',
          context: { operation, resource, constraint: dbError.constraint },
          originalError: error
        })

      case 'PGRST116': // Not found
      case '42P01': // Table does not exist
        return createErrorResponse({
          message: `${resource} not found`,
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          hint: `The ${resource} you're looking for does not exist.`,
          context: { operation, resource },
          originalError: error
        })

      case '42501': // Insufficient privilege
        return createErrorResponse({
          message: `Permission denied for ${operation} ${resource}`,
          statusCode: 403,
          errorCode: 'PERMISSION_DENIED',
          hint: 'You do not have the necessary permissions to perform this operation.',
          context: { operation, resource },
          originalError: error
        })

      case '08006': // Connection failure
        return createErrorResponse({
          message: 'Database connection error',
          statusCode: 503,
          errorCode: 'DATABASE_UNAVAILABLE',
          hint: 'Unable to connect to the database. Please try again later.',
          context: { operation, resource },
          originalError: error
        })

      default:
        return createErrorResponse({
          message: `Database error: ${dbError.message || 'Unknown database error'}`,
          statusCode: 500,
          errorCode: 'DATABASE_ERROR',
          hint: 'An error occurred while accessing the database. Please try again.',
          context: { operation, resource, code: dbError.code },
          originalError: error
        })
    }
  }

  // Fallback for unknown error types
  return createErrorResponse({
    message: `Failed to ${operation} ${resource}`,
    statusCode: 500,
    errorCode: 'UNKNOWN_ERROR',
    hint: 'An unexpected error occurred. Please try again.',
    context: { operation, resource },
    originalError: error
  })
}

/**
 * Extract field name from constraint or error details
 */
function extractFieldName(constraintOrDetails: string): string {
  // Try to extract a human-readable field name
  const patterns = [
    /_(email|username|employee_id|patient_id|invoice_number|case_no|bed_number|phone)_/i,
    /key \(([^)]+)\)/i,
    /unique constraint "([^"]+)"/i
  ]

  for (const pattern of patterns) {
    const match = constraintOrDetails.match(pattern)
    if (match) {
      const field = match[1] || match[0]
      // Convert snake_case to Title Case
      return field
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  }

  // Fallback to generic message
  return 'Field'
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  errors: Array<{ path: string[] | number[]; message: string }> | string,
  operation: string,
  resource: string = 'resource'
): NextResponse {
  if (typeof errors === 'string') {
    return createErrorResponse({
      message: errors,
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      hint: 'Please check your input and try again.',
      context: { operation, resource }
    })
  }

  const details = errors.map(err => {
    const path = Array.isArray(err.path) ? err.path.join('.') : String(err.path)
    return `${path}: ${err.message}`
  })

  return createErrorResponse({
    message: 'Validation failed',
    statusCode: 400,
    errorCode: 'VALIDATION_ERROR',
    details,
    hint: 'Please correct the errors and try again.',
    context: { operation, resource }
  })
}

/**
 * Handle authentication errors
 */
export function handleAuthError(
  message: string = 'Unauthorized',
  hint: string = 'Please authenticate to access this resource.'
): NextResponse {
  return createErrorResponse({
    message,
    statusCode: 401,
    errorCode: 'UNAUTHORIZED',
    hint
  })
}

/**
 * Handle authorization errors
 */
export function handleAuthorizationError(
  operation: string,
  resource: string = 'resource',
  hint: string = 'You do not have permission to perform this operation.'
): NextResponse {
  return createErrorResponse({
    message: `Forbidden: Cannot ${operation} ${resource}`,
    statusCode: 403,
    errorCode: 'FORBIDDEN',
    hint,
    context: { operation, resource }
  })
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(
  resource: string = 'Resource',
  id?: string
): NextResponse {
  return createErrorResponse({
    message: `${resource}${id ? ` with ID ${id}` : ''} not found`,
    statusCode: 404,
    errorCode: 'NOT_FOUND',
    hint: `The ${resource.toLowerCase()} you're looking for does not exist.`,
    context: { resource, id }
  })
}

/**
 * Handle generic server errors with context
 */
export function handleServerError(
  error: unknown,
  operation: string,
  resource: string = 'resource'
): NextResponse {
  const message = error instanceof Error ? error.message : 'Internal server error'
  
  return createErrorResponse({
    message: `Failed to ${operation} ${resource}: ${message}`,
    statusCode: 500,
    errorCode: 'INTERNAL_ERROR',
    hint: 'An unexpected error occurred. Please try again later or contact support if the problem persists.',
    context: { operation, resource },
    originalError: error
  })
}

