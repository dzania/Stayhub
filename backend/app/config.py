import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/stayhub"
    SECRET_KEY: str = "your-secret-key-change-this-in-production-please-use-a-secure-random-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    UPLOAD_DIR: str = "uploads"
    
    # Email settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@stayhub.com"
    FROM_NAME: str = "StayHub"
    
    class Config:
        env_file = ".env"

settings = Settings() 