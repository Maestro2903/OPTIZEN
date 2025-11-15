#!/bin/bash
# Get the Supabase URL and anon key
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)

echo "Testing Master Data API Endpoints..."
echo "SUPABASE_URL: $SUPABASE_URL"
echo ""

# Test GET /api/master-data with category
echo "1. Testing GET /api/master-data?category=treatments..."
curl -s "http://localhost:3002/api/master-data?category=treatments&limit=3" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo "---"
echo ""

# Get an existing treatment ID to test update/delete
TREATMENT_ID=$(curl -s "http://localhost:3002/api/master-data?category=treatments&limit=1" | jq -r '.data[0].id')
echo "Using treatment ID: $TREATMENT_ID"
echo ""

# Test POST /api/master-data - Create
echo "2. Testing POST /api/master-data (Create)..."
curl -s -X POST "http://localhost:3002/api/master-data" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "treatments",
    "name": "Test Treatment from API",
    "description": "This is a test treatment",
    "is_active": true
  }' | jq '.'
echo ""
echo "---"
echo ""

# Test DELETE /api/master-data/[id]
echo "3. Testing DELETE /api/master-data/[id] (soft delete)..."
if [ ! -z "$TREATMENT_ID" ]; then
  curl -s -X DELETE "http://localhost:3002/api/master-data/$TREATMENT_ID" \
    -H "Content-Type: application/json" | jq '.'
else
  echo "No treatment ID found to test delete"
fi
