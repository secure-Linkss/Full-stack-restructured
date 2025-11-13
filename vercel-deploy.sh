#!/bin/bash

# Vercel Deployment Script for Brain Link Tracker
# This script uses the Vercel API to deploy the project

VERCEL_TOKEN="1JIyxuO5vXBTUGJW5YmNy6GF"
PROJECT_NAME="brain-link-tracker"

echo "🚀 Starting Vercel deployment..."
echo ""

# Install Vercel CLI if not already installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Set Vercel token
export VERCEL_TOKEN="$VERCEL_TOKEN"

# Deploy to production
echo "Deploying to production..."
vercel --token "$VERCEL_TOKEN" --prod --yes

echo ""
echo "✅ Deployment complete!"
echo "Check your Vercel dashboard for the live URL"