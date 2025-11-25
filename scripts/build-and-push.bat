@echo off
REM Build and Push Script for Docker Images (Windows)
REM Run this on your DEVELOPMENT MACHINE to build and push images to Docker Hub

echo ==========================================
echo Vip Acess - Build ^& Push to Docker Hub
echo ==========================================

REM Check if .env.production.local exists
if not exist .env.production.local (
    echo ERROR: .env.production.local not found!
    echo Please create .env.production.local with your configuration
    exit /b 1
)

REM Load environment variables
echo Loading environment variables...
for /f "tokens=*" %%a in (.env.production.local) do (
    set "%%a"
)

REM Validate required variables
if "%DOCKER_USERNAME%"=="" (
    echo ERROR: DOCKER_USERNAME not set in .env.production.local
    exit /b 1
)

if "%BACKEND_IMAGE_NAME%"=="" (
    echo ERROR: BACKEND_IMAGE_NAME not set in .env.production.local
    exit /b 1
)

if "%FRONTEND_IMAGE_NAME%"=="" (
    echo ERROR: FRONTEND_IMAGE_NAME not set in .env.production.local
    exit /b 1
)

if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest

echo.
echo Configuration:
echo   Docker Hub User: %DOCKER_USERNAME%
echo   Backend Image: %DOCKER_USERNAME%/%BACKEND_IMAGE_NAME%:%IMAGE_TAG%
echo   Frontend Image: %DOCKER_USERNAME%/%FRONTEND_IMAGE_NAME%:%IMAGE_TAG%
echo.

REM Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    exit /b 1
)

echo.
echo ==========================================
echo Step 1: Building Backend Image
echo ==========================================
docker build -t %DOCKER_USERNAME%/%BACKEND_IMAGE_NAME%:%IMAGE_TAG% ./backend
if errorlevel 1 (
    echo ERROR: Backend build failed!
    exit /b 1
)

echo.
echo ==========================================
echo Step 2: Building Frontend Image
echo ==========================================
docker build ^
    --build-arg NEXT_PUBLIC_API_URL=%NEXT_PUBLIC_API_URL% ^
    --build-arg NEXT_PUBLIC_SITE_URL=%NEXT_PUBLIC_SITE_URL% ^
    --build-arg NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=%NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION% ^
    --build-arg NEXT_PUBLIC_YANDEX_VERIFICATION=%NEXT_PUBLIC_YANDEX_VERIFICATION% ^
    --build-arg NEXT_PUBLIC_BING_VERIFICATION=%NEXT_PUBLIC_BING_VERIFICATION% ^
    -t %DOCKER_USERNAME%/%FRONTEND_IMAGE_NAME%:%IMAGE_TAG% ./frontend
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    exit /b 1
)

echo.
echo ==========================================
echo Step 3: Pushing Images to Docker Hub
echo ==========================================

echo Pushing backend image...
docker push %DOCKER_USERNAME%/%BACKEND_IMAGE_NAME%:%IMAGE_TAG%
if errorlevel 1 (
    echo ERROR: Failed to push backend image. Are you logged in to Docker Hub?
    echo Run: docker login
    exit /b 1
)

echo Pushing frontend image...
docker push %DOCKER_USERNAME%/%FRONTEND_IMAGE_NAME%:%IMAGE_TAG%
if errorlevel 1 (
    echo ERROR: Failed to push frontend image!
    exit /b 1
)

echo.
echo ==========================================
echo SUCCESS! Images pushed to Docker Hub
echo ==========================================
echo.
echo Backend Image: %DOCKER_USERNAME%/%BACKEND_IMAGE_NAME%:%IMAGE_TAG%
echo Frontend Image: %DOCKER_USERNAME%/%FRONTEND_IMAGE_NAME%:%IMAGE_TAG%
echo.
echo Next Steps:
echo 1. SSH into your server
echo 2. Run the deploy.sh script on your server
echo    OR manually pull and start containers:
echo    docker pull %DOCKER_USERNAME%/%BACKEND_IMAGE_NAME%:%IMAGE_TAG%
echo    docker pull %DOCKER_USERNAME%/%FRONTEND_IMAGE_NAME%:%IMAGE_TAG%
echo    docker-compose -f docker-compose.prod.yml up -d
echo.

pause
