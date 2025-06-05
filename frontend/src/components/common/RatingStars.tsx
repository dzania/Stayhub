import React from 'react';
import { Box, Rating as MuiRating, Typography } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  readOnly = false,
  showLabel = false,
  size = 'medium'
}) => {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <MuiRating
        value={value}
        onChange={(_, newValue) => onChange && onChange(newValue || 0)}
        readOnly={readOnly}
        precision={0.5}
        size={size}
        icon={<Star fontSize="inherit" />}
        emptyIcon={<StarBorder fontSize="inherit" />}
      />
      {showLabel && (
        <Typography variant="body2" color="text.secondary">
          {value > 0 ? `${value}/5` : 'No rating'}
        </Typography>
      )}
    </Box>
  );
};

export default RatingStars; 