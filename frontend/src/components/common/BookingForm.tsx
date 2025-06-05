import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { bookingsApi } from '../../api/bookings';
import { Listing, BookingCreate } from '../../types';
import { formatPrice, calculateNights } from '../../utils/formatters';
import { isValidDateRange } from '../../utils/validation';
import { QUERY_KEYS } from '../../constants/queryKeys';
import FormField from './FormField';

interface BookingFormProps {
  listing: Listing;
  onBookingSuccess?: () => void;
}

interface BookingFormData {
  check_in_date: Date | null;
  check_out_date: Date | null;
  guest_count: number;
  special_requests: string;
}

const BookingForm: React.FC<BookingFormProps> = ({ listing, onBookingSuccess }) => {
  const [bookingError, setBookingError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      check_in_date: new Date(),
      check_out_date: addDays(new Date(), 1),
      guest_count: 1,
      special_requests: '',
    },
  });

  const watchedValues = watch();
  const { check_in_date, check_out_date } = watchedValues;

  // Calculate pricing
  const nights = check_in_date && check_out_date ? calculateNights(check_in_date, check_out_date) : 0;
  const totalPrice = nights * listing.price_per_night;

  const createBookingMutation = useMutation({
    mutationFn: bookingsApi.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.MY_BOOKINGS });
      setBookingError('');
      setShowSuccess(true);
      onBookingSuccess?.();
    },
    onError: (error: any) => {
      setBookingError(error.response?.data?.detail || 'Failed to create booking');
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (!data.check_in_date || !data.check_out_date) {
      setBookingError('Please select check-in and check-out dates');
      return;
    }

    // Validate date range
    const dateValidation = isValidDateRange(data.check_in_date, data.check_out_date);
    if (!dateValidation.isValid) {
      setBookingError(dateValidation.message || 'Invalid date range');
      return;
    }

    // Validate guest count
    if (data.guest_count > listing.max_guests) {
      setBookingError(`Maximum ${listing.max_guests} guests allowed`);
      return;
    }

    const bookingData: BookingCreate = {
      listing_id: listing.id,
      check_in_date: format(data.check_in_date, 'yyyy-MM-dd'),
      check_out_date: format(data.check_out_date, 'yyyy-MM-dd'),
      guest_count: data.guest_count,
      special_requests: data.special_requests || undefined,
    };

    createBookingMutation.mutate(bookingData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card sx={{ position: 'sticky', top: 24 }}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {formatPrice(listing.price_per_night)} / night
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Controller
                name="check_in_date"
                control={control}
                rules={{ required: 'Check-in date is required' }}
                render={({ field }) => (
                  <DatePicker
                    label="Check-in"
                    value={field.value}
                    onChange={field.onChange}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.check_in_date,
                        helperText: errors.check_in_date?.message,
                        size: 'small',
                      },
                    }}
                  />
                )}
              />
              <Controller
                name="check_out_date"
                control={control}
                rules={{ required: 'Check-out date is required' }}
                render={({ field }) => (
                  <DatePicker
                    label="Check-out"
                    value={field.value}
                    onChange={field.onChange}
                    minDate={check_in_date ? addDays(check_in_date, 1) : addDays(new Date(), 1)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.check_out_date,
                        helperText: errors.check_out_date?.message,
                        size: 'small',
                      },
                    }}
                  />
                )}
              />
            </Box>

            <FormField
              name="guest_count"
              control={control}
              rules={{
                required: 'Guest count is required',
                min: { value: 1, message: 'At least 1 guest required' },
                max: { value: listing.max_guests, message: `Maximum ${listing.max_guests} guests` },
              }}
              label="Guests"
              type="number"
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />

            <FormField
              name="special_requests"
              control={control}
              label="Special requests (optional)"
              multiline
              rows={3}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />

            {bookingError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {bookingError}
              </Alert>
            )}

            {showSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Booking request submitted successfully! Check your dashboard for updates.
              </Alert>
            )}

            {nights > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {formatPrice(listing.price_per_night)} × {nights} night{nights > 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2">
                      {formatPrice(totalPrice)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <Typography variant="body1">Total</Typography>
                    <Typography variant="body1" color="primary">
                      {formatPrice(totalPrice)}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={createBookingMutation.isPending || nights <= 0}
              sx={{ mt: 1 }}
            >
              {createBookingMutation.isPending ? (
                <CircularProgress size={24} />
              ) : (
                'Reserve'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default BookingForm; 