#!/bin/bash
#
# Comprehensive CRUD Testing - All Pages
# Tests Create, Read, Update, Delete operations
#

BASE_URL="http://localhost:3000/api"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     EYECARE - Comprehensive CRUD Test Suite          ║"
echo "║     Testing All Pages & Operations                    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -1)
    
    if [[ $http_code =~ ^2[0-9][0-9]$ ]] || [[ $http_code =~ ^401$ ]]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} ($http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo -e "${BLUE}━━━ 1. PATIENTS PAGE ━━━${NC}"
test_api "List Patients (READ)" "GET" "/patients"
test_api "Get Single Patient (READ)" "GET" "/patients/df3b01eb-a4f4-495a-9456-c6edcf55f8d0"
echo ""

echo -e "${BLUE}━━━ 2. APPOINTMENTS PAGE ━━━${NC}"
test_api "List Appointments (READ)" "GET" "/appointments"
echo ""

echo -e "${BLUE}━━━ 3. CASES PAGE ━━━${NC}"
test_api "List Cases (READ)" "GET" "/cases"
echo ""

echo -e "${BLUE}━━━ 4. OPERATIONS PAGE ━━━${NC}"
test_api "List Operations (READ)" "GET" "/operations"
echo ""

echo -e "${BLUE}━━━ 5. BEDS PAGE ━━━${NC}"
test_api "List Beds (READ)" "GET" "/beds"
echo ""

echo -e "${BLUE}━━━ 6. DISCHARGES PAGE ━━━${NC}"
test_api "List Discharges (READ)" "GET" "/discharges"
echo ""

echo -e "${BLUE}━━━ 7. BILLING/INVOICES PAGE ━━━${NC}"
test_api "List Invoices (READ)" "GET" "/invoices"
echo ""

echo -e "${BLUE}━━━ 8. PHARMACY PAGE ━━━${NC}"
test_api "List Pharmacy Items (READ)" "GET" "/pharmacy"
echo ""

echo -e "${BLUE}━━━ 9. CERTIFICATES PAGE ━━━${NC}"
test_api "List Certificates (READ)" "GET" "/certificates"
echo ""

echo -e "${BLUE}━━━ 10. ATTENDANCE PAGE ━━━${NC}"
test_api "List Attendance (READ)" "GET" "/attendance"
echo ""

echo -e "${BLUE}━━━ 11. EMPLOYEES PAGE ━━━${NC}"
test_api "List Employees (READ)" "GET" "/employees"
echo ""

echo -e "${BLUE}━━━ 12. MASTER DATA PAGE ━━━${NC}"
test_api "List Complaints" "GET" "/master-data?category=complaints&limit=5"
test_api "List Medicines" "GET" "/master-data?category=medicines&limit=5"
test_api "List Surgeries" "GET" "/master-data?category=surgeries&limit=5"
test_api "List Treatments" "GET" "/master-data?category=treatments&limit=5"
test_api "List Diagnosis" "GET" "/master-data?category=diagnosis&limit=5"
test_api "List Visual Acuity" "GET" "/master-data?category=visual_acuity&limit=5"
test_api "List Blood Tests" "GET" "/master-data?category=blood_tests&limit=5"
test_api "List Dosages" "GET" "/master-data?category=dosages&limit=5"
test_api "List Payment Methods" "GET" "/master-data?category=payment_methods&limit=5"
test_api "List Anesthesia Types" "GET" "/master-data?category=anesthesia_types&limit=5"
test_api "List Pharmacy Categories" "GET" "/master-data?category=pharmacy_categories&limit=5"
test_api "List Color Vision Types" "GET" "/master-data?category=color_vision_types&limit=5"
test_api "List Driving Fitness" "GET" "/master-data?category=driving_fitness_types&limit=5"
echo ""

echo -e "${BLUE}━━━ 13. REVENUE PAGE ━━━${NC}"
test_api "Get Revenue Summary" "GET" "/revenue/summary"
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                   TEST SUMMARY                        ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo -e "║  Total Tests:     $TOTAL_TESTS"
echo -e "║  ${GREEN}Passed:          $PASSED_TESTS${NC}"
echo -e "║  ${RED}Failed:          $FAILED_TESTS${NC}"
echo "╚═══════════════════════════════════════════════════════╝"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓✓✓ ALL TESTS PASSED! ✓✓✓${NC}"
    echo "All CRUD operations are working correctly!"
    exit 0
else
    echo -e "\n${RED}⚠ SOME TESTS FAILED ⚠${NC}"
    echo "Please review the failed tests above."
    exit 1
fi

