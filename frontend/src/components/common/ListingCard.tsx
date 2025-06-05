import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Listing } from '../../types';
import { formatPrice, formatGuestCount, truncateText } from '../../utils/formatters';
import RatingStars from './RatingStars';

interface ListingCardProps {
  listing: Listing & { average_rating?: number; reviews?: any[] };
  onClick?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  onClick,
}) => {
  const averageRating = listing.average_rating || 0;
  const reviewCount = listing.reviews?.length || 0;

  return (
    <Card
      sx={{ 
        cursor: onClick ? 'pointer' : 'default', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        } : {},
      }}
      onClick={onClick}
    >
      <CardMedia
        component="img"
        height={200}
        image={listing.images?.[0] || '/placeholder-image.jpg'}
        alt={listing.title}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            fontSize: '1.1rem',
            lineHeight: 1.3,
          }}
        >
          {truncateText(listing.title, 50)}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 1 }}
        >
          {listing.location}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <RatingStars 
            value={averageRating} 
            readOnly 
            size="small"
          />
          <Typography variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
            {averageRating > 0 ? `(${averageRating.toFixed(1)})` : ''}
            {reviewCount > 0 && ` · ${reviewCount} review${reviewCount > 1 ? 's' : ''}`}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mt: 'auto' 
        }}>
          <Typography 
            variant="h6" 
            color="primary" 
            sx={{ fontWeight: 600 }}
          >
            {formatPrice(listing.price_per_night)}/night
          </Typography>
          <Chip 
            label={formatGuestCount(listing.max_guests)} 
            size="small" 
            variant="outlined" 
            color="primary"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ListingCard; 