import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { reviewsApi } from '../../api/reviews';
import { ReviewCreate } from '../../types';
import { QUERY_KEYS } from '../../constants/queryKeys';
import FormField from './FormField';
import RatingStars from './RatingStars';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  open,
  onClose,
  listingId,
  listingTitle,
}) => {
  const [submitError, setSubmitError] = useState<string>('');
  const queryClient = useQueryClient();

  const { control, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ReviewFormData>({
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const watchedRating = watch('rating');

  const createReviewMutation = useMutation({
    mutationFn: reviewsApi.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEWS.BY_LISTING(listingId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEWS.MY_REVIEWS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.DETAIL(listingId) });
      setSubmitError('');
      reset();
      onClose();
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.detail || 'Failed to submit review');
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    if (data.rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    const reviewData: ReviewCreate = {
      listing_id: listingId,
      rating: data.rating,
      comment: data.comment || undefined,
    };

    createReviewMutation.mutate(reviewData);
  };

  const handleClose = () => {
    if (!createReviewMutation.isPending) {
      reset();
      setSubmitError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Review your stay
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {listingTitle}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              Rating *
            </Typography>
            <RatingStars
              value={watchedRating}
              onChange={(value) => setValue('rating', value)}
              size="large"
            />
            {errors.rating && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {errors.rating.message}
              </Typography>
            )}
          </Box>

          <FormField
            name="comment"
            control={control}
            label="Your review (optional)"
            multiline
            rows={4}
            fullWidth
            placeholder="Share your experience with other guests..."
            sx={{ mb: 2 }}
          />

          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={createReviewMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={createReviewMutation.isPending || watchedRating === 0}
        >
          {createReviewMutation.isPending ? (
            <CircularProgress size={20} />
          ) : (
            'Submit Review'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewForm; 