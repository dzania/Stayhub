import React from 'react';
import { Grid, Button, Box, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Controller, useForm } from 'react-hook-form';
import { addDays, format } from 'date-fns';
import LocationAutocomplete from './LocationAutocomplete';
import { ListingSearch } from '../../types';

interface SearchFormProps {
  onSearch: (data: ListingSearch) => void;
  initialValues?: ListingSearch;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, initialValues = {} }) => {
  const { control, handleSubmit, watch } = useForm<ListingSearch>({ defaultValues: initialValues });
  
  const watchedCheckInDate = watch('check_in_date');

  const handleFormSubmit = (data: ListingSearch) => {
    const formattedData: Partial<ListingSearch> = { ...data };
    
    if (data.check_in_date) {
      formattedData.check_in_date = format(new Date(data.check_in_date), 'yyyy-MM-dd');
    }
    if (data.check_out_date) {
      formattedData.check_out_date = format(new Date(data.check_out_date), 'yyyy-MM-dd');
    }
    
    onSearch(formattedData as ListingSearch);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
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
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Controller
              name="check_in_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Check-in"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date)}
                  minDate={new Date()}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Controller
              name="check_out_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Check-out"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date)}
                  minDate={watchedCheckInDate ? addDays(new Date(watchedCheckInDate), 1) : addDays(new Date(), 1)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={1.5}>
            <Controller
                name="guests"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Guests"
                        type="number"
                        fullWidth
                        inputProps={{ min: 1 }}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                    />
                )}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={1.5}>
            <Controller
                name="min_price"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Min Price"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                )}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={1}>
            <Controller
                name="max_price"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Max Price"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                )}
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