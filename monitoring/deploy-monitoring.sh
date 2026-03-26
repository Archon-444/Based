#!/bin/bash

# Monitoring Deployment Script
# This script helps deploy the monitoring stack with updated dashboards and alerts

set -e

echo "🚀 Deploying Based Monitoring Stack..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker Desktop or Docker Engine to continue"
    echo ""
    echo "For macOS:"
    echo "  brew install --cask docker"
    echo ""
    echo "For Ubuntu/Debian:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    echo ""
    echo "For Windows:"
    echo "  Download Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available"
    echo "Please install Docker Compose to continue"
    exit 1
fi

# Set environment variables
export GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-"changeme123!"}
export ALERTMANAGER_SMTP_PASSWORD=${ALERTMANAGER_SMTP_PASSWORD:-""}

echo "📊 Configuration:"
echo "  - Grafana Admin Password: $GRAFANA_ADMIN_PASSWORD"
echo "  - Alertmanager SMTP: ${ALERTMANAGER_SMTP_PASSWORD:+configured}"
echo ""

# Stop existing containers
echo "🛑 Stopping existing monitoring containers..."
docker compose down 2>/dev/null || true

# Pull latest images
echo "📥 Pulling latest monitoring images..."
docker compose pull

# Start the monitoring stack
echo "🚀 Starting monitoring stack..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check Prometheus
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus is not responding"
fi

# Check Grafana
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana is not responding"
fi

# Check Alertmanager
if curl -s http://localhost:9093/-/healthy > /dev/null; then
    echo "✅ Alertmanager is healthy"
else
    echo "❌ Alertmanager is not responding"
fi

echo ""
echo "🎉 Monitoring stack deployed successfully!"
echo ""
echo "📊 Access URLs:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/$GRAFANA_ADMIN_PASSWORD)"
echo "  - Alertmanager: http://localhost:9093"
echo ""
echo "📈 Dashboard:"
echo "  - Backend Overview: http://localhost:3001/d/backend-overview"
echo ""
echo "🔧 Management Commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop stack: docker compose down"
echo "  - Restart stack: docker compose restart"
echo "  - Update dashboards: docker compose restart grafana"
echo ""
echo "⚠️  Note: Make sure your backend is running on port 3000"
echo "    and exposing metrics at /metrics endpoint"
