import React, { useRef, useEffect, useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

// Define the structure for the selected place object
export interface PlaceResult {
  address: string;
  latitude: number;
  longitude: number;
}

// Define the props for the component
interface GooglePlacesAutocompleteProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  ...rest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API key is not configured.");
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      setIsApiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsApiLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isApiLoaded && inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'geometry.location'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address && place.geometry?.location) {
          const result: PlaceResult = {
            address: place.formatted_address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
          };
          onPlaceSelect(result);
          onChange(result.address); // Also update the field value
        }
      });
    }
  }, [isApiLoaded, onPlaceSelect, onChange]);

  return (
    <TextField
      {...rest}
      inputRef={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={!isApiLoaded || rest.disabled}
      helperText={!isApiLoaded ? "Loading Google Maps..." : rest.helperText}
    />
  );
};

export default GooglePlacesAutocomplete; 