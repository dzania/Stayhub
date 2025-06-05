from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String)
    is_host = Column(Boolean, default=False)
    profile_image = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    listings = relationship("Listing", back_populates="host")
    bookings = relationship("Booking", back_populates="customer")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.host_id", back_populates="host")

class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    price_per_night = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    max_guests = Column(Integer, default=1)
    bedrooms = Column(Integer, default=1)
    bathrooms = Column(Integer, default=1)
    amenities = Column(JSON)  # List of amenities
    images = Column(JSON)  # List of image URLs
    is_active = Column(Boolean, default=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    host = relationship("User", back_populates="listings")
    bookings = relationship("Booking", back_populates="listing")
    reviews = relationship("Review", back_populates="listing")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    total_price = Column(Float, nullable=False)
    guest_count = Column(Integer, default=1)
    status = Column(String, default="pending")  # pending, confirmed, cancelled, completed
    special_requests = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    listing = relationship("Listing", back_populates="bookings")
    customer = relationship("User", back_populates="bookings")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    listing = relationship("Listing", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    host = relationship("User", foreign_keys=[host_id], back_populates="reviews_received") 