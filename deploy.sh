#!/bin/bash
# Vercel deployment script with force build

echo "🚀 Starting Vercel deployment with force build..."

# Change to project directory
cd "$(dirname "$0")"

# Check if vercel is installed
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Error: Vercel CLI or npx not found"
    exit 1
fi

# Use npx vercel if vercel is not installed globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel"
fi

# Deploy to production with force build
echo "📦 Deploying to production..."
$VERCEL_CMD --prod --force

echo "✅ Deployment initiated!"












