/**
 * Services Index - Central export point for all API services
 *
 * This file exports all service instances and types for easy importing
 * throughout the application.
 */

// Export API client
export { apiClient, ApiClient } from './api-client'

// Export all services
export { patientService, PatientService } from './patient.service'
export { appointmentService, AppointmentService } from './appointment.service'
export { billingService, BillingService } from './billing.service'
export { userService, UserService } from './user.service'

// Export types for type safety
export type {
  Patient,
  Appointment,
  User,
  Invoice
} from './api-client'

// Service configuration and utilities
export const serviceConfig = {
  // Default pagination settings
  pagination: {
    defaultLimit: 10,
    maxLimit: 100
  },

  // Default date formats
  dateFormats: {
    api: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
    display: 'MMM dd, yyyy',
    time: 'HH:mm'
  },

  // Error handling settings
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000, // milliseconds
    timeoutDuration: 10000 // milliseconds
  }
}

/**
 * Initialize all services
 * Call this function when the app starts to ensure services are ready
 */
export async function initializeServices(): Promise<boolean> {
  try {
    // Import apiClient within the function to avoid circular dependencies
    const { apiClient } = await import('./api-client')
    // Check if user is authenticated
    const isAuthenticated = await apiClient.isAuthenticated()

    if (process.env.NODE_ENV === 'development') {
      console.log('Services initialized successfully')
      console.log('Authentication status:', isAuthenticated)
    }

    return true
  } catch (error) {
    console.error('Failed to initialize services:', error)
    return false
  }
}

/**
 * Health check for all services
 * Useful for monitoring and debugging
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'down'
  services: Record<string, boolean>
  timestamp: string
}> {
  const timestamp = new Date().toISOString()
  const services: Record<string, boolean> = {}

  try {
    // Import apiClient within the function to avoid circular dependencies
    const { apiClient } = await import('./api-client')
    // Test each service
    services.auth = await apiClient.isAuthenticated()
    services.patients = true // Could add specific health checks here
    services.appointments = true
    services.billing = true
    services.users = true

    const allHealthy = Object.values(services).every(status => status)
    const someHealthy = Object.values(services).some(status => status)

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'down',
      services,
      timestamp
    }
  } catch (error) {
    return {
      status: 'down',
      services,
      timestamp
    }
  }
}