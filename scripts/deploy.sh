#!/bin/bash
# Deploy Script for Server
# Run this on your SERVER to pull and deploy latest images from Docker Hub

set -e  # Exit on any error

echo "=========================================="
echo "Vip Acess - Deploy from Docker Hub"
echo "=========================================="

# Check if .env.production.local.local exists
if [ ! -f .env.production.local.local ]; then
    echo "ERROR: .env.production.local not found!"
    echo "Please create .env.production.local with your production configuration"
    exit 1
fi

# Load environment variables
echo "Loading environment variables..."
export $(cat .env.production.local.local | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$DOCKER_USERNAME" ]; then
    echo "ERROR: DOCKER_USERNAME not set in .env.production.local"
    exit 1
fi

if [ -z "$BACKEND_IMAGE_NAME" ]; then
    echo "ERROR: BACKEND_IMAGE_NAME not set in .env.production.local"
    exit 1
fi

if [ -z "$FRONTEND_IMAGE_NAME" ]; then
    echo "ERROR: FRONTEND_IMAGE_NAME not set in .env.production.local"
    exit 1
fi

IMAGE_TAG=${IMAGE_TAG:-latest}

echo ""
echo "Configuration:"
echo "  Docker Hub User: $DOCKER_USERNAME"
echo "  Backend Image: $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG"
echo "  Frontend Image: $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG"
echo ""

# Check if docker-compose.prod.yml exists
if [ ! -f docker-compose.prod.yml ]; then
    echo "ERROR: docker-compose.prod.yml not found!"
    exit 1
fi

echo "=========================================="
echo "Step 1: Pulling Latest Images"
echo "=========================================="
docker pull $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG
docker pull $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG

echo ""
echo "=========================================="
echo "Step 2: Stopping Old Containers"
echo "=========================================="
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local down

echo ""
echo "=========================================="
echo "Step 3: Starting New Containers"
echo "=========================================="
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local up -d

echo ""
echo "Waiting for services to start..."
sleep 5

# Check if this is first deployment (need to run migrations)
if ! docker ps -a | grep -q "vipacess_backend_prod"; then
    FIRST_DEPLOY=true
else
    FIRST_DEPLOY=false
fi

if [ "$FIRST_DEPLOY" = true ]; then
    echo ""
    echo "=========================================="
    echo "First Deployment Detected"
    echo "=========================================="
    echo "Waiting for database to be ready..."
    sleep 10

    echo "Running database migrations..."
    docker exec vipacess_backend_prod npx prisma migrate deploy
fi

echo ""
echo "=========================================="
echo "Deployment Status"
echo "=========================================="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo "Health Check"
echo "=========================================="
sleep 5

# Check backend health
echo -n "Backend health check: "
if curl -sf http://localhost:3001/health > /dev/null; then
    echo "✓ HEALTHY"
else
    echo "✗ UNHEALTHY (might still be starting up)"
fi

# Check frontend health
echo -n "Frontend health check: "
if curl -sf http://localhost:3000/ > /dev/null; then
    echo "✓ HEALTHY"
else
    echo "✗ UNHEALTHY (might still be starting up)"
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  View logs:           docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart services:    docker-compose -f docker-compose.prod.yml restart"
echo "  Stop services:       docker-compose -f docker-compose.prod.yml down"
echo "  Check status:        docker-compose -f docker-compose.prod.yml ps"
echo ""

# Show recent logs
echo "Recent logs:"
echo "----------------------------------------"
docker-compose -f docker-compose.prod.yml logs --tail=20
