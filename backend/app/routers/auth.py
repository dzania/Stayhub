from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from ..services.s3_service import s3_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    db_user = auth.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        is_host=user.is_host
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload user profile image"""
    try:
        # Delete old profile image if exists
        if current_user.profile_image:
            old_s3_key = current_user.profile_image.split('/')[-1] if '/' in current_user.profile_image else current_user.profile_image
            s3_service.delete_image(old_s3_key)
        
        # Upload new image
        upload_result = await s3_service.upload_image(
            file=file,
            user_id=current_user.id,
            listing_id=None,
            optimize=True
        )
        
        # Update user profile
        current_user.profile_image = upload_result['url']
        db.commit()
        db.refresh(current_user)
        
        return {
            "detail": "Profile image uploaded successfully",
            "image_url": upload_result['url']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile image upload failed: {str(e)}")

@router.delete("/me/profile-image")
async def delete_profile_image(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete user profile image"""
    if not current_user.profile_image:
        raise HTTPException(status_code=404, detail="No profile image to delete")
    
    try:
        # Extract S3 key from URL
        s3_key = current_user.profile_image.split('/')[-1] if '/' in current_user.profile_image else current_user.profile_image
        
        # Delete from S3
        s3_service.delete_image(s3_key)
        
        # Update user profile
        current_user.profile_image = None
        db.commit()
        db.refresh(current_user)
        
        return {"detail": "Profile image deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile image deletion failed: {str(e)}") 