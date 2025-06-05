from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=schemas.Review)
def create_review(
    review: schemas.ReviewCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get listing
    listing = db.query(models.Listing).filter(models.Listing.id == review.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if user has booked this listing and the booking is completed
    booking = db.query(models.Booking).filter(
        models.Booking.listing_id == review.listing_id,
        models.Booking.customer_id == current_user.id,
        models.Booking.status == "completed"
    ).first()
    
    if not booking:
        raise HTTPException(
            status_code=400, 
            detail="You can only review listings you have booked and completed"
        )
    
    # Check if user has already reviewed this listing
    existing_review = db.query(models.Review).filter(
        models.Review.listing_id == review.listing_id,
        models.Review.reviewer_id == current_user.id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this listing")
    
    # Validate rating
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Create review
    db_review = models.Review(
        **review.dict(),
        reviewer_id=current_user.id,
        host_id=listing.host_id
    )
    
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/listing/{listing_id}", response_model=List[schemas.Review])
def get_listing_reviews(
    listing_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    # Check if listing exists
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return db.query(models.Review).filter(
        models.Review.listing_id == listing_id
    ).offset(skip).limit(limit).all()

@router.get("/host/{host_id}", response_model=List[schemas.Review])
def get_host_reviews(
    host_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    # Check if host exists
    host = db.query(models.User).filter(
        models.User.id == host_id,
        models.User.is_host == True
    ).first()
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")
    
    return db.query(models.Review).filter(
        models.Review.host_id == host_id
    ).offset(skip).limit(limit).all()

@router.get("/my-reviews", response_model=List[schemas.Review])
def get_my_reviews(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Review).filter(
        models.Review.reviewer_id == current_user.id
    ).all()

@router.put("/{review_id}", response_model=schemas.Review)
def update_review(
    review_id: int,
    review_update: schemas.ReviewBase,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user is the reviewer
    if review.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
    
    # Validate rating if provided
    if review_update.rating and (review_update.rating < 1 or review_update.rating > 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Update review
    for field, value in review_update.dict(exclude_unset=True).items():
        setattr(review, field, value)
    
    db.commit()
    db.refresh(review)
    return review

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if user is the reviewer
    if review.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    
    db.delete(review)
    db.commit()
    return {"detail": "Review deleted successfully"} 