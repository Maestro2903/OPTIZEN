#!/bin/bash

# Test deleting a complaint item
echo "1. Getting a complaint from the database to test delete..."
COMPLAINT_ID=$(curl -s "http://localhost:3002/api/master-data?category=complaints&limit=1" | jq -r '.data[0].id // empty')

if [ -z "$COMPLAINT_ID" ]; then
  echo "No complaint found in flattened structure, trying hierarchical..."
  COMPLAINT_ID=$(curl -s "http://localhost:3002/api/master-data?category=complaints&limit=1" | jq -r '.data[0].children[0].id // empty')
fi

echo "Found complaint ID: $COMPLAINT_ID"
echo ""

if [ ! -z "$COMPLAINT_ID" ]; then
  echo "2. Testing DELETE /api/master-data/$COMPLAINT_ID..."
  curl -s -X DELETE "http://localhost:3002/api/master-data/$COMPLAINT_ID" \
    -H "Content-Type: application/json" | jq '.'
  echo ""
  
  echo "3. Verifying deletion - checking if item is now inactive..."
  curl -s "http://localhost:3002/api/master-data/$COMPLAINT_ID" \
    -H "Content-Type: application/json" | jq '.'
else
  echo "ERROR: Could not find a complaint ID to test"
fi
