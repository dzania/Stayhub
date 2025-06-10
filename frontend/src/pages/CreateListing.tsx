import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

import { listingsApi } from '../api/listings';
import { ListingCreate } from '../types';
import { QUERY_KEYS, MUTATION_KEYS } from '../constants/queryKeys';
import ImageUpload, { ImageFile } from '../components/common/ImageUpload';
import GooglePlacesAutocomplete, { PlaceResult } from '../components/common/GooglePlacesAutocomplete';

const steps = ['Basic Info', 'Property Details', 'Amenities & Images'];

const COMMON_AMENITIES = [
  'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 
  'Dedicated workspace', 'TV', 'Hair dryer', 'Iron', 'Pool', 'Hot tub', 
  'Free parking', 'Gym', 'BBQ grill', 'Patio or balcony', 'Garden or backyard',
  'Beach access', 'Fireplace', 'Piano', 'Pool table', 'Fire pit', 'Outdoor shower',
  'Ski-in/Ski-out', 'Beachfront', 'Waterfront', 'Mountain view', 'City skyline view',
  'Bay view', 'Garden view',
];

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [addressError, setAddressError] = useState<string>('');

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<ListingCreate>({
    defaultValues: {
      title: '',
      description: '',
      price_per_night: 0,
      location: '',
      address: '',
      latitude: 0,
      longitude: 0,
      max_guests: 1,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
    },
    mode: 'onChange',
  });

  const createMutation = useMutation({
    mutationKey: [MUTATION_KEYS.LISTINGS.CREATE],
    mutationFn: async (data: ListingCreate) => {
      const newListing = await listingsApi.createListing(data);
      if (selectedImages.length > 0) {
        const imageFiles = selectedImages.map(img => img.file);
        await listingsApi.uploadImages(newListing.id, imageFiles);
      }
      return newListing;
    },
    onSuccess: (newListing) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LISTINGS.MY_LISTINGS });
      navigate(`/listings/${newListing.id}`);
    },
  });

  const getFieldsForStep = (step: number): (keyof ListingCreate)[] => {
    switch (step) {
      case 0:
        return ['title', 'description', 'address'];
      case 1:
        return ['price_per_night', 'max_guests', 'bedrooms', 'bathrooms'];
      default:
        return [];
    }
  };

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeStep === steps.length - 1) {
      // This should not happen as the "Next" button is not rendered on the last step
      return;
    }

    const fieldsToValidate = getFieldsForStep(activeStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveStep((prev) => prev - 1);
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
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

  const onSubmit = (data: ListingCreate) => {
    const extractLocationFromAddress = (address: string): string => {
      const parts = address.split(',').map(part => part.trim());
      return parts.length >= 2 ? parts.slice(-2).join(', ') : address;
    };

    const listingData = {
      ...data,
      location: data.address ? extractLocationFromAddress(data.address) : data.location,
      amenities: selectedAmenities,
    };
    
    createMutation.mutate(listingData);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Tell us about your place</Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                }}
                render={({ field }) => (
                  <TextField {...field} label="Property Title" fullWidth required error={!!errors.title} helperText={errors.title?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Description" fullWidth multiline rows={4} error={!!errors.description} helperText={errors.description?.message} />
                )}
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
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Property details and pricing</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="price_per_night"
                control={control}
                rules={{
                  required: 'Price is required',
                  min: { value: 1, message: 'Price must be a positive number' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Price per night ($)"
                    type="number"
                    fullWidth
                    required
                    error={!!errors.price_per_night}
                    helperText={errors.price_per_night?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="max_guests"
                control={control}
                rules={{
                  required: 'Maximum guests is required',
                  min: { value: 1, message: 'Must accommodate at least 1 guest' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Maximum Guests"
                    type="number"
                    fullWidth
                    required
                    error={!!errors.max_guests}
                    helperText={errors.max_guests?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="bedrooms"
                control={control}
                rules={{
                  required: 'Number of bedrooms is required',
                  min: { value: 0, message: 'Number of bedrooms cannot be negative' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Bedrooms"
                    type="number"
                    fullWidth
                    required
                    error={!!errors.bedrooms}
                    helperText={errors.bedrooms?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="bathrooms"
                control={control}
                rules={{
                  required: 'Number of bathrooms is required',
                  min: { value: 0.5, message: 'Must have at least 0.5 bathrooms' },
                  validate: (value) => Number(value) % 0.5 === 0 || 'Bathrooms must be in increments of 0.5',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Bathrooms"
                    type="number"
                    fullWidth
                    required
                    error={!!errors.bathrooms}
                    helperText={errors.bathrooms?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Amenities</Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {COMMON_AMENITIES.map(amenity => (
                <Chip
                  key={amenity}
                  label={amenity}
                  onClick={() => handleAmenityToggle(amenity)}
                  color={selectedAmenities.includes(amenity) ? 'primary' : 'default'}
                />
              ))}
            </Box>
            <Box display="flex" gap={2} mb={4}>
              <TextField
                label="Custom Amenity"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                variant="outlined"
                size="small"
              />
              <Button onClick={handleAddCustomAmenity} variant="contained" startIcon={<AddIcon />} type="button">Add</Button>
            </Box>
            {selectedAmenities.length > 0 && (
              <Box mb={4}>
                <Typography variant="subtitle1" gutterBottom>Selected Amenities:</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedAmenities.map(amenity => (
                    <Chip
                      key={amenity}
                      label={amenity}
                      onDelete={() => handleRemoveAmenity(amenity)}
                      color="secondary"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <Typography variant="h6" gutterBottom>Upload Images</Typography>
            <ImageUpload images={selectedImages} onImagesChange={setSelectedImages} />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Create New Listing
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Share your space with travelers from around the world
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent>
              {createMutation.isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {createMutation.error instanceof Error ? createMutation.error.message : 'An unexpected error occurred.'}
                </Alert>
              )}
              {renderStepContent(activeStep)}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              type="button"
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <CircularProgress size={24} /> : 'Create Listing'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                type="button"
              >
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateListing; 