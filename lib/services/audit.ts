/**
 * Audit service stub - placeholder for removed audit functionality
 * This file exists to prevent import errors
 */

export const auditService = {
  logActivity: async (data: any) => {
    // Stub - no-op
    return Promise.resolve()
  },
  logFinancialActivity: async (data: any) => {
    // Stub - no-op
    return Promise.resolve()
  },
  logSessionActivity: async (data: any) => {
    // Stub - no-op
    return Promise.resolve()
  },
}

export const auditApiCall = async (fn: () => Promise<any>) => {
  // Stub - just execute the function
  return fn()
}

