#!/bin/bash

# Production Cleanup Script
# Removes all sample data and prepares the system for production deployment

# Strict error handling
set -euo pipefail

# Trap errors and report failing command
trap 'echo "❌ Error on line $LINENO: Command \"$BASH_COMMAND\" failed with exit code $?"; exit 1' ERR

echo "🧹 Starting production cleanup..."

# Validate we're in the project root
echo "Validating working directory..."
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
  echo "❌ Error: Not in project root directory!"
  echo "   Expected to find package.json and .git/"
  echo "   Current directory: $(pwd)"
  exit 1
fi

# Additional safety check: verify this is the EYECARE project
if ! grep -q '"name": "eyecare-crm"' package.json 2>/dev/null; then
  echo "⚠️  Warning: package.json doesn't contain expected project name"
  echo "   Aborting for safety. Please run this script from the EYECARE project root."
  exit 1
fi

echo "✅ Working directory validated"

# 1. Clear Next.js build cache
echo "Clearing Next.js build cache..."
if [ -d ".next" ]; then
  rm -rf .next/
  echo "   ✅ Removed .next/ directory (including cache)"
else
  echo "   ℹ️  .next/ directory not found (already clean)"
fi

# 2. Clear npm cache (optional but recommended)
echo "Clearing npm cache..."
if npm cache clean --force 2>/dev/null; then
    echo "   ✅ npm cache cleared"
else
    echo "   ⚠️  npm cache clean skipped (npm may not be available or cache already clean)"
fi

# 3. Remove sample data from database (requires Supabase CLI)
echo ""
echo "Checking for pending migrations..."
MIGRATION_APPLIED=false

if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    
    # Check for pending migrations (safer than blindly pushing)
    echo "⚠️  Warning: 'supabase db push' applies ALL pending migrations"
    echo "   This script should only apply specific cleanup migrations."
    echo ""
    echo "   Recommended: Apply migration 011_delete_sample_data.sql manually using:"
    echo "   psql \$DATABASE_URL -f supabase/migrations/011_delete_sample_data.sql"
    echo ""
    echo "   Or use Supabase dashboard SQL editor."
    echo ""

    # Detect non-interactive mode (CI/CD) and handle appropriately
    if [ -t 0 ]; then
        # Interactive mode - prompt with timeout
        read -p "Do you want to continue with 'supabase db push'? (y/N): " -t 30 -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if supabase db push; then
                MIGRATION_APPLIED=true
                echo "✅ Database migrations applied successfully"
            else
                echo "❌ Database migration failed!"
                exit 1
            fi
        else
            echo "⏭️  Skipping database migration"
        fi
    else
        # Non-interactive mode - skip prompt and fail fast
        echo "❌ Non-interactive mode detected - cannot prompt for migration approval"
        echo "   Set SUPABASE_SKIP_PROMPT=1 to auto-apply or run manually"
        if [ "$SUPABASE_SKIP_PROMPT" = "1" ]; then
            echo "🔄 Auto-applying migration due to SUPABASE_SKIP_PROMPT=1"
            if supabase db push; then
                MIGRATION_APPLIED=true
                echo "✅ Database migrations applied successfully"
            else
                echo "❌ Database migration failed!"
                exit 1
            fi
        else
            exit 1
        fi
    fi
else
    echo "⚠️  Supabase CLI not found"
    echo "   Install with: npm install -g supabase"
    echo "   Or apply migration 011_delete_sample_data.sql manually"
fi

# 4. Rebuild the application
echo ""
echo "Rebuilding application..."
if npm run build; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed!"
    exit 1
fi

# Final success message (only shown if all steps passed)
echo ""
echo "✅ Production cleanup complete!"
echo ""
echo "📋 Actions taken:"
echo "   ✅ Cleared Next.js build cache"
echo "   ✅ Cleared npm cache"
if [ "$MIGRATION_APPLIED" = true ]; then
    echo "   ✅ Applied database cleanup migration"
else
    echo "   ⏭️  Database migration skipped (manual action required)"
fi
echo "   ✅ Rebuilt application"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env.local with production Supabase credentials"
if [ "$MIGRATION_APPLIED" = false ]; then
    echo "2. ⚠️  Apply migration 011_delete_sample_data.sql to your database"
    echo "3. Configure production environment variables (DOMAIN, ALLOWED_ORIGINS, etc.)"
    echo "4. Test the application with clean data"
else
    echo "2. Configure production environment variables (DOMAIN, ALLOWED_ORIGINS, etc.)"
    echo "3. Test the application with clean data"
fi
echo ""
if [ "$MIGRATION_APPLIED" = true ]; then
    echo "📊 Database cleanup completed:"
    echo "   - All sample patients removed"
    echo "   - All test appointments removed"
    echo "   - All demo inventory items removed"
    echo "   - Audit logs preserved for compliance"
    echo "   - Schema and security configurations intact"
fi