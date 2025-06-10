import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

import { listingsApi } from '../api/listings';
import { ListingCreate, Listing } from '../types';
import { QUERY_KEYS, MUTATION_KEYS } from '../constants/queryKeys';
import ImageUpload, { ImageFile } from '../components/common/ImageUpload';
import GooglePlacesAutocomplete, { PlaceResult } from '../components/common/GooglePlacesAutocomplete';

const COMMON_AMENITIES = [
  'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 
  'Dedicated workspace', 'TV', 'Hair dryer', 'Iron', 'Pool', 'Hot tub', 
  'Free parking', 'Gym', 'BBQ grill', 'Patio or balcony', 'Garden or backyard',
  'Beach access', 'Fireplace', 'Piano', 'Pool table', 'Fire pit', 'Outdoor shower',
  'Ski-in/Ski-out', 'Beachfront', 'Waterfront', 'Mountain view', 'City skyline view',
  'Bay view', 'Garden view',
];

type FormData = Omit<Listing, 'id' | 'host_id' | 'created_at' | 'updated_at'>;


const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listingId = parseInt(id || '0');
  
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [addressError, setAddressError] = useState<string>('');

  const { data: listing, isLoading: isLoadingListing, error: listingError } = useQuery({
    queryKey: QUERY_KEYS.LISTINGS.DETAIL(listingId),
    queryFn: () => listingsApi.getListing(listingId),
    enabled: !!listingId,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormData>();

  useEffect(() => {
    if (listing) {
      const { id, host_id, created_at, updated_at, ...formData } = listing;
      reset(formData);
      setSelectedAmenities(listing.amenities || []);
    }
  }, [listing, reset]);

  const updateMutation = useMutation({
    mutationKey: [MUTATION_KEYS.LISTINGS.UPDATE, listingId],
    mutationFn: async (data: FormData) => {
      const listingUpdateData: ListingCreate = {
        ...data,
        address: data.address || '',
        amenities: selectedAmenities,
      };
      const updatedListing = await listingsApi.updateListing(listingId, listingUpdateData);
      
      if (selectedImages.length > 0) {
        const imageFiles = selectedImages.map(img => img.file);
        await listingsApi.uploadImages(listingId, imageFiles);
      }
      
      return updatedListing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.DETAIL(listingId) });
      navigate(`/listings/${listingId}`);
    },
  });

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      setSelectedAmenities(prev => [...prev, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.filter(a => a !== amenity));
  };
  
  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (isLoadingListing) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      </Container>
    );
  }

  if (listingError || !listing) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load listing for editing. Please try again.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>Edit Listing</Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>Update your listing details</Typography>
      <Paper sx={{ p: 4 }}>
        {updateMutation.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to update listing.'}
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } }}
                render={({ field }) => <TextField {...field} label="Property Title" fullWidth required error={!!errors.title} helperText={errors.title?.message} />}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <TextField {...field} label="Description" fullWidth multiline rows={4} error={!!errors.description} helperText={errors.description?.message} />}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                rules={{ required: 'Full address is required' }}
                render={({ field, fieldState: { error } }) => (
                  <GooglePlacesAutocomplete
                    {...field}
                    value={field.value || ''}
                    label="Full Address"
                    required
                    onPlaceSelect={(place: PlaceResult) => {
                      setValue('address', place.address);
                      setValue('latitude', place.latitude);
                      setValue('longitude', place.longitude);
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}><Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Property Details</Typography></Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="price_per_night"
                control={control}
                rules={{ required: 'Price is required', min: { value: 1, message: 'Price must be a positive number' } }}
                render={({ field }) => (
                  <TextField {...field} label="Price per night ($)" type="number" fullWidth required error={!!errors.price_per_night} helperText={errors.price_per_night?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="max_guests"
                control={control}
                rules={{ required: 'Maximum guests is required', min: { value: 1, message: 'Must accommodate at least 1 guest' } }}
                render={({ field }) => (
                  <TextField {...field} label="Maximum Guests" type="number" fullWidth required error={!!errors.max_guests} helperText={errors.max_guests?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="bedrooms"
                control={control}
                rules={{ required: 'Number of bedrooms is required', min: { value: 0, message: 'Cannot be negative' } }}
                render={({ field }) => (
                  <TextField {...field} label="Bedrooms" type="number" fullWidth required error={!!errors.bedrooms} helperText={errors.bedrooms?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="bathrooms"
                control={control}
                rules={{ required: 'Number of bathrooms is required', min: { value: 0.5, message: 'Must be at least 0.5' }, validate: (v) => v % 0.5 === 0 || 'Must be in increments of 0.5' }}
                render={({ field }) => (
                  <TextField {...field} label="Bathrooms" type="number" fullWidth required error={!!errors.bathrooms} helperText={errors.bathrooms?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                )}
              />
            </Grid>
            <Grid item xs={12}><Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Amenities</Typography></Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {COMMON_AMENITIES.map((amenity) => (
                  <Chip key={amenity} label={amenity} clickable color={selectedAmenities.includes(amenity) ? 'primary' : 'default'} onClick={() => handleAmenityToggle(amenity)} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField value={customAmenity} onChange={(e) => setCustomAmenity(e.target.value)} label="Custom amenity" fullWidth onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(); } }} />
                <Button variant="outlined" onClick={handleAddCustomAmenity} disabled={!customAmenity.trim()} startIcon={<AddIcon />}>Add</Button>
              </Box>
            </Grid>
            {selectedAmenities.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Selected Amenities ({selectedAmenities.length})</Typography>
                <Card variant="outlined"><CardContent><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedAmenities.map((amenity) => (
                    <Chip key={amenity} label={amenity} color="primary" onDelete={() => handleRemoveAmenity(amenity)} />
                  ))}
                </Box></CardContent></Card>
              </Grid>
            )}
            <Grid item xs={12}><Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Add New Images</Typography></Grid>
            <Grid item xs={12}>
              <ImageUpload images={selectedImages} onImagesChange={setSelectedImages} maxImages={10} maxFileSize={10} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button variant="outlined" onClick={() => navigate(`/listings/${listingId}`)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <CircularProgress size={20} /> : 'Update Listing'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default EditListing; 