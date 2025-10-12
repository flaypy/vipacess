#!/bin/bash

# ===================================================
# Telegram Secrets - Production Deployment Script
# ===================================================
# Usage: ./scripts/deploy.sh

set -e

echo "=========================================="
echo "Telegram Secrets - Production Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production not found${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Check required variables
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "PUSHINPAY_TOKEN" "FRONTEND_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env.production${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓${NC} Environment variables loaded"

# Pull latest code
echo ""
echo "Pulling latest code..."
git pull origin main
echo -e "${GREEN}✓${NC} Code updated"

# Backup database before deployment
echo ""
echo "Creating database backup..."
if [ -f "scripts/backup-database.sh" ]; then
    chmod +x scripts/backup-database.sh
    ./scripts/backup-database.sh || echo -e "${YELLOW}Warning: Backup failed${NC}"
else
    echo -e "${YELLOW}Warning: Backup script not found${NC}"
fi

# Build Docker images
echo ""
echo "Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache
echo -e "${GREEN}✓${NC} Images built"

# Stop services
echo ""
echo "Stopping services..."
docker compose -f docker-compose.prod.yml down
echo -e "${GREEN}✓${NC} Services stopped"

# Start services
echo ""
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓${NC} Services started"

# Wait for services to be healthy
echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Run database migrations
echo ""
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
echo -e "${GREEN}✓${NC} Migrations completed"

# Check service status
echo ""
echo "Checking service status..."
docker compose -f docker-compose.prod.yml ps

# Health checks
echo ""
echo "Running health checks..."

# Check backend
if curl -f -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is healthy"
else
    echo -e "${RED}✗${NC} Backend health check failed"
fi

# Check frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend is healthy"
else
    echo -e "${RED}✗${NC} Frontend health check failed"
fi

# Display logs
echo ""
echo "Recent logs:"
docker compose -f docker-compose.prod.yml logs --tail=50

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "  Check status: docker compose -f docker-compose.prod.yml ps"
echo "  Restart:      docker compose -f docker-compose.prod.yml restart"
echo ""
