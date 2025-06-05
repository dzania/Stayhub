# MinIO Setup for StayHub

This guide explains how to set up MinIO (S3-compatible storage) for the StayHub application.

## 🚀 Quick Start

### 1. Start the Services

```bash
# Start all services including MinIO
docker-compose up -d

# Or for production
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Setup MinIO Bucket

```bash
# Run the setup script
./scripts/setup-minio.sh
```

### 3. Access MinIO Console

- **Console URL**: http://localhost:9001
- **Username**: `minioadmin`
- **Password**: `minioadmin123`

## 📋 Configuration

### Development Environment

MinIO is automatically configured in `docker-compose.yml` with:

- **API Endpoint**: `http://localhost:9000`
- **Console**: `http://localhost:9001`
- **Bucket**: `stayhub-images`
- **Access Key**: `minioadmin`
- **Secret Key**: `minioadmin123`

### Production Environment

For production, set these environment variables in your `.env` file:

```env
# MinIO Configuration
MINIO_ROOT_USER=your_secure_username
MINIO_ROOT_PASSWORD=your_very_secure_password_here
S3_BUCKET_NAME=stayhub-images
S3_REGION=us-east-1
S3_ENDPOINT_URL=http://minio:9000
S3_CUSTOM_DOMAIN=
```

## 🔧 Manual Setup (Alternative)

If you prefer to set up MinIO manually:

### 1. Install MinIO Client

**macOS:**
```bash
brew install minio/stable/mc
```

**Linux:**
```bash
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc
```

### 2. Configure Client

```bash
mc alias set local http://localhost:9000 minioadmin minioadmin123
```

### 3. Create Bucket

```bash
mc mb local/stayhub-images
```

### 4. Set Public Read Policy

```bash
mc policy set public local/stayhub-images
```

## 🌐 Using AWS S3 Instead

If you prefer to use AWS S3 instead of MinIO:

### 1. Create S3 Bucket

```bash
aws s3 mb s3://your-stayhub-images-bucket
```

### 2. Set Environment Variables

```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your-stayhub-images-bucket
S3_REGION=us-east-1
S3_ENDPOINT_URL=  # Leave empty for AWS S3
S3_CUSTOM_DOMAIN=  # Optional: CloudFront domain
```

### 3. Set Bucket Policy

Create a bucket policy for public read access to images:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-stayhub-images-bucket/*"
    }
  ]
}
```

## 🔍 Troubleshooting

### MinIO Not Starting

1. Check if port 9000 is already in use:
   ```bash
   lsof -i :9000
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs minio
   ```

### Bucket Creation Failed

1. Ensure MinIO is running:
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

2. Check MinIO client configuration:
   ```bash
   mc admin info local
   ```

### Images Not Loading

1. Verify bucket policy:
   ```bash
   mc policy get local/stayhub-images
   ```

2. Check if images are uploaded:
   ```bash
   mc ls local/stayhub-images
   ```

3. Test image URL directly in browser

### Backend Connection Issues

1. Check environment variables in backend container:
   ```bash
   docker-compose exec backend env | grep S3
   ```

2. Test S3 connection from backend:
   ```bash
   docker-compose exec backend python -c "
   from app.services.s3_service import s3_service
   print('S3 service initialized successfully')
   "
   ```

## 📊 Monitoring

### MinIO Console

Access the MinIO console at http://localhost:9001 to:

- Monitor storage usage
- View uploaded files
- Manage buckets and policies
- Check access logs

### Health Checks

```bash
# Check MinIO health
curl http://localhost:9000/minio/health/live

# Check bucket exists
mc ls local/stayhub-images

# Test upload
echo "test" | mc pipe local/stayhub-images/test.txt
```

## 🔒 Security Considerations

### Development

- Default credentials are fine for local development
- MinIO console is accessible for debugging

### Production

1. **Change default credentials**:
   ```env
   MINIO_ROOT_USER=your_secure_username
   MINIO_ROOT_PASSWORD=your_very_secure_password_here
   ```

2. **Disable console** (optional):
   Remove port `9001:9001` mapping from docker-compose.prod.yml

3. **Use HTTPS**:
   Configure SSL certificates for MinIO

4. **Network security**:
   Use Docker networks to isolate MinIO

5. **Backup strategy**:
   Set up regular backups of MinIO data

## 📁 File Structure

```
stayhub-images/
├── listings/
│   ├── 1/           # Listing ID
│   │   ├── user1_20231201_abc123.jpg
│   │   └── user1_20231201_def456.jpg
│   └── 2/
│       └── user2_20231201_ghi789.jpg
└── users/           # Future: user profile images
    └── 1/
        └── profile_20231201_jkl012.jpg
```

## 🎯 Next Steps

1. **CDN Integration**: Set up CloudFront or similar CDN
2. **Image Optimization**: Add automatic image resizing
3. **Backup Strategy**: Implement automated backups
4. **Monitoring**: Add storage usage alerts
5. **Security**: Implement signed URLs for private images 