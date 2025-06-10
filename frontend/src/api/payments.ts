import apiClient from './client';
import { PaymentIntentResponse, PaymentConfirmation, RefundRequest, RefundResponse, PaymentStatus } from '../types';

export const paymentsApi = {
  createPaymentIntent: async (bookingId: number): Promise<PaymentIntentResponse> => {
    const response = await apiClient.post('/payments/create-payment-intent', {
      booking_id: bookingId
    });
    return response.data;
  },

  confirmPayment: async (confirmation: PaymentConfirmation): Promise<{ detail: string; booking_id: number }> => {
    const response = await apiClient.post('/payments/confirm-payment', confirmation);
    return response.data;
  },

  createRefund: async (refundData: RefundRequest): Promise<RefundResponse> => {
    const response = await apiClient.post('/payments/refund', refundData);
    return response.data;
  },

  getPaymentStatus: async (bookingId: number): Promise<PaymentStatus> => {
    const response = await apiClient.get(`/payments/booking/${bookingId}/payment-status`);
    return response.data;
  },
}; 