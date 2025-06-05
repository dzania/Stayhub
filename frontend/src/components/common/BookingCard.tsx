import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Divider,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { format } from 'date-fns'; // Removed unused import
import { bookingsApi } from '../../api/bookings';
import { Booking } from '../../types';
import { formatPrice, formatDate, calculateNights } from '../../utils/formatters';
import { QUERY_KEYS } from '../../constants/queryKeys';
import ReviewForm from './ReviewForm';

interface BookingCardProps {
  booking: Booking;
  isHost?: boolean;
  onReviewClick?: (booking: Booking) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const BookingCard: React.FC<BookingCardProps> = ({ booking, isHost = false, onReviewClick }) => {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [_statusToUpdate, setStatusToUpdate] = useState<string>('');
  const queryClient = useQueryClient();

  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  const checkInDate = new Date(booking.check_in_date);
  const checkOutDate = new Date(booking.check_out_date);
  const isCompleted = booking.status === 'completed';
  const isPast = checkOutDate < new Date();
  const canCancel = booking.status === 'pending' && checkInDate > new Date();

  const cancelBookingMutation = useMutation({
    mutationFn: bookingsApi.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.MY_BOOKINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.INCOMING });
      setCancelDialogOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      bookingsApi.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.MY_BOOKINGS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.INCOMING });
      setStatusToUpdate('');
    },
  });

  const handleCancel = () => {
    cancelBookingMutation.mutate(booking.id);
  };

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate({ id: booking.id, status });
  };

  const handleReviewClick = () => {
    if (onReviewClick) {
      onReviewClick(booking);
    } else {
      setReviewDialogOpen(true);
    }
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {booking.listing.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {booking.listing.location}
              </Typography>
              {!isHost && (
                <Typography variant="body2" color="text.secondary">
                  Host: {booking.listing.host.first_name} {booking.listing.host.last_name}
                </Typography>
              )}
              {isHost && (
                <Typography variant="body2" color="text.secondary">
                  Guest: {booking.customer.first_name} {booking.customer.last_name}
                </Typography>
              )}
            </Box>
            <Chip
              label={getStatusLabel(booking.status)}
              color={getStatusColor(booking.status) as any}
              size="small"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Check-in
              </Typography>
              <Typography variant="body1">
                {formatDate(booking.check_in_date)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Check-out
              </Typography>
              <Typography variant="body1">
                {formatDate(booking.check_out_date)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Guests
              </Typography>
              <Typography variant="body1">
                {booking.guest_count}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Total ({nights} night{nights > 1 ? 's' : ''})
              </Typography>
              <Typography variant="h6" color="primary">
                {formatPrice(booking.total_price)}
              </Typography>
            </Box>
          </Box>

          {booking.special_requests && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Special requests:
              </Typography>
              <Typography variant="body2">
                {booking.special_requests}
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {isHost && booking.status === 'pending' && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updateStatusMutation.isPending}
                >
                  Confirm
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateStatusMutation.isPending}
                >
                  Decline
                </Button>
              </>
            )}

            {isHost && booking.status === 'confirmed' && isPast && (
              <Button
                variant="contained"
                size="small"
                onClick={() => handleStatusUpdate('completed')}
                disabled={updateStatusMutation.isPending}
              >
                Mark Complete
              </Button>
            )}

            {!isHost && canCancel && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setCancelDialogOpen(true)}
                disabled={cancelBookingMutation.isPending}
              >
                Cancel Booking
              </Button>
            )}

            {!isHost && isCompleted && (
              <Button
                variant="contained"
                size="small"
                onClick={handleReviewClick}
              >
                Write Review
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Booking
          </Button>
          <Button
            onClick={handleCancel}
            color="error"
            disabled={cancelBookingMutation.isPending}
          >
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <ReviewForm
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        listingId={booking.listing.id}
        listingTitle={booking.listing.title}
      />
    </>
  );
};

export default BookingCard; 