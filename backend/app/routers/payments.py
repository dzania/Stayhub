from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from ..services.stripe_service import StripeService
import logging

router = APIRouter(prefix="/payments", tags=["Payments"])
logger = logging.getLogger(__name__)

@router.post("/create-payment-intent", response_model=schemas.PaymentIntentResponse)
def create_payment_intent(
    payment_request: schemas.PaymentIntentCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Payment Intent for a booking"""
    # Get booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == payment_request.booking_id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user owns this booking
    if booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this booking")
    
    # Check if booking is in correct status
    if booking.status not in ["pending", "confirmed"]:
        raise HTTPException(status_code=400, detail="Booking cannot be paid in current status")
    
    # Check if already has payment intent
    if booking.stripe_payment_intent_id and booking.payment_status not in ["failed", "canceled"]:
        raise HTTPException(status_code=400, detail="Payment already initiated for this booking")
    
    try:
        # Create payment intent
        payment_intent = StripeService.create_payment_intent(
            booking=booking,
            customer_email=current_user.email,
            customer_name=f"{current_user.first_name} {current_user.last_name}"
        )
        
        # Update booking with payment intent ID
        booking.stripe_payment_intent_id = payment_intent['payment_intent_id']
        booking.payment_status = "processing"
        db.commit()
        
        return schemas.PaymentIntentResponse(**payment_intent)
        
    except Exception as e:
        logger.error(f"Failed to create payment intent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")

@router.post("/confirm-payment")
def confirm_payment(
    confirmation: schemas.PaymentConfirmation,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Confirm payment after successful Stripe payment"""
    # Find booking by payment intent ID
    booking = db.query(models.Booking).filter(
        models.Booking.stripe_payment_intent_id == confirmation.payment_intent_id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found for this payment")
    
    # Check if user owns this booking
    if booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Confirm payment with Stripe
        payment_details = StripeService.confirm_payment(confirmation.payment_intent_id)
        
        if payment_details['status'] == 'succeeded':
            # Update booking status
            booking.payment_status = "paid"
            booking.status = "confirmed"
            booking.payment_method = payment_details.get('payment_method', 'card')
            db.commit()
            
            return {"detail": "Payment confirmed successfully", "booking_id": booking.id}
        else:
            booking.payment_status = "failed"
            db.commit()
            raise HTTPException(status_code=400, detail=f"Payment failed: {payment_details['status']}")
            
    except Exception as e:
        logger.error(f"Failed to confirm payment: {str(e)}")
        booking.payment_status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to confirm payment: {str(e)}")

@router.post("/refund", response_model=schemas.RefundResponse)
def create_refund(
    refund_request: schemas.RefundRequest,
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    """Create a refund for a booking (host only)"""
    # Get booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == refund_request.booking_id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if current user is the host of the listing
    listing = db.query(models.Listing).filter(
        models.Listing.id == booking.listing_id
    ).first()
    
    if not listing or listing.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only listing host can issue refunds")
    
    # Check if booking is paid
    if booking.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Cannot refund unpaid booking")
    
    # Check if payment intent exists
    if not booking.stripe_payment_intent_id:
        raise HTTPException(status_code=400, detail="No payment found for this booking")
    
    try:
        # Create refund
        refund_details = StripeService.create_refund(
            payment_intent_id=booking.stripe_payment_intent_id,
            amount=refund_request.amount
        )
        
        # Update booking
        refund_amount = refund_details['amount']
        booking.refund_amount += refund_amount
        
        # If full refund, update payment status
        if booking.refund_amount >= booking.total_price:
            booking.payment_status = "refunded"
            booking.status = "cancelled"
        
        db.commit()
        
        return schemas.RefundResponse(**refund_details)
        
    except Exception as e:
        logger.error(f"Failed to create refund: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create refund: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature")
):
    """Handle Stripe webhooks"""
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    
    payload = await request.body()
    
    try:
        event = StripeService.construct_webhook_event(payload, stripe_signature)
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        await handle_payment_succeeded(payment_intent)
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        await handle_payment_failed(payment_intent)
    elif event['type'] == 'charge.dispute.created':
        dispute = event['data']['object']
        await handle_dispute_created(dispute)
    else:
        logger.info(f"Unhandled event type: {event['type']}")
    
    return {"status": "success"}

async def handle_payment_succeeded(payment_intent):
    """Handle successful payment webhook"""
    from ..database import SessionLocal
    
    db = SessionLocal()
    try:
        booking = db.query(models.Booking).filter(
            models.Booking.stripe_payment_intent_id == payment_intent['id']
        ).first()
        
        if booking and booking.payment_status != "paid":
            booking.payment_status = "paid"
            booking.status = "confirmed"
            db.commit()
            logger.info(f"Payment confirmed via webhook for booking {booking.id}")
    finally:
        db.close()

async def handle_payment_failed(payment_intent):
    """Handle failed payment webhook"""
    from ..database import SessionLocal
    
    db = SessionLocal()
    try:
        booking = db.query(models.Booking).filter(
            models.Booking.stripe_payment_intent_id == payment_intent['id']
        ).first()
        
        if booking:
            booking.payment_status = "failed"
            db.commit()
            logger.info(f"Payment failed via webhook for booking {booking.id}")
    finally:
        db.close()

async def handle_dispute_created(dispute):
    """Handle dispute created webhook"""
    logger.warning(f"Dispute created for charge: {dispute['charge']}")
    # You can implement additional logic here like notifying admins

@router.get("/booking/{booking_id}/payment-status")
def get_payment_status(
    booking_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get payment status for a booking"""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking.customer_id != current_user.id:
        # Check if user is the host
        listing = db.query(models.Listing).filter(
            models.Listing.id == booking.listing_id
        ).first()
        if not listing or listing.host_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "booking_id": booking.id,
        "payment_status": booking.payment_status,
        "payment_method": booking.payment_method,
        "total_price": booking.total_price,
        "refund_amount": booking.refund_amount,
        "stripe_payment_intent_id": booking.stripe_payment_intent_id
    } 