# Billing Page - Comprehensive Error and Bug Report

## Test Date
November 29, 2025

## Test Environment
- Application: EYECARE (OptiZen) - Eye Care Management System
- Framework: Next.js 14.2
- Server Port: 3003 (due to port conflicts on 3000-3002)
- Test Method: Playwright MCP + ESLint Analysis

---

## Summary
The billing module has been analyzed for errors and issues. Below is a detailed breakdown of all identified bugs, warnings, and recommendations.

---

## Issues Found

### 1. **Invoice Form Missing Toast Dependency (ERROR)**
**File:** `components/forms/invoice-form-new.tsx`
**Lines:** 243, 409
**Severity:** ⚠️ **HIGH**
**Type:** React Hook Dependency Warning

```
Warning: React Hook React.useEffect has missing dependency: 'toast'. 
Either include it or remove the dependency array.
```

**Impact:** 
- useEffect may not trigger when toast changes
- Can lead to stale closures in form submission handlers
- Potential silent failures in error/success notifications

**Fix:**
```typescript
// Current (WRONG):
React.useEffect(() => {
  // ... code
}, [searchTerm]) // toast is missing

// Should be:
React.useEffect(() => {
  // ... code
}, [searchTerm, toast])
```

---

### 2. **Invoice Form Missing Form Dependency (ERROR)**
**File:** `components/forms/invoice-form-new.tsx`
**Line:** 409
**Severity:** ⚠️ **HIGH**
**Type:** React Hook Dependency Warning

```
Warning: React Hook React.useEffect has missing dependency: 'form'. 
Either include it or remove the dependency array.
```

**Impact:**
- Form state changes may not be tracked properly
- Watchers on form fields might not work correctly
- Data synchronization issues in edit mode

---

### 3. **API Service - Invoice Metrics Endpoint Missing (ERROR)**
**File:** `lib/services/api.ts`
**Lines:** Missing invoicesApi.metrics() method definition
**Severity:** 🔴 **CRITICAL**
**Type:** Missing Implementation

**Issue:** 
The billing page at line 140 calls `invoicesApi.metrics()` but this method is NOT defined in the API service.

```typescript
// In billing/page.tsx (Line 140):
const response = await invoicesApi.metrics()

// But in lib/services/api.ts, the invoicesApi object is incomplete:
export const invoicesApi = {
  list: (params: InvoiceFilters = {}) => ...,
  getById: (id: string) => ...,
  create: (data: ...) => ...,
  update: (id: string, data: ...) => ...,
  delete: (id: string) => ...,
  // ❌ metrics() method is MISSING!
}
```

**Fix Required:**
Add metrics method to invoicesApi:
```typescript
export const invoicesApi = {
  // ... existing methods
  metrics: (params: { date_from?: string; date_to?: string } = {}): Promise<ApiResponse<InvoiceMetrics>> => {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, String(value))
    })
    const query = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiService.fetchApi<InvoiceMetrics>(`/invoices/metrics${query}`)
  },
}
```

---

### 4. **Missing Invoice Metrics Type Definition (ERROR)**
**File:** `lib/services/api.ts`
**Severity:** 🔴 **CRITICAL**
**Type:** Missing Type Definition

**Issue:**
The `InvoiceMetrics` type is used in the billing page but not defined in the API service.

```typescript
// Used in billing/page.tsx:
const [metrics, setMetrics] = React.useState<InvoiceMetrics | null>(null)

// But InvoiceMetrics is NOT exported from lib/services/api.ts
```

**Fix Required:**
Add type definition to api.ts:
```typescript
export interface InvoiceMetrics {
  total_revenue: number
  paid_amount: number
  pending_amount: number
  unpaid_amount: number
  total_invoices: number
  paid_invoices: number
  unpaid_invoices: number
  partial_invoices: number
  overdue_invoices: number
  average_invoice_amount: number
}
```

---

### 5. **Missing Invoice Metrics API Endpoint (ERROR)**
**File:** `app/api/invoices/metrics/route.ts`
**Severity:** 🔴 **CRITICAL**
**Type:** Missing Backend Endpoint

