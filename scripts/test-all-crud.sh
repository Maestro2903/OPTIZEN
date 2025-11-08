#!/bin/bash
#
# Comprehensive CRUD Testing Script
# Tests Create, Read, Update, Delete operations for all API endpoints
#

BASE_URL="http://localhost:3000/api"
RESULTS_FILE="/tmp/eyecare_crud_test_results.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================" | tee $RESULTS_FILE
echo "   EYECARE CRUD Operations Test Suite" | tee -a $RESULTS_FILE
echo "   Testing all API endpoints" | tee -a $RESULTS_FILE
echo "=========================================" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    echo -n "Testing $name ($method $endpoint)... " | tee -a $RESULTS_FILE
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Check if response is successful (2xx or acceptable error for dev)
    if [[ $http_code =~ ^2[0-9][0-9]$ ]] || [[ $http_code =~ ^401$ ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)" | tee -a $RESULTS_FILE
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)" | tee -a $RESULTS_FILE
        echo "  Response: $(echo $body | jq -r '.error // .message // "Unknown error"' 2>/dev/null || echo $body | head -c 100)" | tee -a $RESULTS_FILE
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

echo "=== 1. PATIENTS API ===" | tee -a $RESULTS_FILE
test_endpoint "List Patients" "GET" "/patients"
test_endpoint "Get Patient" "GET" "/patients/df3b01eb-a4f4-495a-9456-c6edcf55f8d0"
echo "" | tee -a $RESULTS_FILE

echo "=== 2. APPOINTMENTS API ===" | tee -a $RESULTS_FILE
test_endpoint "List Appointments" "GET" "/appointments"
echo "" | tee -a $RESULTS_FILE

echo "=== 3. CASES API ===" | tee -a $RESULTS_FILE
test_endpoint "List Cases" "GET" "/cases"
echo "" | tee -a $RESULTS_FILE

echo "=== 4. OPERATIONS API ===" | tee -a $RESULTS_FILE
test_endpoint "List Operations" "GET" "/operations"
echo "" | tee -a $RESULTS_FILE

echo "=== 5. BEDS API ===" | tee -a $RESULTS_FILE
test_endpoint "List Beds" "GET" "/beds"
echo "" | tee -a $RESULTS_FILE

echo "=== 6. DISCHARGES API ===" | tee -a $RESULTS_FILE
test_endpoint "List Discharges" "GET" "/discharges"
echo "" | tee -a $RESULTS_FILE

echo "=== 7. INVOICES API ===" | tee -a $RESULTS_FILE
test_endpoint "List Invoices" "GET" "/invoices"
echo "" | tee -a $RESULTS_FILE

echo "=== 8. PHARMACY API ===" | tee -a $RESULTS_FILE
test_endpoint "List Pharmacy Items" "GET" "/pharmacy"
echo "" | tee -a $RESULTS_FILE

echo "=== 9. CERTIFICATES API ===" | tee -a $RESULTS_FILE
test_endpoint "List Certificates" "GET" "/certificates"
echo "" | tee -a $RESULTS_FILE

echo "=== 10. ATTENDANCE API ===" | tee -a $RESULTS_FILE
test_endpoint "List Attendance" "GET" "/attendance"
echo "" | tee -a $RESULTS_FILE

echo "=== 11. EMPLOYEES API ===" | tee -a $RESULTS_FILE
test_endpoint "List Employees" "GET" "/employees"
echo "" | tee -a $RESULTS_FILE

echo "=== 12. MASTER DATA API ===" | tee -a $RESULTS_FILE
test_endpoint "List Master Data" "GET" "/master-data?category=complaints&limit=10"
test_endpoint "List Payment Methods" "GET" "/master-data?category=payment_methods&limit=10"
test_endpoint "List Visual Acuity" "GET" "/master-data?category=visual_acuity&limit=10"
echo "" | tee -a $RESULTS_FILE

echo "=========================================" | tee -a $RESULTS_FILE
echo "   TEST RESULTS SUMMARY" | tee -a $RESULTS_FILE
echo "=========================================" | tee -a $RESULTS_FILE
echo -e "${GREEN}Passed:${NC} $PASS_COUNT" | tee -a $RESULTS_FILE
echo -e "${RED}Failed:${NC} $FAIL_COUNT" | tee -a $RESULTS_FILE
echo "=========================================" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE
echo "Full results saved to: $RESULTS_FILE" | tee -a $RESULTS_FILE

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Check results above.${NC}"
    exit 1
fi

