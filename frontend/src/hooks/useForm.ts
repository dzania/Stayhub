import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { isValidEmail, isValidPassword, isValidPhone } from '../utils/validation';

/**
 * Common validation rules for react-hook-form
 */
export const validationRules = {
  email: {
    required: 'Email is required',
    validate: (value: string) => isValidEmail(value) || 'Please enter a valid email address',
  },
  password: {
    required: 'Password is required',
    validate: (value: string) => {
      const result = isValidPassword(value);
      return result.isValid || result.message;
    },
  },
  confirmPassword: (password: string) => ({
    required: 'Please confirm your password',
    validate: (value: string) => value === password || 'Passwords do not match',
  }),
  required: (fieldName: string) => ({
    required: `${fieldName} is required`,
  }),
  phone: {
    validate: (value: string) => !value || isValidPhone(value) || 'Please enter a valid phone number',
  },
  price: {
    required: 'Price is required',
    min: { value: 1, message: 'Price must be greater than 0' },
    max: { value: 10000, message: 'Price cannot exceed $10,000' },
  },
  maxGuests: {
    required: 'Maximum guests is required',
    min: { value: 1, message: 'Must accommodate at least 1 guest' },
    max: { value: 20, message: 'Cannot exceed 20 guests' },
  },
  rating: {
    required: 'Rating is required',
    min: { value: 1, message: 'Rating must be at least 1 star' },
    max: { value: 5, message: 'Rating cannot exceed 5 stars' },
  },
};

/**
 * Hook for user authentication forms (login/register)
 */
export const useAuthForm = <T extends FieldValues>(
  defaultValues?: DefaultValues<T>
): UseFormReturn<T> => {
  return useForm<T>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });
};

/**
 * Hook for listing forms (create/edit listing)
 */
export const useListingForm = <T extends FieldValues>(
  defaultValues?: DefaultValues<T>
): UseFormReturn<T> => {
  return useForm<T>({
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
};

/**
 * Hook for booking forms
 */
export const useBookingForm = <T extends FieldValues>(
  defaultValues?: DefaultValues<T>
): UseFormReturn<T> => {
  return useForm<T>({
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });
};

/**
 * Hook for search forms
 */
export const useSearchForm = <T extends FieldValues>(
  defaultValues?: DefaultValues<T>
): UseFormReturn<T> => {
  return useForm<T>({
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
}; 