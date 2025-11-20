/**
 * Formats a date string to 'MMM DD, YYYY' format (e.g., 'Nov 20, 2025')
 * Returns '--' if the date is invalid or null
 * 
 * @param dateString - Date string, Date object, or undefined
 * @returns Formatted date string or '--' for invalid/missing dates
 */
export function formatDate(dateString: string | Date | undefined | null): string {
  // Return '--' if dateString is null, undefined, or empty string
  if (!dateString) {
    return '--'
  }

  try {
    // Create Date object
    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '--'
    }

    // Format as 'MMM DD, YYYY' (e.g., 'Nov 20, 2025')
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  } catch (error) {
    // Return '--' on any error
    return '--'
  }
}

