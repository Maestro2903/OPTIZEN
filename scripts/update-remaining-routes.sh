#!/bin/bash
# Quick reference script for updating remaining API routes
# Apply the same RBAC pattern to these files:

echo "Remaining API routes to update with RBAC pattern:"
echo "1. /app/api/cases/[id]/route.ts"
echo "2. /app/api/invoices/[id]/route.ts"
echo "3. /app/api/employees/[id]/route.ts"
echo "4. /app/api/operations/[id]/route.ts"
echo "5. /app/api/discharges/[id]/route.ts"
echo "6. /app/api/certificates/[id]/route.ts"
echo "7. /app/api/beds/[id]/route.ts"
echo "8. /app/api/master-data/[id]/route.ts"
echo ""
echo "Pattern: Replace session checks with requirePermission() calls"
echo "See /docs/API_ROUTE_FIX_PATTERN.md for details"