**Issue:**
The frontend calls `/api/invoices/metrics` but there's no route handler for this endpoint.

**Fix Required:**
Create `app/api/invoices/metrics/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/middleware/rbac'

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requirePermission('invoices', 'view')
    if (!authCheck.authorized) {
      return (authCheck as { authorized: false; response: NextResponse }).response
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = supabase
      .from('invoices')
      .select('total_amount, amount_paid, payment_status, status')

    if (dateFrom) {
      query = query.gte('invoice_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('invoice_date', dateTo)
    }

    const { data: invoices, error } = await query

    if (error) {
      throw error
    }

    // Calculate metrics from invoice data
    const metrics = {
      total_revenue: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      paid_amount: invoices.reduce((sum, inv) => sum + inv.amount_paid, 0),
      pending_amount: invoices.reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid), 0),
      unpaid_amount: invoices
        .filter(inv => inv.payment_status === 'unpaid')
        .reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid), 0),
      total_invoices: invoices.length,
      paid_invoices: invoices.filter(inv => inv.payment_status === 'paid').length,
      unpaid_invoices: invoices.filter(inv => inv.payment_status === 'unpaid').length,
      partial_invoices: invoices.filter(inv => inv.payment_status === 'partial').length,
    }

    return NextResponse.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
```

---

### 6. **Invoice Status Mapping Issues (LOGIC ERROR)**
**File:** `app/(dashboard)/billing/page.tsx`
**Lines:** 226-230
**Severity:** ⚠️ **MEDIUM**
**Type:** Logic Error

**Issue:**
The status mapping in `handleUpdateInvoice` doesn't properly handle all statuses.

```typescript
const statusMapping: Record<string, string> = {
  'Draft': 'draft',
  'Paid': 'paid',
  'Pending': 'sent'  // ⚠️ Confusing - 'Pending' maps to 'sent'
}
```

**Problems:**
- Status "Draft" becomes "draft" (good)
- Status "Paid" becomes "paid" (good)
- Status "Pending" becomes "sent" (confusing)
- Missing statuses: 'overdue', 'cancelled'
- Fallback uses `.toLowerCase()` which may not match database values

**Fix:**
```typescript
const statusMapping: Record<string, string> = {
  'draft': 'draft',
  'sent': 'sent',
  'paid': 'paid',
  'overdue': 'overdue',
  'cancelled': 'cancelled',
  // Fallback for display values:
  'Draft': 'draft',
  'Sent': 'sent',
  'Paid': 'paid',
  'Overdue': 'overdue',
  'Cancelled': 'cancelled',
}

const updateData = {
  ...values,
  status: statusMapping[values.status] || values.status?.toLowerCase() || 'draft',
  // ...
}
```

---

### 7. **Payment Status Logic - Missing 'overdue' Handling (LOGIC ERROR)**
**File:** `lib/services/api.ts`
**Lines:** 490-493
**Severity:** ⚠️ **MEDIUM**
**Type:** Incomplete Type Definition

**Issue:**
The `Invoice` interface shows `payment_status` can be 'paid' | 'partial' | 'unpaid', but missing 'overdue'.

```typescript
export interface Invoice {
  // ...
  payment_status: 'paid' | 'partial' | 'unpaid'  // ❌ Missing 'overdue'
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
}
```

**Impact:**
- UI shows 'overdue' badge in paymentStatusStyles (line 69 in billing/page.tsx)
- But TypeScript doesn't recognize it as valid payment_status
- Potential type safety issues

---

### 8. **Missing Invoice Items Validation (ERROR)**
**File:** `app/api/invoices/route.ts`
**Line:** 182
**Severity:** 🔴 **HIGH**
**Type:** Input Validation

**Issue:**
The endpoint validates `items` array but doesn't validate individual item fields:

```typescript
if (!invoice_number || !patient_id || !invoice_date || !total_amount || !Array.isArray(items) || items.length === 0) {
  // ✅ Checks if items is array
  // ❌ But doesn't validate item structure (missing required fields)
}
```

