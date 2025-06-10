import os
import uuid
import io
import logging
import json
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from PIL import Image, ExifTags
import magic
from fastapi import UploadFile, HTTPException

from ..config import settings

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.region = settings.S3_REGION
        
        # Initialize S3 client
        try:
            if settings.S3_ENDPOINT_URL:
                # For local development or custom S3-compatible storage (e.g., MinIO)
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=settings.S3_ENDPOINT_URL,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self.region
                )
            else:
                # For AWS S3
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self.region
                )
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            raise HTTPException(status_code=500, detail="Storage service configuration error")

        self.create_bucket_if_not_exists()

    def create_bucket_if_not_exists(self):
        """Create the S3 bucket if it does not exist and set public read policy"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket '{self.bucket_name}' already exists.")
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                logger.info(f"Bucket '{self.bucket_name}' not found. Creating bucket.")
                try:
                    if self.region == 'us-east-1':
                         self.s3_client.create_bucket(Bucket=self.bucket_name)
                    else:
                        self.s3_client.create_bucket(
                            Bucket=self.bucket_name,
                            CreateBucketConfiguration={'LocationConstraint': self.region}
                        )
                    logger.info(f"Bucket '{self.bucket_name}' created successfully.")
                except ClientError as create_error:
                    logger.error(f"Failed to create bucket '{self.bucket_name}': {create_error}")
                    raise
            else:
                logger.error(f"Error checking bucket '{self.bucket_name}': {e}")
                raise
        
        # Set public read policy
        try:
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"]
                    }
                ]
            }
            self.s3_client.put_bucket_policy(
                Bucket=self.bucket_name,
                Policy=json.dumps(policy)
            )
            logger.info(f"Public read policy set for bucket '{self.bucket_name}'.")
        except ClientError as e:
            logger.error(f"Failed to set bucket policy for '{self.bucket_name}': {e}")
            # This might fail if the user/role doesn't have PutBucketPolicy permissions,
            # but we can often still proceed with uploads.
            # Depending on requirements, you might want to raise an exception here.

    def _validate_image(self, file: UploadFile) -> None:
        """Validate image file type, size, and format"""
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > max_size:
            raise HTTPException(status_code=400, detail="File size too large. Maximum 10MB allowed.")
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        # Read file content for validation
        content = file.file.read()
        file.file.seek(0)  # Reset file pointer
        
        # Validate MIME type
        mime_type = magic.from_buffer(content, mime=True)
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        
        if mime_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Validate that it's actually an image by trying to open it
        try:
            img = Image.open(io.BytesIO(content))
            img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file")

    def _process_image(self, file_content: bytes, max_width: int = 1920, max_height: int = 1080, quality: int = 85) -> Tuple[bytes, str]:
        """Process and optimize image"""
        try:
            # Open image
            img = Image.open(io.BytesIO(file_content))
            
            # Handle EXIF orientation
            try:
                for orientation in ExifTags.TAGS.keys():
                    if ExifTags.TAGS[orientation] == 'Orientation':
                        break
                
                exif = img._getexif()
                if exif is not None:
                    orientation_value = exif.get(orientation)
                    if orientation_value == 3:
                        img = img.rotate(180, expand=True)
                    elif orientation_value == 6:
                        img = img.rotate(270, expand=True)
                    elif orientation_value == 8:
                        img = img.rotate(90, expand=True)
            except (AttributeError, KeyError, TypeError):
                pass  # No EXIF data or orientation info
            
            # Convert to RGB if necessary (for JPEG output)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparent images
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if necessary
            if img.width > max_width or img.height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save optimized image
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            optimized_content = output.getvalue()
            
            return optimized_content, 'image/jpeg'
            
        except Exception as e:
            logger.error(f"Image processing error: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to process image")

    def _generate_file_key(self, user_id: int, listing_id: Optional[int] = None, original_filename: str = "") -> str:
        """Generate unique S3 key for file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        # Extract file extension
        ext = original_filename.split('.')[-1] if '.' in original_filename else 'jpg'
        
        if listing_id:
            return f"listings/{listing_id}/{user_id}_{timestamp}_{unique_id}.{ext}"
        else:
            return f"users/{user_id}/{timestamp}_{unique_id}.{ext}"

    async def upload_image(
        self, 
        file: UploadFile, 
        user_id: int, 
        listing_id: Optional[int] = None,
        optimize: bool = True
    ) -> dict:
        """Upload single image to S3"""
        try:
            # Validate image
            self._validate_image(file)
            
            # Read file content
            content = await file.read()
            
            # Process image if optimization is enabled
            if optimize:
                processed_content, content_type = self._process_image(content)
            else:
                processed_content = content
                content_type = file.content_type or 'image/jpeg'
            
            # Generate unique key
            file_key = self._generate_file_key(user_id, listing_id, file.filename or "")
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=processed_content,
                ContentType=content_type,
                CacheControl='max-age=31536000',  # 1 year cache
                Metadata={
                    'user_id': str(user_id),
                    'listing_id': str(listing_id) if listing_id else '',
                    'original_filename': file.filename or '',
                    'upload_date': datetime.utcnow().isoformat()
                }
            )
            
            # Generate public URL
            url = self._get_public_url(file_key)
            
            return {
                'key': file_key,
                'url': url,
                'size': len(processed_content),
                'content_type': content_type,
                'filename': file.filename
            }
            
        except HTTPException:
            raise
        except ClientError as e:
            logger.error(f"S3 upload error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload image")
        except Exception as e:
            logger.error(f"Unexpected upload error: {str(e)}")
            raise HTTPException(status_code=500, detail="Image upload failed")

    async def upload_multiple_images(
        self, 
        files: List[UploadFile], 
        user_id: int, 
        listing_id: Optional[int] = None,
        max_files: int = 10
    ) -> List[dict]:
        """Upload multiple images to S3"""
        if len(files) > max_files:
            raise HTTPException(status_code=400, detail=f"Too many files. Maximum {max_files} allowed.")
        
        results = []
        errors = []
        
        for i, file in enumerate(files):
            try:
                result = await self.upload_image(file, user_id, listing_id)
                results.append(result)
            except HTTPException as e:
                errors.append(f"File {i+1} ({file.filename}): {e.detail}")
            except Exception as e:
                errors.append(f"File {i+1} ({file.filename}): Upload failed")
        
        if errors and not results:
            raise HTTPException(status_code=400, detail=f"All uploads failed: {'; '.join(errors)}")
        
        return results

    def delete_image(self, file_key: str) -> bool:
        """Delete image from S3"""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except ClientError as e:
            logger.error(f"S3 delete error: {str(e)}")
            return False

    def delete_multiple_images(self, file_keys: List[str]) -> dict:
        """Delete multiple images from S3"""
        if not file_keys:
            return {'deleted': 0, 'failed': 0}
        
        try:
            # Prepare objects for batch delete
            objects = [{'Key': key} for key in file_keys]
            
            response = self.s3_client.delete_objects(
                Bucket=self.bucket_name,
                Delete={'Objects': objects}
            )
            
            deleted = len(response.get('Deleted', []))
            errors = response.get('Errors', [])
            
            return {
                'deleted': deleted,
                'failed': len(errors),
                'errors': errors
            }
            
        except ClientError as e:
            logger.error(f"S3 batch delete error: {str(e)}")
            return {'deleted': 0, 'failed': len(file_keys)}

    def _get_public_url(self, file_key: str) -> str:
        """Get public URL for S3 object"""
        if settings.S3_CUSTOM_DOMAIN:
            return f"https://{settings.S3_CUSTOM_DOMAIN}/{file_key}"
        elif settings.S3_ENDPOINT_URL:
            # For local MinIO, use nginx proxy URL
            if "minio:9000" in settings.S3_ENDPOINT_URL:
                return f"http://localhost/minio/{self.bucket_name}/{file_key}"
            else:
                return f"{settings.S3_ENDPOINT_URL}/{self.bucket_name}/{file_key}"
        else:
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{file_key}"

    def generate_presigned_url(self, file_key: str, expiration: int = 3600) -> str:
        """Generate presigned URL for temporary access"""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Presigned URL generation error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate access URL")

# Global instance
s3_service = S3Service() 