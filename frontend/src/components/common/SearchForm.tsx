import React from 'react';
import { Grid, Button, Box } from '@mui/material';
import { useSearchForm } from '../../hooks/useForm';
import FormField from './FormField';
import { ListingSearch } from '../../types';

interface SearchFormProps {
  onSearch: (data: ListingSearch) => void;
  initialValues?: ListingSearch;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, initialValues = {} }) => {
  const { control, handleSubmit } = useSearchForm<ListingSearch>(initialValues);

  const handleFormSubmit = (data: ListingSearch) => {
    onSearch(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <FormField
            name="location"
            control={control}
            label="Location"
            placeholder="Where are you going?"
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormField
            name="guests"
            control={control}
            label="Guests"
            type="number"
            inputProps={{ min: 1, max: 20 }}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormField
            name="min_price"
            control={control}
            label="Min Price"
            type="number"
            inputProps={{ min: 0, step: 10 }}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormField
            name="max_price"
            control={control}
            label="Max Price"
            type="number"
            inputProps={{ min: 0, step: 10 }}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ height: '56px' }}
          >
            Search
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SearchForm; 