**Fix:**
```typescript
// Validate each item has required fields
const invalidItems = items.filter(item => 
  !item.service || !item.quantity || !item.rate
)

if (invalidItems.length > 0) {
  return NextResponse.json(
    { error: 'Invalid invoice items: missing required fields (service, quantity, rate)' },
    { status: 400 }
  )
}
```

---

### 9. **Invoice Balance Calculation - balance_due Field Not Computed on Fetch (ERROR)**
**File:** `app/api/invoices/route.ts`
**Line:** 101
**Severity:** ⚠️ **MEDIUM**
**Type:** Missing Field Calculation

**Issue:**
The Invoice interface expects `balance_due` field (used in billing page line 455), but it's never returned from the API.

```typescript
// In billing/page.tsx (line 455):
{invoice.balance_due > 0 ? (
  // ...

// But in route.ts, the query doesn't select or calculate balance_due:
const { data: invoices } = await query
// invoices don't have balance_due calculated
```

**Fix:**
Add balance calculation in route.ts GET endpoint:
```typescript
if (invoices && invoices.length > 0) {
  invoices.forEach(invoice => {
    invoice.balance_due = invoice.total_amount - invoice.amount_paid
  })
}
```

---

### 10. **Case-View-Dialog Image Tags (WARNING)**
**File:** `components/dialogs/case-view-dialog.tsx`
**Lines:** 934, 957, 989, 1012
**Severity:** ⚠️ **LOW**
**Type:** Performance Warning

```
Warning: Using `<img>` could result in slower LCP and higher bandwidth. 
Consider using `<Image />` from `next/image`
```

**Impact:**
- Slower page load performance
- Higher bandwidth usage
- Poor Core Web Vitals

---

## ESLint Warnings Summary

| File | Line | Warning | Severity |
|------|------|---------|----------|
| invoice-form-new.tsx | 243 | Missing 'toast' dependency | HIGH |
| invoice-form-new.tsx | 409 | Missing 'form' dependency | HIGH |
| case-view-dialog.tsx | 934, 957, 989, 1012 | Using `<img>` instead of `<Image>` | LOW |
| discharges/page.tsx | 69 | Missing 'toast' dependency | MEDIUM |
| doctor-schedule/page.tsx | 188 | Missing 'selectedDoctorId' dependency | MEDIUM |

---

## Critical Issues Checklist

- [ ] ✅ Add `invoicesApi.metrics()` method to API service
- [ ] ✅ Add `InvoiceMetrics` type definition to API service
- [ ] ✅ Create `/api/invoices/metrics` endpoint
- [ ] ✅ Fix toast dependency in invoice-form-new.tsx line 243
- [ ] ✅ Fix form dependency in invoice-form-new.tsx line 409
- [ ] ✅ Add balance_due calculation in GET /api/invoices
- [ ] ✅ Fix payment_status type to include 'overdue'
- [ ] ✅ Improve status mapping logic in handleUpdateInvoice
- [ ] ✅ Validate invoice items in POST /api/invoices
- [ ] ✅ Replace `<img>` with `<Image>` in case-view-dialog.tsx

---

## Recommended Fixes Priority

### P0 - CRITICAL (Must Fix Before Production)
1. Add missing `invoicesApi.metrics()` method
2. Add missing `InvoiceMetrics` type
3. Create `/api/invoices/metrics` endpoint
4. Fix `balance_due` calculation in invoice GET endpoint

### P1 - HIGH (Should Fix Soon)
1. Fix missing 'toast' and 'form' dependencies in invoice-form-new.tsx
2. Validate invoice items structure in API
3. Fix payment_status type definition to include 'overdue'

### P2 - MEDIUM (Nice to Have)
1. Improve status mapping logic
2. Similar fixes for other pages (discharges, doctor-schedule)
3. Replace `<img>` with `<Image>` for performance

---

## Testing Notes

- Application successfully starts on port 3003
- Login redirects to /auth/login (expected behavior)
- Billing page requires authentication
- All React Hook Form components are properly configured
- Zod schema validation is in place

---

## Conclusion

The billing page has **multiple critical issues** that will cause runtime errors:
1. Missing API metrics endpoint
2. Missing type definitions
3. Missing dependency arrays in useEffect hooks

These must be fixed before the billing functionality can work properly.

