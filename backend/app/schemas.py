from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    is_host: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_host: Optional[bool] = None

class User(UserBase):
    id: int
    profile_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Listing schemas
class ListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    price_per_night: float
    location: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_guests: int = 1
    bedrooms: int = 1
    bathrooms: int = 1
    amenities: Optional[List[str]] = []

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_per_night: Optional[float] = None
    location: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    amenities: Optional[List[str]] = None
    is_active: Optional[bool] = None

class Listing(ListingBase):
    id: int
    images: Optional[List[str]] = []
    is_active: bool
    host_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    host: User

    class Config:
        from_attributes = True

class ListingWithReviews(Listing):
    reviews: List["Review"] = []
    average_rating: Optional[float] = None

# Booking schemas
class BookingBase(BaseModel):
    listing_id: int
    check_in_date: datetime
    check_out_date: datetime
    guest_count: int = 1
    special_requests: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    special_requests: Optional[str] = None

class Booking(BookingBase):
    id: int
    customer_id: int
    total_price: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    listing: Listing
    customer: User

    class Config:
        from_attributes = True

# Review schemas
class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    listing_id: int

class Review(ReviewBase):
    id: int
    listing_id: int
    reviewer_id: int
    host_id: int
    created_at: datetime
    reviewer: User

    class Config:
        from_attributes = True

# Search and filter schemas
class ListingSearch(BaseModel):
    location: Optional[str] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    guests: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    amenities: Optional[List[str]] = None

# Image upload schemas
class ImageData(BaseModel):
    filename: str
    data: str  # base64 encoded image data

class ImageUpload(BaseModel):
    images: List[ImageData] 