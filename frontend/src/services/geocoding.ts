interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
  };
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
  };
}

class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly cache = new Map<string, GeocodingResult>();

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim().length === 0) {
      return null;
    }

    const cacheKey = address.toLowerCase().trim();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1',
        addressdetails: '1',
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': 'StayHub-App/1.0', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data: NominatimResponse[] = await response.json();

      if (data.length === 0) {
        return null;
      }

      const result: GeocodingResult = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        address: data[0].address,
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `${latitude},${longitude}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
      });

      const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
        headers: {
          'User-Agent': 'StayHub-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data: NominatimResponse = await response.json();

      const result: GeocodingResult = {
        latitude,
        longitude,
        display_name: data.display_name,
        address: data.address,
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Get coordinates for a city/location name
   */
  async getLocationCoordinates(location: string): Promise<{ latitude: number; longitude: number } | null> {
    const result = await this.geocodeAddress(location);
    if (result) {
      return {
        latitude: result.latitude,
        longitude: result.longitude,
      };
    }
    return null;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const geocodingService = new GeocodingService();
export type { GeocodingResult }; 