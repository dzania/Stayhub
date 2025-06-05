/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true };
};

/**
 * Validate phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate price range
 */
export const isValidPrice = (price: number): boolean => {
  return price > 0 && price <= 10000;
};

/**
 * Validate date range
 */
export const isValidDateRange = (checkIn: Date, checkOut: Date): { isValid: boolean; message?: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (checkIn < today) {
    return { isValid: false, message: 'Check-in date cannot be in the past' };
  }
  
  if (checkOut <= checkIn) {
    return { isValid: false, message: 'Check-out date must be after check-in date' };
  }
  
  const daysDiff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    return { isValid: false, message: 'Booking cannot exceed 365 days' };
  }
  
  return { isValid: true };
};

/**
 * Validate guest count
 */
export const isValidGuestCount = (count: number, maxGuests: number): boolean => {
  return count > 0 && count <= maxGuests;
}; 