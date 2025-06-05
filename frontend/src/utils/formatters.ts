/**
 * Format price as currency
 */
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

/**
 * Format guest count with proper pluralization
 */
export const formatGuestCount = (count: number): string => {
  return `${count} ${count === 1 ? 'guest' : 'guests'}`;
};

/**
 * Format room count with proper pluralization
 */
export const formatRoomCount = (bedrooms: number, bathrooms: number): string => {
  const bedroomText = `${bedrooms} ${bedrooms === 1 ? 'bedroom' : 'bedrooms'}`;
  const bathroomText = `${bathrooms} ${bathrooms === 1 ? 'bathroom' : 'bathrooms'}`;
  return `${bedroomText} • ${bathroomText}`;
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Calculate number of nights between dates
 */
export const calculateNights = (checkIn: string | Date, checkOut: string | Date): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}; 