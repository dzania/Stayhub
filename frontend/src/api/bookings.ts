import apiClient from './client';
import { Booking, BookingCreate } from '../types';

export const bookingsApi = {
  createBooking: async (bookingData: BookingCreate): Promise<Booking> => {
    const response = await apiClient.post('/bookings/', bookingData);
    return response.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get('/bookings/my-bookings');
    return response.data;
  },

  getIncomingBookings: async (): Promise<Booking[]> => {
    const response = await apiClient.get('/bookings/host/incoming');
    return response.data;
  },

  getBooking: async (id: number): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  updateBookingStatus: async (id: number, status: string): Promise<Booking> => {
    const response = await apiClient.put(`/bookings/${id}/status`, { status });
    return response.data;
  },

  cancelBooking: async (id: number): Promise<void> => {
    await apiClient.delete(`/bookings/${id}`);
  },
}; 