#!/bin/bash

# Lady's Essence Deployment Script
# This script helps deploy the application in production

set -e  # Exit on any error

echo "🚀 Starting Lady's Essence Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please copy .env.production.example to .env.production and fill in your values."
    exit 1
fi

# Source the production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "✅ Environment variables loaded"

# Build and start services
echo "🔨 Building Docker images..."
docker-compose --env-file .env.production build --no-cache

echo "🗄️  Starting database..."
docker-compose --env-file .env.production up -d db

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔧 Running database migrations..."
docker-compose --env-file .env.production run --rm backend python -m flask db upgrade

echo "🌐 Starting all services..."
docker-compose --env-file .env.production up -d

echo "🎉 Deployment complete!"
echo ""
echo "Services:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000"
echo "  - Database: localhost:5432"
echo ""
echo "To view logs: docker-compose --env-file .env.production logs -f"
echo "To stop services: docker-compose --env-file .env.production down"
