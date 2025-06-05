from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/bookings", tags=["Bookings"])

def calculate_total_price(listing: models.Listing, check_in_date: datetime, check_out_date: datetime) -> float:
    """Calculate total price for a booking"""
    nights = (check_out_date - check_in_date).days
    return nights * listing.price_per_night

def check_availability(db: Session, listing_id: int, check_in_date: datetime, check_out_date: datetime) -> bool:
    """Check if listing is available for given dates"""
    conflicting_bookings = db.query(models.Booking).filter(
        and_(
            models.Booking.listing_id == listing_id,
            models.Booking.status.in_(["pending", "confirmed"]),
            or_(
                and_(
                    models.Booking.check_in_date <= check_in_date,
                    models.Booking.check_out_date > check_in_date
                ),
                and_(
                    models.Booking.check_in_date < check_out_date,
                    models.Booking.check_out_date >= check_out_date
                ),
                and_(
                    models.Booking.check_in_date >= check_in_date,
                    models.Booking.check_out_date <= check_out_date
                )
            )
        )
    ).first()
    
    return conflicting_bookings is None

@router.post("/", response_model=schemas.Booking)
def create_booking(
    booking: schemas.BookingCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get listing
    listing = db.query(models.Listing).filter(models.Listing.id == booking.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if not listing.is_active:
        raise HTTPException(status_code=400, detail="Listing is not active")
    
    # Check if user is trying to book their own listing
    if listing.host_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot book your own listing")
    
    # Validate dates
    if booking.check_in_date >= booking.check_out_date:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date")
    
    if booking.check_in_date < datetime.now():
        raise HTTPException(status_code=400, detail="Check-in date cannot be in the past")
    
    # Check guest count
    if booking.guest_count > listing.max_guests:
        raise HTTPException(
            status_code=400, 
            detail=f"Guest count exceeds maximum capacity of {listing.max_guests}"
        )
    
    # Check availability
    if not check_availability(db, booking.listing_id, booking.check_in_date, booking.check_out_date):
        raise HTTPException(status_code=400, detail="Listing is not available for selected dates")
    
    # Calculate total price
    total_price = calculate_total_price(listing, booking.check_in_date, booking.check_out_date)
    
    # Create booking
    db_booking = models.Booking(
        **booking.dict(),
        customer_id=current_user.id,
        total_price=total_price
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

@router.get("/my-bookings", response_model=List[schemas.Booking])
def get_my_bookings(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Booking).filter(models.Booking.customer_id == current_user.id).all()

@router.get("/host/incoming", response_model=List[schemas.Booking])
def get_incoming_bookings(
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    return db.query(models.Booking).join(models.Listing).filter(
        models.Listing.host_id == current_user.id
    ).all()

@router.get("/{booking_id}", response_model=schemas.Booking)
def get_booking(
    booking_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user is authorized to view this booking
    if booking.customer_id != current_user.id:
        # Check if user is the host of the listing
        listing = db.query(models.Listing).filter(models.Listing.id == booking.listing_id).first()
        if not listing or listing.host_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    return booking

@router.put("/{booking_id}/status", response_model=schemas.Booking)
def update_booking_status(
    booking_id: int,
    booking_update: schemas.BookingUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get listing to check if user is the host
    listing = db.query(models.Listing).filter(models.Listing.id == booking.listing_id).first()
    
    # Only host can update booking status, customer can cancel
    if booking.customer_id == current_user.id:
        # Customer can only cancel
        if booking_update.status and booking_update.status != "cancelled":
            raise HTTPException(status_code=403, detail="Customers can only cancel bookings")
    elif listing and listing.host_id == current_user.id:
        # Host can update status
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    # Update booking
    for field, value in booking_update.dict(exclude_unset=True).items():
        setattr(booking, field, value)
    
    db.commit()
    db.refresh(booking)
    return booking

@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only customer can cancel their own booking
    if booking.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
    # Check if booking can be cancelled (not in the past)
    if booking.check_in_date < datetime.now():
        raise HTTPException(status_code=400, detail="Cannot cancel past bookings")
    
    booking.status = "cancelled"
    db.commit()
    
    return {"detail": "Booking cancelled successfully"} 