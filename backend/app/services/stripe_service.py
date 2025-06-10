import stripe
from typing import Dict, Optional
from decimal import Decimal
from ..config import settings
from .. import models

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class StripeService:
    
    @staticmethod
    def create_payment_intent(
        booking: models.Booking,
        customer_email: str,
        customer_name: str
    ) -> Dict:
        """Create a Stripe Payment Intent for a booking"""
        try:
            # Convert price to cents (Stripe uses smallest currency unit)
            amount_cents = int(booking.total_price * 100)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                payment_method_types=['card'],
                metadata={
                    'booking_id': str(booking.id),
                    'customer_id': str(booking.customer_id),
                    'listing_id': str(booking.listing_id)
                },
                description=f'Payment for booking #{booking.id}',
                receipt_email=customer_email,
                statement_descriptor='STAYHUB BOOKING'
            )
            
            return {
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': booking.total_price,
                'currency': 'usd'
            }
            
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    def confirm_payment(payment_intent_id: str) -> Dict:
        """Confirm a payment intent"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                'status': intent.status,
                'payment_method': intent.charges.data[0].payment_method_details.type if intent.charges.data else None,
                'amount_received': intent.amount_received / 100  # Convert back from cents
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    def create_refund(payment_intent_id: str, amount: Optional[float] = None) -> Dict:
        """Create a refund for a payment"""
        try:
            refund_data = {'payment_intent': payment_intent_id}
            if amount:
                refund_data['amount'] = int(amount * 100)  # Convert to cents
            
            refund = stripe.Refund.create(**refund_data)
            
            return {
                'refund_id': refund.id,
                'status': refund.status,
                'amount': refund.amount / 100  # Convert back from cents
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}")
    
    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
        """Construct and verify webhook event"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError:
            raise Exception("Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise Exception("Invalid signature")
    
    @staticmethod
    def get_payment_methods(customer_id: str) -> Dict:
        """Get customer's payment methods"""
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card"
            )
            return {
                'payment_methods': [
                    {
                        'id': pm.id,
                        'card': pm.card,
                        'created': pm.created
                    } for pm in payment_methods.data
                ]
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Stripe error: {str(e)}") 