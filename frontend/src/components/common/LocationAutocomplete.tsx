import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { LocationOn } from '@mui/icons-material';

interface LocationAutocompleteProps {
  value?: string;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

// Popular cities and locations - in a real app, this could come from an API
interface LocationOption {
  city: string;
  country: string;
  label: string;
}

const POPULAR_LOCATIONS: LocationOption[] = [
  { city: 'New York', country: 'United States', label: 'New York, NY, USA' },
  { city: 'Los Angeles', country: 'United States', label: 'Los Angeles, CA, USA' },
  { city: 'Chicago', country: 'United States', label: 'Chicago, IL, USA' },
  { city: 'Miami', country: 'United States', label: 'Miami, FL, USA' },
  { city: 'San Francisco', country: 'United States', label: 'San Francisco, CA, USA' },
  { city: 'Las Vegas', country: 'United States', label: 'Las Vegas, NV, USA' },
  { city: 'Seattle', country: 'United States', label: 'Seattle, WA, USA' },
  { city: 'Boston', country: 'United States', label: 'Boston, MA, USA' },
  { city: 'Washington', country: 'United States', label: 'Washington, DC, USA' },
  { city: 'Orlando', country: 'United States', label: 'Orlando, FL, USA' },
  
  { city: 'London', country: 'United Kingdom', label: 'London, England, UK' },
  { city: 'Paris', country: 'France', label: 'Paris, France' },
  { city: 'Rome', country: 'Italy', label: 'Rome, Italy' },
  { city: 'Barcelona', country: 'Spain', label: 'Barcelona, Spain' },
  { city: 'Amsterdam', country: 'Netherlands', label: 'Amsterdam, Netherlands' },
  { city: 'Berlin', country: 'Germany', label: 'Berlin, Germany' },
  { city: 'Prague', country: 'Czech Republic', label: 'Prague, Czech Republic' },
  { city: 'Vienna', country: 'Austria', label: 'Vienna, Austria' },
  { city: 'Dublin', country: 'Ireland', label: 'Dublin, Ireland' },
  { city: 'Copenhagen', country: 'Denmark', label: 'Copenhagen, Denmark' },
  
  { city: 'Tokyo', country: 'Japan', label: 'Tokyo, Japan' },
  { city: 'Kyoto', country: 'Japan', label: 'Kyoto, Japan' },
  { city: 'Seoul', country: 'South Korea', label: 'Seoul, South Korea' },
  { city: 'Bangkok', country: 'Thailand', label: 'Bangkok, Thailand' },
  { city: 'Singapore', country: 'Singapore', label: 'Singapore' },
  { city: 'Hong Kong', country: 'Hong Kong', label: 'Hong Kong' },
  { city: 'Dubai', country: 'UAE', label: 'Dubai, United Arab Emirates' },
  { city: 'Istanbul', country: 'Turkey', label: 'Istanbul, Turkey' },
  { city: 'Mumbai', country: 'India', label: 'Mumbai, India' },
  { city: 'Delhi', country: 'India', label: 'Delhi, India' },
  
  { city: 'Sydney', country: 'Australia', label: 'Sydney, Australia' },
  { city: 'Melbourne', country: 'Australia', label: 'Melbourne, Australia' },
  { city: 'Auckland', country: 'New Zealand', label: 'Auckland, New Zealand' },
  
  { city: 'Toronto', country: 'Canada', label: 'Toronto, ON, Canada' },
  { city: 'Vancouver', country: 'Canada', label: 'Vancouver, BC, Canada' },
  { city: 'Montreal', country: 'Canada', label: 'Montreal, QC, Canada' },
  
  { city: 'Mexico City', country: 'Mexico', label: 'Mexico City, Mexico' },
  { city: 'Cancun', country: 'Mexico', label: 'Cancun, Mexico' },
  { city: 'Buenos Aires', country: 'Argentina', label: 'Buenos Aires, Argentina' },
  { city: 'Rio de Janeiro', country: 'Brazil', label: 'Rio de Janeiro, Brazil' },
  { city: 'São Paulo', country: 'Brazil', label: 'São Paulo, Brazil' },
  
  { city: 'Cairo', country: 'Egypt', label: 'Cairo, Egypt' },
  { city: 'Cape Town', country: 'South Africa', label: 'Cape Town, South Africa' },
  { city: 'Marrakech', country: 'Morocco', label: 'Marrakech, Morocco' },
];

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value = '',
  onChange,
  label = 'Location',
  placeholder = 'Where are you going?',
  fullWidth = false,
  size = 'medium',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<LocationOption[]>([]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue);
    
    if (newInputValue.length === 0) {
      setOptions([]);
      return;
    }

    // Filter locations based on input
    const filteredOptions = POPULAR_LOCATIONS.filter((location) =>
      location.label.toLowerCase().includes(newInputValue.toLowerCase()) ||
      location.city.toLowerCase().includes(newInputValue.toLowerCase()) ||
      location.country.toLowerCase().includes(newInputValue.toLowerCase())
    ).slice(0, 10); // Limit to 10 results

    setOptions(filteredOptions);
  };

  const handleValueChange = (
    event: React.SyntheticEvent, 
    newValue: string | LocationOption | null
  ) => {
    if (newValue && typeof newValue === 'object') {
      onChange(newValue.label);
    } else if (typeof newValue === 'string') {
      onChange(newValue);
    } else {
      onChange(null);
    }
  };

  const selectedValue = POPULAR_LOCATIONS.find(option => option.label === value) || null;

  return (
    <Autocomplete
      value={selectedValue}
      onChange={handleValueChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
      freeSolo
      fullWidth={fullWidth}
      size={size}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          fullWidth={fullWidth}
          size={size}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <LocationOn color="action" sx={{ mr: 1 }} />
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <LocationOn color="action" sx={{ mr: 2 }} />
          <Box>
            <Typography variant="body1">
              {option.city}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {option.country}
            </Typography>
          </Box>
        </Box>
      )}
      filterOptions={(x) => x} // We handle filtering manually
      noOptionsText="No locations found"
    />
  );
};

export default LocationAutocomplete; 