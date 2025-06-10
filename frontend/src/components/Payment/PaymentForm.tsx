import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import { paymentsApi } from '../../api/payments';
import { Booking } from '../../types';

interface PaymentFormProps {
  booking: Booking;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentForm: React.FC<PaymentFormProps> = ({ booking, onPaymentSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create payment intent
      const paymentIntentResponse = await paymentsApi.createPaymentIntent(booking.id);

      // 2. Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentResponse.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${booking.customer.first_name} ${booking.customer.last_name}`,
              email: booking.customer.email,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // 3. Confirm payment with our backend
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        await paymentsApi.confirmPayment({
          payment_intent_id: paymentIntent.id,
          payment_method: 'card'
        });

        setSuccess(true);
        setIsProcessing(false);
        
        // Call success callback after a short delay
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="success.main" gutterBottom>
          Payment Successful! 🎉
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your booking has been confirmed. You will receive a confirmation email shortly.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Complete Your Payment
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Booking: {booking.listing.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dates: {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
        </Typography>
        <Typography variant="h6" sx={{ mt: 1 }}>
          Total: ${booking.total_price.toFixed(2)}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Card Details
          </Typography>
          <Box
            sx={{
              p: 2,
              border: '1px solid #ccc',
              borderRadius: 1,
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
              },
            }}
          >
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!stripe || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : null}
          >
            {isProcessing ? 'Processing...' : `Pay $${booking.total_price.toFixed(2)}`}
          </Button>
        </Box>
      </form>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Secured by Stripe. Your payment information is encrypted and secure.
        </Typography>
      </Box>
    </Paper>
  );
};

export default PaymentForm; 