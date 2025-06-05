from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
import os
import uuid
from .. import models, schemas, auth
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/listings", tags=["Listings"])

def save_base64_image(base64_data: str, filename: str) -> str:
    """Save base64 encoded image and return the file path"""
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)
    
    # Remove base64 header if present
    if "," in base64_data:
        base64_data = base64_data.split(",")[1]
    
    file_extension = filename.split(".")[-1] if "." in filename else "jpg"
    file_name = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_name)
    
    # Decode and save the image
    import base64
    with open(file_path, "wb") as f:
        f.write(base64.b64decode(base64_data))
    
    return f"/uploads/{file_name}"

@router.get("/", response_model=List[schemas.Listing])
def get_listings(
    skip: int = 0,
    limit: int = 20,
    location: Optional[str] = None,
    check_in_date: Optional[datetime] = None,
    check_out_date: Optional[datetime] = None,
    guests: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Listing).filter(models.Listing.is_active == True)
    
    # Apply filters
    if location:
        query = query.filter(models.Listing.location.ilike(f"%{location}%"))
    
    if guests:
        query = query.filter(models.Listing.max_guests >= guests)
    
    if min_price:
        query = query.filter(models.Listing.price_per_night >= min_price)
    
    if max_price:
        query = query.filter(models.Listing.price_per_night <= max_price)
    
    # Check availability if dates provided
    if check_in_date and check_out_date:
        unavailable_listings = db.query(models.Booking.listing_id).filter(
            and_(
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
        ).subquery()
        
        query = query.filter(~models.Listing.id.in_(unavailable_listings))
    
    return query.offset(skip).limit(limit).all()

@router.get("/{listing_id}", response_model=schemas.ListingWithReviews)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Calculate average rating
    reviews = db.query(models.Review).filter(models.Review.listing_id == listing_id).all()
    average_rating = sum(review.rating for review in reviews) / len(reviews) if reviews else None
    
    listing_dict = schemas.Listing.from_orm(listing).dict()
    listing_dict["reviews"] = reviews
    listing_dict["average_rating"] = average_rating
    
    return schemas.ListingWithReviews(**listing_dict)

@router.post("/", response_model=schemas.Listing)
def create_listing(
    listing: schemas.ListingCreate,
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    db_listing = models.Listing(**listing.dict(), host_id=current_user.id)
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return db_listing

@router.put("/{listing_id}", response_model=schemas.Listing)
def update_listing(
    listing_id: int,
    listing_update: schemas.ListingUpdate,
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    db_listing = db.query(models.Listing).filter(
        models.Listing.id == listing_id,
        models.Listing.host_id == current_user.id
    ).first()
    
    if not db_listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    for field, value in listing_update.dict(exclude_unset=True).items():
        setattr(db_listing, field, value)
    
    db.commit()
    db.refresh(db_listing)
    return db_listing

@router.delete("/{listing_id}")
def delete_listing(
    listing_id: int,
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    db_listing = db.query(models.Listing).filter(
        models.Listing.id == listing_id,
        models.Listing.host_id == current_user.id
    ).first()
    
    if not db_listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    db.delete(db_listing)
    db.commit()
    return {"detail": "Listing deleted successfully"}

@router.post("/{listing_id}/images")
def upload_listing_images(
    listing_id: int,
    images_data: schemas.ImageUpload,
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    db_listing = db.query(models.Listing).filter(
        models.Listing.id == listing_id,
        models.Listing.host_id == current_user.id
    ).first()
    
    if not db_listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    image_urls = []
    for image_data in images_data.images:
        # Decode base64 image and save
        image_url = save_base64_image(image_data.data, image_data.filename)
        image_urls.append(image_url)
    
    # Update listing images
    current_images = db_listing.images or []
    current_images.extend(image_urls)
    db_listing.images = current_images
    
    db.commit()
    db.refresh(db_listing)
    
    return {"detail": "Images uploaded successfully", "images": image_urls}

@router.get("/host/my-listings", response_model=List[schemas.Listing])
def get_my_listings(
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    return db.query(models.Listing).filter(models.Listing.host_id == current_user.id).all() 