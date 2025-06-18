import os
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field("postgresql://postgres:postgres@localhost:5432/stayhub", env="DATABASE_URL")
    SECRET_KEY: str = Field("", env="SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    UPLOAD_DIR: str = Field("uploads", env="UPLOAD_DIR")
    
    # S3 Storage settings
    AWS_ACCESS_KEY_ID: str = Field("", env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field("", env="AWS_SECRET_ACCESS_KEY")
    S3_BUCKET_NAME: str = Field("stayhub-images", env="S3_BUCKET_NAME")
    S3_REGION: str = Field("us-east-1", env="S3_REGION")
    S3_ENDPOINT_URL: str = Field("", env="S3_ENDPOINT_URL")  # For MinIO or custom S3-compatible storage
    S3_CUSTOM_DOMAIN: str = Field("", env="S3_CUSTOM_DOMAIN")  # For CloudFront or custom CDN
    
    # Email settings
    SMTP_SERVER: str = Field("smtp.gmail.com", env="SMTP_SERVER")
    SMTP_PORT: int = Field(587, env="SMTP_PORT")
    SMTP_USERNAME: str = Field("", env="SMTP_USERNAME")
    SMTP_PASSWORD: str = Field("", env="SMTP_PASSWORD")
    FROM_EMAIL: str = Field("noreply@stayhub.com", env="FROM_EMAIL")
    FROM_NAME: str = Field("StayHub", env="FROM_NAME")
    
    # Stripe settings
    STRIPE_PUBLISHABLE_KEY: str = Field("", env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_SECRET_KEY: str = Field("", env="STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: str = Field("", env="STRIPE_WEBHOOK_SECRET")
    FRONTEND_URL: str = Field("http://localhost:3000", env="FRONTEND_URL")
    
    class Config:
        env_file = ".env"

settings = Settings() 