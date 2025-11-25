# Docker Deployment Guide

This guide explains how to build, push, and deploy your Telegram Secrets application using Docker.

## Prerequisites

1. Docker installed on both development machine and server
2. Docker Hub account (or other container registry)
3. Docker Compose installed

## Environment Variables Required

### Required Variables to Change in `.env.production`

Before deployment, you MUST update these variables in `.env.production`:

#### Docker Configuration
```bash
DOCKER_USERNAME=your_dockerhub_username  # Your Docker Hub username
BACKEND_IMAGE_NAME=telegram-acess-backend  # Can customize
FRONTEND_IMAGE_NAME=telegram-acess-frontend  # Can customize
IMAGE_TAG=latest  # Or use version tags like v1.0.0
```

#### Database Configuration
```bash
POSTGRES_USER=telegram_secrets_prod
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123!@#  # MUST CHANGE!
POSTGRES_DB=telegram_secrets_production
```

#### Backend Configuration
```bash
JWT_SECRET=CHANGE_THIS_TO_VERY_LONG_RANDOM_STRING_MIN_32_CHARS  # MUST CHANGE!

# PushinPay Integration
PUSHINPAY_API_KEY=your_production_pushinpay_api_key
PUSHINPAY_MERCHANT_ID=your_production_merchant_id
PUSHINPAY_WEBHOOK_SECRET=your_production_webhook_secret

# URLs - Replace with your actual domain
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

#### Frontend Configuration
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com  # Must be accessible from browser
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional - Search Engine Verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_google_verification_code
NEXT_PUBLIC_YANDEX_VERIFICATION=your_yandex_verification_code
NEXT_PUBLIC_BING_VERIFICATION=your_bing_verification_code
```

## Step-by-Step Deployment

### Step 1: Configure Environment Variables

1. Copy `.env.production` and update all required values:
```bash
cp .env.production.local .env.production.local.local
```

2. Edit `.env.production.local` with your actual values

### Step 2: Login to Docker Hub (Development Machine)

```bash
docker login
```

Enter your Docker Hub username and password.

### Step 3: Build Docker Images (Development Machine)

Build both frontend and backend images:

```bash
# Load environment variables
set -a && source .env.production.local.local && set +a  # Linux/Mac
# OR for Windows PowerShell:
Get-Content .env.production.local.local | ForEach-Object { if ($_ -match '^(.+)=(.+)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2]) } }

# Build images
docker-compose -f docker-compose.build.yml build
```

Or build individually:

```bash
# Build backend
docker build -t $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG ./backend

# Build frontend (with build args)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
  --build-arg NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
  --build-arg NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
  --build-arg NEXT_PUBLIC_YANDEX_VERIFICATION=$NEXT_PUBLIC_YANDEX_VERIFICATION \
  --build-arg NEXT_PUBLIC_BING_VERIFICATION=$NEXT_PUBLIC_BING_VERIFICATION \
  -t $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG ./frontend
```

### Step 4: Push Images to Docker Hub (Development Machine)

```bash
# Push both images
docker push $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG
```

### Step 5: Pull and Deploy on Server

1. SSH into your server:
```bash
ssh user@your-server-ip
```

2. Clone your repository or copy docker-compose.prod.yml and .env.production:
```bash
# If cloning repo
git clone <your-repo-url>
cd telegram_secrets

# Copy your environment file
cp .env.production.local .env.production.local.local
# Edit .env.production.local.local with production values
nano .env.production.local.local
```

3. Login to Docker Hub on server:
```bash
docker login
```

4. Pull latest images:
```bash
# Load environment variables
export $(cat .env.production.local.local | xargs)

# Pull images
docker pull $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG
docker pull $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG
```

5. Start services:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local up -d
```

### Step 6: Run Database Migrations (First Time Only)

```bash
# Run migrations inside backend container
docker exec -it telegram_secrets_backend_prod npx prisma migrate deploy
```

### Step 7: Verify Deployment

Check if all containers are running:
```bash
docker ps
```

Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

Test health endpoints:
```bash
curl http://localhost:3001/health  # Backend
curl http://localhost:3000/         # Frontend
```

## Updating the Application

When you make changes and want to update:

### On Development Machine:

1. Make your code changes
2. Rebuild images:
```bash
docker-compose -f docker-compose.build.yml build
```

3. Push to Docker Hub:
```bash
docker push $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG
```

### On Server:

1. Pull latest images:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local pull
```

2. Restart services:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local up -d
```

3. If database schema changed, run migrations:
```bash
docker exec -it telegram_secrets_backend_prod npx prisma migrate deploy
```

## Quick Deployment Scripts

### Build and Push Script (Development)
Create `scripts/build-and-push.sh`:

```bash
#!/bin/bash
set -e

# Load environment variables
export $(cat .env.production.local.local | grep -v '^#' | xargs)

echo "Building images..."
docker-compose -f docker-compose.build.yml build

echo "Pushing to Docker Hub..."
docker push $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG
docker push $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG

echo "Done! Images pushed to Docker Hub"
echo "Backend: $DOCKER_USERNAME/$BACKEND_IMAGE_NAME:$IMAGE_TAG"
echo "Frontend: $DOCKER_USERNAME/$FRONTEND_IMAGE_NAME:$IMAGE_TAG"
```

### Pull and Deploy Script (Server)
Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

# Load environment variables
export $(cat .env.production.local.local | grep -v '^#' | xargs)

echo "Pulling latest images..."
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local pull

echo "Stopping old containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local down

echo "Starting new containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.production.local.local up -d

echo "Waiting for services to be ready..."
sleep 10

echo "Deployment complete!"
docker-compose -f docker-compose.prod.yml ps
```

Make scripts executable:
```bash
chmod +x scripts/build-and-push.sh scripts/deploy.sh
```

## Useful Commands

### View logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Access container shell
```bash
docker exec -it telegram_secrets_backend_prod sh
docker exec -it telegram_secrets_frontend_prod sh
```

### View resource usage
```bash
docker stats
```

### Database backup
```bash
docker exec telegram_secrets_db_prod pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if environment variables are loaded
docker exec telegram_secrets_backend_prod env
```

### Database connection issues
```bash
# Check if database is healthy
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### Reset everything (DANGER - deletes data!)
```bash
docker-compose -f docker-compose.prod.yml down -v
```

## Security Notes

1. Never commit `.env.production.local` to git
2. Use strong passwords for `POSTGRES_PASSWORD` and `JWT_SECRET`
3. Keep Docker images updated regularly
4. Use HTTPS in production with reverse proxy (nginx/caddy)
5. Limit port exposure - only expose ports through reverse proxy
6. Regularly backup your database

## Next Steps

1. Set up reverse proxy (nginx/Caddy) with SSL certificates
2. Configure automatic backups
3. Set up monitoring and alerts
4. Configure log rotation
5. Set up CI/CD pipeline for automated deployments
