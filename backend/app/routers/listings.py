from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
import os
import uuid
from .. import models, schemas, auth
from ..database import get_db
from ..config import settings
from ..services.s3_service import s3_service

def parse_date(date_str: str) -> datetime:
    """Parse date string in YYYY-MM-DD format to datetime"""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date_str}. Expected YYYY-MM-DD")

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
    check_in_date: Optional[str] = None,
    check_out_date: Optional[str] = None,
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
        # Parse string dates to datetime objects
        check_in_datetime = parse_date(check_in_date)
        check_out_datetime = parse_date(check_out_date)
        
        unavailable_listings = db.query(models.Booking.listing_id).filter(
            and_(
                models.Booking.status.in_(["pending", "confirmed"]),
                or_(
                    and_(
                        models.Booking.check_in_date <= check_in_datetime,
                        models.Booking.check_out_date > check_in_datetime
                    ),
                    and_(
                        models.Booking.check_in_date < check_out_datetime,
                        models.Booking.check_out_date >= check_out_datetime
                    ),
                    and_(
                        models.Booking.check_in_date >= check_in_datetime,
                        models.Booking.check_out_date <= check_out_datetime
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
async def upload_listing_images(
    listing_id: int,
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    """Upload images for a listing using S3 storage"""
    db_listing = db.query(models.Listing).filter(
        models.Listing.id == listing_id,
        models.Listing.host_id == current_user.id
    ).first()
    
    if not db_listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Upload images to S3
    try:
        upload_results = await s3_service.upload_multiple_images(
            files=files,
            user_id=current_user.id,
            listing_id=listing_id,
            max_files=10
        )
        
        # Extract URLs from upload results
        image_urls = [result['url'] for result in upload_results]
        
        # Update listing images
        current_images = db_listing.images or []
        current_images.extend(image_urls)
        db_listing.images = current_images
        
        db.commit()
        db.refresh(db_listing)
        
        return {
            "detail": "Images uploaded successfully",
            "images": upload_results,
            "total_images": len(current_images)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

@router.delete("/{listing_id}/images/{image_index}")
async def delete_listing_image(
    listing_id: int,
    image_index: int,
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    """Delete a specific image from a listing"""
    db_listing = db.query(models.Listing).filter(
        models.Listing.id == listing_id,
        models.Listing.host_id == current_user.id
    ).first()
    
    if not db_listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    current_images = db_listing.images or []
    
    if image_index >= len(current_images) or image_index < 0:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Get the image URL to extract the S3 key
    image_url = current_images[image_index]
    
    # Extract S3 key from URL
    # For MinIO: http://localhost:9000/bucket/key -> key
    # For S3: https://bucket.s3.region.amazonaws.com/key -> key
    if '/stayhub-images/' in image_url:
        s3_key = image_url.split('/stayhub-images/')[-1]
    else:
        # Fallback: assume the last part after the last slash is the key
        s3_key = image_url.split('/')[-1] if '/' in image_url else image_url
    
    # Delete from S3
    try:
        s3_service.delete_image(s3_key)
    except Exception as e:
        # Log error but continue to remove from database
        print(f"Failed to delete image from S3: {str(e)}")
    
    # Remove from database
    current_images.pop(image_index)
    db_listing.images = current_images
    
    db.commit()
    db.refresh(db_listing)
    
    return {
        "detail": "Image deleted successfully",
        "remaining_images": len(current_images)
    }

@router.put("/{listing_id}/images/reorder")
async def reorder_listing_images(
    listing_id: int,
    image_order: List[int],
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    """Reorder images for a listing"""
    db_listing = db.query(models.Listing).filter(
        models.Listing.id == listing_id,
        models.Listing.host_id == current_user.id
    ).first()
    
    if not db_listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    current_images = db_listing.images or []
    
    if len(image_order) != len(current_images):
        raise HTTPException(
            status_code=400, 
            detail="Image order array must match current number of images"
        )
    
    if set(image_order) != set(range(len(current_images))):
        raise HTTPException(
            status_code=400, 
            detail="Invalid image order indices"
        )
    
    # Reorder images
    reordered_images = [current_images[i] for i in image_order]
    db_listing.images = reordered_images
    
    db.commit()
    db.refresh(db_listing)
    
    return {
        "detail": "Images reordered successfully",
        "images": reordered_images
    }

@router.get("/host/my-listings", response_model=List[schemas.Listing])
def get_my_listings(
    current_user: models.User = Depends(auth.get_current_host),
    db: Session = Depends(get_db)
):
    return db.query(models.Listing).filter(models.Listing.host_id == current_user.id).all() 