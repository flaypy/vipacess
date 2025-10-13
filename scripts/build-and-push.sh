#!/bin/bash
# Build and Push Script for Docker Images
# Run this on your DEVELOPMENT MACHINE to build and push images to Docker Hub

set -e  # Exit on any error

echo "=========================================="
echo "Telegram Secrets - Build & Push to Docker Hub"
echo "=========================================="

# Check if .env.production.local exists
if [ ! -f .env.production.local ]; then
    echo "ERROR: .env.production.local not found!"
    echo "Please create .env.production.local with your configuration"
    exit 1
fi

# Load environment variables
echo "Loading environment variables..."
export $(cat .env.production.local | grep -v '^#' | xargs)

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

# Check if logged in to Docker Hub
echo "Checking Docker Hub login..."
if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
    echo "Not logged in to Docker Hub. Please login:"
    docker login
fi

echo ""
echo "=========================================="
echo "Step 1: Building Backend Image"
echo "=========================================="
docker build \
    -t $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG \
    ./backend

echo ""
echo "=========================================="
echo "Step 2: Building Frontend Image"
echo "=========================================="
docker build \
    --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    --build-arg NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    --build-arg NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=${NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:-} \
    --build-arg NEXT_PUBLIC_YANDEX_VERIFICATION=${NEXT_PUBLIC_YANDEX_VERIFICATION:-} \
    --build-arg NEXT_PUBLIC_BING_VERIFICATION=${NEXT_PUBLIC_BING_VERIFICATION:-} \
    -t $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG \
    ./frontend

echo ""
echo "=========================================="
echo "Step 3: Pushing Images to Docker Hub"
echo "=========================================="

echo "Pushing backend image..."
docker push $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG

echo "Pushing frontend image..."
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG

echo ""
echo "=========================================="
echo "SUCCESS! Images pushed to Docker Hub"
echo "=========================================="
echo ""
echo "Backend Image: $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG"
echo "Frontend Image: $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG"
echo ""
echo "Next Steps:"
echo "1. SSH into your server"
echo "2. Run the deploy.sh script on your server"
echo "   OR manually pull and start containers:"
echo "   docker pull $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG"
echo "   docker pull $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
