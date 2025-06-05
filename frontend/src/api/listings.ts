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

  uploadImages: async (id: number, files: File[]): Promise<{ images: any[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post(`/listings/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteImage: async (id: number, imageIndex: number): Promise<void> => {
    await apiClient.delete(`/listings/${id}/images/${imageIndex}`);
  },

  reorderImages: async (id: number, imageOrder: number[]): Promise<{ images: string[] }> => {
    const response = await apiClient.put(`/listings/${id}/images/reorder`, { image_order: imageOrder });
    return response.data;
  },

  getMyListings: async (): Promise<Listing[]> => {
    const response = await apiClient.get('/listings/host/my-listings');
    return response.data;
  },
}; 