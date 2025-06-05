import apiClient from './client';
import { Listing, ListingCreate, ListingWithReviews, ListingSearch } from '../types';

export const listingsApi = {
  getListings: async (params?: ListingSearch): Promise<Listing[]> => {
    const response = await apiClient.get('/listings/', { params });
    return response.data;
  },

  getListing: async (id: number): Promise<ListingWithReviews> => {
    const response = await apiClient.get(`/listings/${id}`);
    return response.data;
  },

  createListing: async (listingData: ListingCreate): Promise<Listing> => {
    const response = await apiClient.post('/listings/', listingData);
    return response.data;
  },

  updateListing: async (id: number, listingData: Partial<ListingCreate>): Promise<Listing> => {
    const response = await apiClient.put(`/listings/${id}`, listingData);
    return response.data;
  },

  deleteListing: async (id: number): Promise<void> => {
    await apiClient.delete(`/listings/${id}`);
  },

  uploadImages: async (id: number, files: FileList): Promise<{ images: string[] }> => {
    const images = await Promise.all(
      Array.from(files).map(file => 
        new Promise<{ filename: string; data: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              filename: file.name,
              data: reader.result as string
            });
          };
          reader.readAsDataURL(file);
        })
      )
    );

    const response = await apiClient.post(`/listings/${id}/images`, { images });
    return response.data;
  },

  getMyListings: async (): Promise<Listing[]> => {
    const response = await apiClient.get('/listings/host/my-listings');
    return response.data;
  },
}; 