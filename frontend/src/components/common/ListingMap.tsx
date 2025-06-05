import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodingService } from '../../services/geocoding';

// Fix for default markers in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface ListingMapProps {
  latitude?: number;
  longitude?: number;
  title: string;
  address?: string;
  location: string;
  height?: number | string;
}

const ListingMap: React.FC<ListingMapProps> = ({
  latitude,
  longitude,
  title,
  address,
  location,
  height = 400,
}) => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Default coordinates (New York City) if no coordinates provided
  const defaultLat = 40.7128;
  const defaultLng = -74.0060;

  const hasValidCoordinates = latitude && longitude;

  useEffect(() => {
    const initializeCoordinates = async () => {
      if (hasValidCoordinates) {
        setCoordinates({ lat: latitude!, lng: longitude! });
        return;
      }

      // Try to geocode the address or location
      const addressToGeocode = address || location;
      if (!addressToGeocode) {
        setCoordinates({ lat: defaultLat, lng: defaultLng });
        return;
      }

      setIsGeocoding(true);
      setGeocodingError(null);

      try {
        const result = await geocodingService.geocodeAddress(addressToGeocode);
        if (result) {
          setCoordinates({ lat: result.latitude, lng: result.longitude });
        } else {
          setCoordinates({ lat: defaultLat, lng: defaultLng });
          setGeocodingError('Could not find coordinates for this location');
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
        setCoordinates({ lat: defaultLat, lng: defaultLng });
        setGeocodingError('Failed to geocode address');
      } finally {
        setIsGeocoding(false);
      }
    };

    initializeCoordinates();
  }, [latitude, longitude, address, location, hasValidCoordinates]);

  if (!coordinates) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocationOn color="primary" />
          <Typography variant="h6">
            Location
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  const { lat, lng } = coordinates;

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocationOn color="primary" />
        <Typography variant="h6">
          Location
        </Typography>
      </Box>

      {isGeocoding && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            Finding location coordinates...
          </Box>
        </Alert>
      )}

      {geocodingError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {geocodingError}. Showing approximate location.
        </Alert>
      )}

      {!hasValidCoordinates && !geocodingError && !isGeocoding && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {address || location ? 'Location found via address lookup.' : 'Approximate location shown. Exact coordinates not available.'}
        </Alert>
      )}

      <Box sx={{ height, borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <MapContainer
          center={[lat, lng]}
          zoom={hasValidCoordinates ? 15 : 10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]}>
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {title}
                </Typography>
                {address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {address}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                  {location}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        </MapContainer>
      </Box>

      <Box>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
          {location}
        </Typography>
        {address && (
          <Typography variant="body2" color="text.secondary">
            {address}
          </Typography>
        )}
        {!hasValidCoordinates && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This is an approximate location for privacy and security purposes.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ListingMap; 