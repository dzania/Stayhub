from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from .database import engine, get_db
from . import models
from .routers import auth, listings, bookings, reviews
from .config import settings

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StayHub API",
    description="A full-featured StayHub backend API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)

# Mount static files for image serving
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(reviews.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to StayHub API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"} 