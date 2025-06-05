import apiClient from './client';
import { Review, ReviewCreate } from '../types';

export const reviewsApi = {
  createReview: async (reviewData: ReviewCreate): Promise<Review> => {
    const response = await apiClient.post('/reviews/', reviewData);
    return response.data;
  },

  getListingReviews: async (listingId: number): Promise<Review[]> => {
    const response = await apiClient.get(`/reviews/listing/${listingId}`);
    return response.data;
  },

  getHostReviews: async (hostId: number): Promise<Review[]> => {
    const response = await apiClient.get(`/reviews/host/${hostId}`);
    return response.data;
  },

  getMyReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get('/reviews/my-reviews');
    return response.data;
  },

  updateReview: async (id: number, reviewData: Partial<ReviewCreate>): Promise<Review> => {
    const response = await apiClient.put(`/reviews/${id}`, reviewData);
    return response.data;
  },

  deleteReview: async (id: number): Promise<void> => {
    await apiClient.delete(`/reviews/${id}`);
  },
}; 