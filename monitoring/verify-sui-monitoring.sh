#!/bin/bash

# Sui Monitoring Verification Script
# This script verifies that Sui-specific panels and alerts are working correctly

set -e

echo "🔍 Verifying Sui Monitoring Setup..."

# Check if monitoring stack is running
if ! curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo "❌ Prometheus is not running. Please start the monitoring stack first:"
    echo "   cd monitoring && ./deploy-monitoring.sh"
    exit 1
fi

if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Grafana is not running. Please start the monitoring stack first:"
    echo "   cd monitoring && ./deploy-monitoring.sh"
    exit 1
fi

echo "✅ Monitoring stack is running"

# Check if backend is exposing metrics
echo "🔍 Checking backend metrics endpoint..."
if curl -s http://localhost:3000/metrics > /dev/null; then
    echo "✅ Backend metrics endpoint is accessible"
else
    echo "⚠️  Backend metrics endpoint not accessible at localhost:3000/metrics"
    echo "   Make sure your backend is running and exposing metrics"
fi

# Check Prometheus targets
echo "🔍 Checking Prometheus targets..."
TARGETS=$(curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | select(.job=="based-backend") | .health' 2>/dev/null || echo "unknown")

if [ "$TARGETS" = "up" ]; then
    echo "✅ Backend target is healthy in Prometheus"
elif [ "$TARGETS" = "down" ]; then
    echo "❌ Backend target is down in Prometheus"
else
    echo "⚠️  Could not check Prometheus targets (jq may not be installed)"
fi

# Check for Sui-specific metrics
echo "🔍 Checking for Sui-specific metrics..."
SUI_METRICS=$(curl -s http://localhost:9090/api/v1/query?query=based_sui_indexer_polls_total 2>/dev/null | jq -r '.data.result | length' 2>/dev/null || echo "0")

if [ "$SUI_METRICS" -gt 0 ]; then
    echo "✅ Sui indexer metrics found: $SUI_METRICS data points"
else
    echo "⚠️  No Sui indexer metrics found (this is normal if backend hasn't processed Sui events yet)"
fi

# Check Grafana dashboard
echo "🔍 Checking Grafana dashboard..."
DASHBOARD_EXISTS=$(curl -s -u admin:changeme123! http://localhost:3001/api/dashboards/uid/backend-overview 2>/dev/null | jq -r '.dashboard.title' 2>/dev/null || echo "not found")

if [ "$DASHBOARD_EXISTS" = "Backend Overview" ]; then
    echo "✅ Backend Overview dashboard is accessible"
else
    echo "❌ Backend Overview dashboard not found"
fi

# Check for Sui panels in dashboard
echo "🔍 Checking for Sui panels in dashboard..."
DASHBOARD_JSON=$(curl -s -u admin:changeme123! http://localhost:3001/api/dashboards/uid/backend-overview 2>/dev/null | jq -r '.dashboard.panels[].title' 2>/dev/null || echo "")

if echo "$DASHBOARD_JSON" | grep -q "Sui Indexer"; then
    echo "✅ Sui Indexer panels found in dashboard"
else
    echo "❌ Sui Indexer panels not found in dashboard"
fi

if echo "$DASHBOARD_JSON" | grep -q "Sui Events"; then
    echo "✅ Sui Events panels found in dashboard"
else
    echo "❌ Sui Events panels not found in dashboard"
fi

if echo "$DASHBOARD_JSON" | grep -q "Market Resolution Success Rate"; then
    echo "✅ Market Resolution Success Rate panel found in dashboard"
else
    echo "❌ Market Resolution Success Rate panel not found in dashboard"
fi

# Check Alertmanager configuration
echo "🔍 Checking Alertmanager configuration..."
ALERTMANAGER_CONFIG=$(curl -s http://localhost:9093/api/v1/status 2>/dev/null | jq -r '.data.config' 2>/dev/null || echo "unknown")

if [ "$ALERTMANAGER_CONFIG" != "unknown" ]; then
    echo "✅ Alertmanager is configured"
else
    echo "⚠️  Could not check Alertmanager configuration"
fi

# Check for Sui-specific alerts
echo "🔍 Checking for Sui-specific alerts..."
ALERTS=$(curl -s http://localhost:9090/api/v1/rules 2>/dev/null | jq -r '.data.groups[] | select(.name | contains("sui")) | .name' 2>/dev/null || echo "")

if [ -n "$ALERTS" ]; then
    echo "✅ Sui-specific alert rules found:"
    echo "$ALERTS" | sed 's/^/  - /'
else
    echo "⚠️  No Sui-specific alert rules found"
fi

echo ""
echo "📊 Summary:"
echo "  - Monitoring stack: ✅ Running"
echo "  - Backend metrics: $([ "$TARGETS" = "up" ] && echo "✅ Healthy" || echo "⚠️  Check backend")"
echo "  - Sui metrics: $([ "$SUI_METRICS" -gt 0 ] && echo "✅ Available" || echo "⚠️  No data yet")"
echo "  - Dashboard: $([ "$DASHBOARD_EXISTS" = "Backend Overview" ] && echo "✅ Accessible" || echo "❌ Not found")"
echo "  - Sui panels: $([ "$DASHBOARD_JSON" ] && echo "✅ Configured" || echo "❌ Missing")"
echo ""
echo "🔗 Access URLs:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/changeme123!)"
echo "  - Alertmanager: http://localhost:9093"
echo ""
echo "📈 Next Steps:"
echo "  1. Ensure your backend is running and processing Sui events"
echo "  2. Check the Backend Overview dashboard for Sui metrics"
echo "  3. Verify alerts are firing as expected"
echo "  4. Monitor settlement queue and indexer health"
