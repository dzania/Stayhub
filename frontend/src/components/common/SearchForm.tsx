import React from 'react';
import { Grid, Button, Box } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Controller } from 'react-hook-form';
import { addDays, format } from 'date-fns';
import { useSearchForm } from '../../hooks/useForm';
import FormField from './FormField';
import LocationAutocomplete from './LocationAutocomplete';
import { ListingSearch } from '../../types';

interface SearchFormProps {
  onSearch: (data: ListingSearch) => void;
  initialValues?: ListingSearch;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, initialValues = {} }) => {
  const { control, handleSubmit, watch } = useSearchForm<ListingSearch>(initialValues);
  
  const watchedCheckInDate = watch('check_in_date');

  const handleFormSubmit = (data: ListingSearch) => {
    // Convert dates to string format for API
    const formattedData = {
      ...data,
      check_in_date: data.check_in_date ? format(new Date(data.check_in_date), 'yyyy-MM-dd') : undefined,
      check_out_date: data.check_out_date ? format(new Date(data.check_out_date), 'yyyy-MM-dd') : undefined,
    };
    onSearch(formattedData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2.5}>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <LocationAutocomplete
                  value={field.value || ''}
                  onChange={(value) => field.onChange(value)}
                  label="Location"
                  placeholder="Where are you going?"
                  fullWidth
                  size="medium"
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Controller
              name="check_in_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Check-in"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date)}
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'medium',
                    },
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Controller
              name="check_out_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Check-out"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date)}
                  minDate={watchedCheckInDate ? addDays(new Date(watchedCheckInDate), 1) : addDays(new Date(), 1)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'medium',
                    },
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={1.5}>
            <FormField
              name="guests"
              control={control}
              label="Guests"
              type="number"
              inputProps={{ min: 1, max: 20 }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={1.5}>
            <FormField
              name="min_price"
              control={control}
              label="Min Price"
              type="number"
              inputProps={{ min: 0, step: 10 }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={1.5}>
            <FormField
              name="max_price"
              control={control}
              label="Max Price"
              type="number"
              inputProps={{ min: 0, step: 10 }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={1}>
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
    </LocalizationProvider>
  );
};

export default SearchForm; 