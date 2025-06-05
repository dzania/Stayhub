import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Divider,
  ImageList,
  ImageListItem,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  LocationOn,
  People,
  Bed,
  Bathtub,
  Star,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../api/listings';
import { QUERY_KEYS } from '../constants/queryKeys';
import { formatPrice, formatRoomCount } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import BookingForm from '../components/common/BookingForm';
import ReviewList from '../components/common/ReviewList';
import RatingStars from '../components/common/RatingStars';

const ListingDetailSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 4 }} />
    
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rectangular" height={400} sx={{ mb: 3 }} />
        <Skeleton variant="text" width="100%" height={24} />
        <Skeleton variant="text" width="100%" height={24} />
        <Skeleton variant="text" width="80%" height={24} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rectangular" height={300} />
      </Grid>
    </Grid>
  </Container>
);

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const listingId = parseInt(id || '0');

  const { data: listing, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.LISTINGS.DETAIL(listingId),
    queryFn: () => listingsApi.getListing(listingId),
    enabled: !!listingId,
  });

  if (isLoading) {
    return <ListingDetailSkeleton />;
  }

  if (error || !listing) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load listing details. Please try again.
        </Alert>
      </Container>
    );
  }

  const isOwner = user?.id === listing.host.id;
  const canBook = user && !isOwner && !user.is_host;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          {listing.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {listing.average_rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <RatingStars value={listing.average_rating} readOnly size="small" />
              <Typography variant="body2">
                {listing.average_rating.toFixed(1)} · {listing.reviews?.length || 0} reviews
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body1">
              {listing.location}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Hosted by {listing.host.first_name} {listing.host.last_name}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Image Gallery */}
          {listing.images && listing.images.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <ImageList sx={{ height: 450 }} cols={3} rowHeight={150}>
                {listing.images.slice(0, 6).map((image, index) => (
                  <ImageListItem
                    key={index}
                    cols={index === 0 ? 2 : 1}
                    rows={index === 0 ? 2 : 1}
                  >
                    <img
                      src={image}
                      alt={`${listing.title} - Image ${index + 1}`}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {/* Property Details */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <People fontSize="small" color="action" />
                <Typography>
                  {listing.max_guests} guests
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Bed fontSize="small" color="action" />
                <Typography>
                  {listing.bedrooms} bedroom{listing.bedrooms > 1 ? 's' : ''}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Bathtub fontSize="small" color="action" />
                <Typography>
                  {listing.bathrooms} bathroom{listing.bathrooms > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              About this place
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
              {listing.description || 'No description available.'}
            </Typography>

            {listing.address && (
              <>
                <Typography variant="h6" gutterBottom>
                  Location
                </Typography>
                <Typography variant="body1" paragraph>
                  {listing.address}
                </Typography>
              </>
            )}

            {listing.amenities && listing.amenities.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Amenities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {listing.amenities.map((amenity, index) => (
                    <Chip
                      key={index}
                      label={amenity}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Reviews Section */}
          <Box sx={{ mb: 4 }}>
            <ReviewList listingId={listing.id} />
          </Box>
        </Grid>

        {/* Booking Sidebar */}
        <Grid item xs={12} md={4}>
          {canBook ? (
            <BookingForm listing={listing} />
          ) : isOwner ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Listing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This is your listing. You cannot book your own property.
              </Typography>
            </Paper>
          ) : !user ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {formatPrice(listing.price_per_night)} / night
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please log in to make a booking.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {formatPrice(listing.price_per_night)} / night
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Only customers can make bookings. Please register as a customer to book this property.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ListingDetail; 