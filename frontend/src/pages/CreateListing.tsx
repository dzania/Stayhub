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
import { listingsApi } from '../api/listings';
import { ListingCreate } from '../types';
import { useListingForm } from '../hooks/useForm';
import { QUERY_KEYS, MUTATION_KEYS } from '../constants/queryKeys';
import FormField from '../components/common/FormField';
import ImageUpload, { ImageFile } from '../components/common/ImageUpload';
import { geocodingService } from '../services/geocoding';

const steps = ['Basic Info', 'Property Details', 'Amenities & Images'];

const COMMON_AMENITIES = [
  'WiFi',
  'Kitchen',
  'Washer',
  'Dryer',
  'Air conditioning',
  'Heating',
  'Dedicated workspace',
  'TV',
  'Hair dryer',
  'Iron',
  'Pool',
  'Hot tub',
  'Free parking',
  'Gym',
  'BBQ grill',
  'Patio or balcony',
  'Garden or backyard',
  'Beach access',
  'Fireplace',
  'Piano',
  'Pool table',
  'Fire pit',
  'Outdoor shower',
  'Ski-in/Ski-out',
  'Beachfront',
  'Waterfront',
  'Mountain view',
  'City skyline view',
  'Bay view',
  'Garden view',
];

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);

  const {
    control,
    handleSubmit,
    trigger,
  } = useListingForm<ListingCreate>({
    title: '',
    description: '',
    price_per_night: 0,
    location: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    max_guests: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
  });

  const createMutation = useMutation({
    mutationKey: [MUTATION_KEYS.LISTINGS.CREATE],
    mutationFn: async (data: ListingCreate) => {
      // First create the listing
      const newListing = await listingsApi.createListing(data);
      
      // Then upload images if any
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

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getFieldsForStep = (step: number): (keyof ListingCreate)[] => {
    switch (step) {
      case 0:
        return ['title', 'description', 'location', 'address'];
      case 1:
        return ['price_per_night', 'max_guests', 'bedrooms', 'bathrooms'];
      case 2:
        return [];
      default:
        return [];
    }
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

  const onSubmit = async (data: ListingCreate) => {
    let listingData = {
      ...data,
      amenities: selectedAmenities,
    };

    // If coordinates are not provided but we have an address or location, try to geocode
    if (!data.latitude && !data.longitude && (data.address || data.location)) {
      try {
        const addressToGeocode = data.address || data.location;
        const coordinates = await geocodingService.getLocationCoordinates(addressToGeocode);
        if (coordinates) {
          listingData = {
            ...listingData,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          };
        }
      } catch (error) {
        console.error('Failed to geocode address:', error);
        // Continue without coordinates
      }
    }

    createMutation.mutate(listingData);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tell us about your place
              </Typography>
            </Grid>
                         <Grid item xs={12}>
               <FormField
                 name="title"
                 control={control}
                 label="Property Title"
                 placeholder="Beautiful downtown apartment with city view"
                 required
                 rules={{
                   required: 'Title is required',
                   minLength: { value: 10, message: 'Title must be at least 10 characters' },
                   maxLength: { value: 100, message: 'Title must be less than 100 characters' },
                 }}
               />
             </Grid>
             <Grid item xs={12}>
               <FormField
                 name="description"
                 control={control}
                 label="Description"
                 placeholder="Describe your space, what makes it special, and what guests can expect..."
                 multiline
                 rows={4}
                 rules={{
                   maxLength: { value: 1000, message: 'Description must be less than 1000 characters' },
                 }}
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <FormField
                 name="location"
                 control={control}
                 label="City/Area"
                 placeholder="New York, NY"
                 required
                 rules={{
                   required: 'Location is required',
                 }}
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <FormField
                 name="address"
                 control={control}
                 label="Full Address (Optional)"
                 placeholder="123 Main St, New York, NY 10001"
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <FormField
                 name="latitude"
                 control={control}
                 label="Latitude (Optional)"
                 type="number"
                 placeholder="40.7128"
                 rules={{
                   min: { value: -90, message: 'Latitude must be between -90 and 90' },
                   max: { value: 90, message: 'Latitude must be between -90 and 90' },
                 }}
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <FormField
                 name="longitude"
                 control={control}
                 label="Longitude (Optional)"
                 type="number"
                 placeholder="-74.0060"
                 rules={{
                   min: { value: -180, message: 'Longitude must be between -180 and 180' },
                   max: { value: 180, message: 'Longitude must be between -180 and 180' },
                 }}
               />
             </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Property details and pricing
              </Typography>
            </Grid>
                         <Grid item xs={12} md={6}>
               <FormField
                 name="price_per_night"
                 control={control}
                 label="Price per night ($)"
                 type="number"
                 required
                 rules={{
                   required: 'Price is required',
                   min: { value: 1, message: 'Price must be at least $1' },
                   max: { value: 10000, message: 'Price must be less than $10,000' },
                 }}
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <FormField
                 name="max_guests"
                 control={control}
                 label="Maximum Guests"
                 type="number"
                 required
                 rules={{
                   required: 'Maximum guests is required',
                   min: { value: 1, message: 'Must accommodate at least 1 guest' },
                   max: { value: 50, message: 'Maximum 50 guests allowed' },
                 }}
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <FormField
                 name="bedrooms"
                 control={control}
                 label="Bedrooms"
                 type="number"
                 required
                 rules={{
                   required: 'Number of bedrooms is required',
                   min: { value: 0, message: 'Cannot be negative' },
                   max: { value: 20, message: 'Maximum 20 bedrooms' },
                 }}
               />
             </Grid>
             <Grid item xs={12} md={6}>
               <FormField
                 name="bathrooms"
                 control={control}
                 label="Bathrooms"
                 type="number"
                 required
                 rules={{
                   required: 'Number of bathrooms is required',
                   min: { value: 0.5, message: 'Must have at least 0.5 bathrooms' },
                   max: { value: 20, message: 'Maximum 20 bathrooms' },
                   validate: (value: any) => {
                     const num = Number(value);
                     return num % 0.5 === 0 || 'Bathrooms must be in increments of 0.5';
                   },
                 }}
               />
             </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Amenities and features
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select all amenities that apply to your property. These help guests find the perfect place for their stay.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Popular Amenities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {COMMON_AMENITIES.map((amenity) => (
                  <Chip
                    key={amenity}
                    label={amenity}
                    clickable
                    color={selectedAmenities.includes(amenity) ? 'primary' : 'default'}
                    variant={selectedAmenities.includes(amenity) ? 'filled' : 'outlined'}
                    onClick={() => handleAmenityToggle(amenity)}
                    sx={{
                      '&:hover': {
                        backgroundColor: selectedAmenities.includes(amenity) 
                          ? 'primary.dark' 
                          : 'action.hover',
                      },
                    }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Add Custom Amenity
              </Typography>
                             <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                 <TextField
                   value={customAmenity}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomAmenity(e.target.value)}
                   label="Custom amenity"
                   placeholder="e.g., Rooftop terrace, Wine cellar"
                   fullWidth
                   onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       handleAddCustomAmenity();
                     }
                   }}
                 />
                 <Button
                   variant="outlined"
                   onClick={handleAddCustomAmenity}
                   disabled={!customAmenity.trim()}
                   startIcon={<AddIcon />}
                 >
                   Add
                 </Button>
               </Box>
            </Grid>

            {selectedAmenities.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Amenities ({selectedAmenities.length})
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedAmenities.map((amenity) => (
                        <Chip
                          key={amenity}
                          label={amenity}
                          color="primary"
                          onDelete={() => handleRemoveAmenity(amenity)}
                          deleteIcon={<DeleteIcon />}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
                Property Images
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add photos to showcase your property. The first image will be the main photo guests see.
              </Typography>
              <ImageUpload
                images={selectedImages}
                onImagesChange={setSelectedImages}
                maxImages={10}
                maxFileSize={10}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Create New Listing
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Share your space with travelers from around the world
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {createMutation.isError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {createMutation.error instanceof Error 
              ? createMutation.error.message 
              : 'Failed to create listing. Please try again.'}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
                startIcon={createMutation.isPending ? <CircularProgress size={20} /> : null}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Listing'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
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