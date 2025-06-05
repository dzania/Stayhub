import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  Skeleton,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../../api/reviews';
import { Review } from '../../types';
import { formatDate } from '../../utils/formatters';
import { QUERY_KEYS } from '../../constants/queryKeys';
import RatingStars from './RatingStars';

interface ReviewListProps {
  listingId: number;
  limit?: number;
}

const ReviewSkeleton: React.FC = () => (
  <Paper sx={{ p: 3, mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Skeleton variant="circular" width={48} height={48} />
      <Box sx={{ ml: 2, flex: 1 }}>
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="text" width="60%" height={20} />
      </Box>
    </Box>
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="60%" />
  </Paper>
);

const ReviewItem: React.FC<{ review: Review }> = ({ review }) => {
  const reviewerName = `${review.reviewer.first_name} ${review.reviewer.last_name}`;
  const reviewerInitials = `${review.reviewer.first_name[0]}${review.reviewer.last_name[0]}`;

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Avatar
          src={review.reviewer.profile_image}
          alt={reviewerName}
          sx={{ width: 48, height: 48, mr: 2 }}
        >
          {reviewerInitials}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {reviewerName}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <RatingStars value={review.rating} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(review.created_at)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {review.comment && (
        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
          {review.comment}
        </Typography>
      )}
    </Paper>
  );
};

const ReviewList: React.FC<ReviewListProps> = ({ listingId, limit }) => {
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.REVIEWS.BY_LISTING(listingId),
    queryFn: () => reviewsApi.getListingReviews(listingId),
  });

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">
          Failed to load reviews
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        {Array.from({ length: 3 }).map((_, index) => (
          <ReviewSkeleton key={index} />
        ))}
      </Box>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No reviews yet. Be the first to review!
        </Typography>
      </Box>
    );
  }

  const displayedReviews = limit ? reviews.slice(0, limit) : reviews;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Reviews ({reviews.length})
      </Typography>
      
      {displayedReviews.map((review, index) => (
        <ReviewItem key={review.id} review={review} />
      ))}
      
      {limit && reviews.length > limit && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body1" color="text.secondary" align="center">
            Showing {limit} of {reviews.length} reviews
          </Typography>
        </>
      )}
    </Box>
  );
};

export default ReviewList; 