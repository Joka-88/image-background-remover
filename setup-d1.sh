#!/bin/bash

# D1 Database Setup Script
# This script helps you set up Cloudflare D1 database

set -e

echo "========================================="
echo "Cloudflare D1 Database Setup"
echo "========================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed."
    echo "Run: npm install -g wrangler"
    exit 1
fi

# Check if logged in
echo "🔍 Checking Wrangler authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Wrangler."
    echo "Run: wrangler login"
    exit 1
fi

echo "✅ Authenticated with Wrangler"
echo ""

# Step 1: Create D1 database
echo "📊 Step 1: Creating D1 database..."
OUTPUT=$(wrangler d1 create bg-remover-db 2>&1)

# Extract database_id from output
DATABASE_ID=$(echo "$OUTPUT" | grep -oP 'database_id = "\K[^"]+' || echo "")

if [ -z "$DATABASE_ID" ]; then
    echo "❌ Failed to create D1 database or extract database_id"
    echo "Output:"
    echo "$OUTPUT"
    exit 1
fi

echo "✅ Database created successfully!"
echo "   Database ID: $DATABASE_ID"
echo ""

# Step 2: Update wrangler.toml
echo "📝 Step 2: Updating wrangler.toml..."
sed -i "s/database_id = \"your-database-id-here\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
echo "✅ wrangler.toml updated"
echo ""

# Step 3: Initialize database schema
echo "🏗️  Step 3: Initializing database schema..."
wrangler d1 execute bg-remover-db --remote --file=./schema.sql
echo "✅ Database schema initialized"
echo ""

# Step 4: Deploy Worker
echo "🚀 Step 4: Deploying Worker..."
wrangler deploy
echo "✅ Worker deployed successfully!"
echo ""

# Extract Worker URL from output
echo "📋 Important Information:"
echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "Database ID: $DATABASE_ID"
echo ""
echo "Worker URL: Check the output above (format: https://image-background-remover.xxx.workers.dev)"
echo ""
echo "📝 Next Steps:"
echo "1. Copy the Worker URL from the deployment output"
echo "2. Update Cloudflare Pages environment variables:"
echo "   - WORKER_URL=<your-worker-url>"
echo "3. Redeploy Cloudflare Pages project"
echo ""
echo "📚 For detailed instructions, see: D1_DATABASE_SETUP.md"
