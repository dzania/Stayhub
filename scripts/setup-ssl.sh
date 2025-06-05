#!/bin/bash

# SSL Setup Script for StayHub
# This script sets up Let's Encrypt SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <domain> <email>${NC}"
    echo "Example: $0 stayhub.com admin@stayhub.com"
    exit 1
fi

if [ -z "$2" ]; then
    echo -e "${RED}Usage: $0 <domain> <email>${NC}"
    echo "Example: $0 stayhub.com admin@stayhub.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo -e "${GREEN}Setting up SSL for domain: $DOMAIN${NC}"

# Create directories
mkdir -p nginx/ssl
mkdir -p certbot/conf
mkdir -p certbot/www

# Update nginx configuration with actual domain
sed -i "s/yourdomain.com/$DOMAIN/g" nginx/prod.conf

# Initial certificate request
echo -e "${YELLOW}Requesting initial SSL certificate...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d $DOMAIN \
  -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}SSL certificate obtained successfully!${NC}"
    echo -e "${YELLOW}Restarting nginx to apply SSL configuration...${NC}"
    docker-compose -f docker-compose.prod.yml restart nginx
    echo -e "${GREEN}SSL setup complete!${NC}"
else
    echo -e "${RED}Failed to obtain SSL certificate${NC}"
    exit 1
fi

echo -e "${GREEN}SSL certificates will auto-renew every 12 hours${NC}" 