import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../config/stripe';
import PaymentForm from './PaymentForm';
import { Booking } from '../../types';

interface PaymentWrapperProps {
  booking: Booking;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ booking, onPaymentSuccess, onClose }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm 
        booking={booking} 
        onPaymentSuccess={onPaymentSuccess} 
        onClose={onClose} 
      />
    </Elements>
  );
};

export default PaymentWrapper; 