/**
 * ETA (Estimated Time of Arrival) computation and formatting
 * Computes delivery estimates based on postal codes
 */

/**
 * Postal code to region mapping (simplified example)
 * In production, use a proper geocoding service or database
 */
const POSTAL_REGIONS: Record<string, string> = {
  // US East Coast
  '10001': 'US-EAST',
  '10002': 'US-EAST',
  '02108': 'US-EAST',
  
  // US West Coast
  '90001': 'US-WEST',
  '94102': 'US-WEST',
  '98101': 'US-WEST',
  
  // US Midwest
  '60601': 'US-MIDWEST',
  '55401': 'US-MIDWEST',
  
  // Default for unknown codes
  'DEFAULT': 'US-CENTRAL',
};

/**
 * Shipping time matrix (in business days)
 */
const SHIPPING_MATRIX: Record<string, Record<string, number>> = {
  'US-EAST': {
    'US-EAST': 2,
    'US-WEST': 5,
    'US-MIDWEST': 3,
    'US-CENTRAL': 3,
  },
  'US-WEST': {
    'US-EAST': 5,
    'US-WEST': 2,
    'US-MIDWEST': 4,
    'US-CENTRAL': 3,
  },
  'US-MIDWEST': {
    'US-EAST': 3,
    'US-WEST': 4,
    'US-MIDWEST': 2,
    'US-CENTRAL': 2,
  },
  'US-CENTRAL': {
    'US-EAST': 3,
    'US-WEST': 3,
    'US-MIDWEST': 2,
    'US-CENTRAL': 2,
  },
};

/**
 * Get region from postal code
 */
function getRegion(postalCode: string): string {
  // Strip to first 5 digits for US zip codes
  const zip5 = postalCode.replace(/[^0-9]/g, '').slice(0, 5);
  return POSTAL_REGIONS[zip5] || POSTAL_REGIONS['DEFAULT'];
}

/**
 * Compute ETA in business days
 * 
 * @param postalFrom - Origin postal/zip code
 * @param postalTo - Destination postal/zip code
 * @returns Estimated delivery in business days
 * 
 * @example
 * ```ts
 * const days = computeEtaDays('90001', '10001'); // CA -> NY = 5 days
 * ```
 */
export function computeEtaDays(postalFrom: string, postalTo: string): number {
  const fromRegion = getRegion(postalFrom);
  const toRegion = getRegion(postalTo);
  
  const matrix = SHIPPING_MATRIX[fromRegion];
  if (!matrix) {
    return 5; // Default fallback
  }
  
  return matrix[toRegion] || 5; // Default fallback
}

/**
 * Add business days to a date (skips weekends)
 * 
 * @param date - Starting date
 * @param days - Number of business days to add
 * @returns New date
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Format ETA as friendly date string
 * 
 * @param postalFrom - Origin postal/zip code
 * @param postalTo - Destination postal/zip code
 * @param locale - Locale for date formatting (default: 'en-US')
 * @returns Formatted ETA string (e.g., "Nov 15, 2025")
 * 
 * @example
 * ```ts
 * const eta = formatEta('90001', '10001'); // "Nov 15, 2025"
 * ```
 */
export function formatEta(
  postalFrom: string,
  postalTo: string,
  locale: string = 'en-US'
): string {
  const days = computeEtaDays(postalFrom, postalTo);
  const etaDate = addBusinessDays(new Date(), days);
  
  return etaDate.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get ETA date object
 * 
 * @param postalFrom - Origin postal/zip code
 * @param postalTo - Destination postal/zip code
 * @returns ETA Date object
 */
export function getEtaDate(postalFrom: string, postalTo: string): Date {
  const days = computeEtaDays(postalFrom, postalTo);
  return addBusinessDays(new Date(), days);
}
