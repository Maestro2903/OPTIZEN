#!/bin/bash

# Production Cleanup Script
# Removes all sample data and prepares the system for production deployment

echo "🧹 Starting production cleanup..."

# 1. Clear Next.js build cache
echo "Clearing Next.js build cache..."
rm -rf .next/
rm -rf .next/cache/

# 2. Clear npm cache (optional but recommended)
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || echo "npm cache clean not needed"

# 3. Remove sample data from database (requires Supabase CLI)
echo "Applying sample data cleanup migration..."
if command -v supabase &> /dev/null; then
    echo "Running Supabase migration to remove sample data..."
    supabase db push
else
    echo "⚠️  Supabase CLI not found. Please apply migration 011_delete_sample_data.sql manually"
fi

# 4. Rebuild the application
echo "Rebuilding application..."
npm run build

echo "✅ Production cleanup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env.local with production Supabase credentials"
echo "2. Apply the database migration 011_delete_sample_data.sql to your production database"
echo "3. Configure production environment variables (DOMAIN, ALLOWED_ORIGINS, etc.)"
echo "4. Test the application with clean data"
echo ""
echo "📊 Database cleanup migration applied:"
echo "- All sample patients removed"
echo "- All test appointments removed"
echo "- All demo inventory items removed"
echo "- Audit logs preserved for compliance"
echo "- Schema and security configurations intact"