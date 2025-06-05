#!/bin/bash

# MinIO Setup Script for StayHub
# This script creates the necessary bucket and sets up policies for image storage

set -e

echo "🚀 Setting up MinIO for StayHub..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
until curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    echo "Waiting for MinIO..."
    sleep 2
done

echo "✅ MinIO is ready!"

# Install MinIO client if not present
if ! command -v mc &> /dev/null; then
    echo "📦 Installing MinIO client..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install minio/stable/mc
        else
            curl https://dl.min.io/client/mc/release/darwin-amd64/mc -o /usr/local/bin/mc
            chmod +x /usr/local/bin/mc
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
        chmod +x /usr/local/bin/mc
    else
        echo "❌ Unsupported OS. Please install MinIO client manually."
        exit 1
    fi
fi

# Configure MinIO client
echo "🔧 Configuring MinIO client..."
mc alias set local http://localhost:9000 minioadmin minioadmin123

# Create bucket
echo "🪣 Creating stayhub-images bucket..."
mc mb local/stayhub-images --ignore-existing

# Set bucket policy to public read for images
echo "🔒 Setting bucket policy..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::stayhub-images/*"]
    }
  ]
}
EOF

mc policy set-json /tmp/bucket-policy.json local/stayhub-images

# Clean up
rm /tmp/bucket-policy.json

echo "✅ MinIO setup complete!"
echo ""
echo "📋 MinIO Configuration:"
echo "   • API Endpoint: http://localhost:9000"
echo "   • Console: http://localhost:9001"
echo "   • Username: minioadmin"
echo "   • Password: minioadmin123"
echo "   • Bucket: stayhub-images"
echo ""
echo "🎉 You can now upload images to your StayHub application!" 