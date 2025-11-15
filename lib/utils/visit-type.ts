/**
 * Utility functions for determining visit type based on patient history
 */

import { casesApi } from "@/lib/services/api"

/**
 * Determines the visit type for a patient based on their previous visits
 * @param patientId - The patient's ID
 * @returns The visit type: "First", "Follow-up-1", "Follow-up-2", or "Follow-up-3"
 */
export async function determineVisitType(patientId: string): Promise<string> {
  try {
    // Count previous encounters for this patient
    const response = await casesApi.list({
      patient_id: patientId,
      limit: 1, // We only need the count, not the data
      page: 1
    })

    const visitCount = response.pagination?.total || 0

    if (visitCount === 0) return "First"
    if (visitCount === 1) return "Follow-up-1"
    if (visitCount === 2) return "Follow-up-2"
    return "Follow-up-3"
  } catch (error) {
    console.error("Error determining visit type:", error)
    // Default to First if error
    return "First"
  }
}

/**
 * Gets the next visit type in sequence
 */
export function getNextVisitType(currentVisitType: string | undefined): string {
  switch (currentVisitType) {
    case "First":
      return "Follow-up-1"
    case "Follow-up-1":
      return "Follow-up-2"
    case "Follow-up-2":
    case "Follow-up-3":
      return "Follow-up-3"
    default:
      return "First"
  }
}

/**
 * Checks if a visit type is valid
 */
export function isValidVisitType(visitType: string): boolean {
  const validTypes = ["First", "Follow-up-1", "Follow-up-2", "Follow-up-3"]
  return validTypes.includes(visitType)
}
