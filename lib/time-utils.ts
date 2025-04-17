/**
 * Formats duration input by automatically adding colons between sets of numbers
 * Supports both mm:ss and hh:mm:ss formats
 */
export function formatDurationInput(numericValue: string): string {
  if (!numericValue) return ""

  // Handle different input lengths
  if (numericValue.length <= 2) {
    // Just seconds
    return numericValue
  } else if (numericValue.length <= 4) {
    // mm:ss format
    const seconds = numericValue.slice(-2)
    const minutes = numericValue.slice(0, -2)
    return `${minutes}:${seconds}`
  } else {
    // hh:mm:ss format
    const seconds = numericValue.slice(-2)
    const minutes = numericValue.slice(-4, -2)
    const hours = numericValue.slice(0, -4)
    return `${hours}:${minutes}:${seconds}`
  }
}

/**
 * Converts a time string to minutes for calculations
 * Supports both mm:ss and hh:mm:ss formats
 */
export function convertTimeToMinutes(timeString: string): number {
  if (!timeString) return 0

  const parts = timeString.split(":")

  // Handle mm:ss format
  if (parts.length === 2) {
    const minutes = Number.parseInt(parts[0], 10) || 0
    const seconds = Number.parseInt(parts[1], 10) || 0
    return minutes + seconds / 60
  }

  // Handle hh:mm:ss format
  if (parts.length === 3) {
    const hours = Number.parseInt(parts[0], 10) || 0
    const minutes = Number.parseInt(parts[1], 10) || 0
    const seconds = Number.parseInt(parts[2], 10) || 0
    return hours * 60 + minutes + seconds / 60
  }

  // If it's just a number, treat as seconds
  if (parts.length === 1 && timeString.trim() !== "") {
    const seconds = Number.parseInt(timeString, 10) || 0
    return seconds / 60
  }

  return 0
}

/**
 * Formats a time string to ensure it's in the correct format
 * This is a legacy function kept for compatibility
 */
export function formatTimeString(input: string): string {
  // Remove any non-digit or non-colon characters
  const cleaned = input.replace(/[^\d:]/g, "")

  // Split by colons
  const parts = cleaned.split(":")

  // If we have more than 3 parts, take only the first 3
  if (parts.length > 3) {
    parts.length = 3
  }

  // Pad each part to ensure proper format
  const formatted = parts.map((part, index) => {
    // For hours (first position), allow any number
    if (index === 0) {
      return part.padStart(2, "0")
    }
    // For minutes and seconds, ensure they're between 0-59
    const num = Number.parseInt(part, 10)
    if (isNaN(num) || num > 59) {
      return "00"
    }
    return num.toString().padStart(2, "0")
  })

  // If we have less than 3 parts, pad with zeros
  while (formatted.length < 3) {
    formatted.push("00")
  }

  return formatted.join(":")
}
