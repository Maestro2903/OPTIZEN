# ID Generation Pattern - Implementation Guide

**Purpose:** This guide provides a reusable pattern for implementing secure ID generation with race condition handling in all API routes.

---

## 🎯 The Problem

Server-side ID generators have a TOCTOU (Time-Of-Check-Time-Of-Use) race condition:

```typescript
// VULNERABLE PATTERN (DO NOT USE)
const id = await generateId()  // Check: ID available
// <-- RACE WINDOW: Another request can generate same ID
await supabase.insert({ id })  // Use: Insert with ID
```

**Impact:** Under concurrent load, two requests can generate and use the same ID, causing unique constraint violations.

---

## ✅ The Solution: Retry Pattern

**Key Insight:** Database unique constraints are the ultimate protection. Code must detect constraint violations and retry.

### Pattern Overview
1. Generate ID
2. Attempt insert
3. If unique constraint violation → retry with new ID
4. If other error → fail immediately
5. If success → return

---

## 📝 Implementation Template

Use this template for all routes that create resources with generated IDs:

```typescript
// POST /api/{resource} - Create resource with retry logic
export async function POST(request: NextRequest) {
  // Authorization check
  const authCheck = await requirePermission('{resource}', 'create')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const { field1, field2, ... } = body
    if (!field1 || !field2) {
      return NextResponse.json(
        { error: 'Missing required fields: field1, field2' },
        { status: 400 }
      )
    }

    // Validate all fields BEFORE attempting insert
    // (do all validation here to avoid wasted retries)

    // INSERT WITH RETRY LOGIC
    const maxAttempts = 3
    let lastError: any = null
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Generate ID
        const resource_id = await generate{Resource}Id()
        
        // Attempt insert
        const { data: resource, error } = await supabase
          .from('{resources}')
          .insert([
            {
              resource_id,
              field1,
              field2,
              created_by: context.user_id,
              status: 'active'
            }
          ])
          .select()
          .single()

        // Check for unique constraint violation
        if (error) {
          // PostgreSQL unique_violation error code
          if (error.code === '23505' && error.message?.includes('resource_id')) {
            lastError = error
            console.warn(
              `{Resource} ID collision: ${resource_id} (attempt ${attempt + 1}/${maxAttempts})`,
              { error: error.message }
            )
            
            // Retry if not last attempt
            if (attempt < maxAttempts - 1) {
              // Exponential backoff: 50ms, 100ms, 200ms
              await new Promise(resolve => 
                setTimeout(resolve, 50 * Math.pow(2, attempt))
              )
              continue
            }
            
            // Max attempts reached
            console.error('Failed to generate unique {resource} ID after max attempts', {
              attempts: maxAttempts,
              lastError: error.message
            })
            return NextResponse.json(
              { 
                error: 'Failed to create {resource}: Unable to generate unique ID',
                details: 'Maximum retry attempts exceeded. Please try again.'
              },
              { status: 503 } // Service Unavailable (temporary)
            )
          }
          
          // Other database errors (not collision)
          console.error('Database error creating {resource}:', error)
          return NextResponse.json(
            { error: 'Failed to create {resource}', details: error.message },
            { status: 500 }
          )
        }

        // SUCCESS!
        console.info('{Resource} created successfully', { 
          resource_id: resource?.resource_id,
          attempt: attempt + 1
        })
        
        return NextResponse.json({
          success: true,
          data: resource,
          message: '{Resource} created successfully'
        }, { status: 201 })
        
      } catch (error) {
        lastError = error
        console.error(`Error on attempt ${attempt + 1}:`, error)
        
        // If last attempt, fall through
        if (attempt === maxAttempts - 1) {
          break
        }
        
        // Retry with backoff
        await new Promise(resolve => 
          setTimeout(resolve, 50 * Math.pow(2, attempt))
        )
      }
    }
    
    // All attempts failed
    console.error('All {resource} creation attempts failed', { lastError })
    return NextResponse.json(
      { 
        error: 'Failed to create {resource} after multiple attempts',
        details: lastError instanceof Error ? lastError.message : 'Unknown error'
      },
      { status: 500 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🔧 Route-Specific Implementations

### 1. Cases Route (`app/api/cases/route.ts`)

```typescript
// Generate case number (has TOCTOU)
const case_no = await generateCaseNumber()

// Check for collision on encounters.case_no
if (error.code === '23505' && error.message?.includes('case_no')) {
  // Retry logic
}
```

### 2. Employees Route (`app/api/employees/route.ts`)

```typescript
// Generate employee ID (has TOCTOU)
const employee_id = await generateEmployeeId()

// Check for collision on employees.employee_id
if (error.code === '23505' && error.message?.includes('employee_id')) {
  // Retry logic
}
```

### 3. Operations Route (`app/api/operations/route.ts`)

```typescript
// Generate operation ID (has TOCTOU)
const operation_id = await generateOperationId()

// Check for collision on surgeries.surgery_id
if (error.code === '23505' && error.message?.includes('surgery_id')) {
  // Retry logic
}
```

### 4. Invoices Route (`app/api/invoices/route.ts`)

```typescript
// Generate invoice number (ATOMIC - no retry needed!)
const invoice_number = await generateInvoiceNumber()

// No retry logic needed - database sequence guarantees uniqueness
const { data, error } = await supabase
  .from('invoices')
  .insert([{ invoice_number, ... }])

if (error) {
  // This should never be a collision
  return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
}
```

---

## ⚙️ Configuration Options

### Retry Attempts
```typescript
const maxAttempts = 3  // Standard for most routes
// Use 5 for high-collision risk scenarios
```

### Backoff Strategy
```typescript
// Exponential backoff (recommended)
await new Promise(resolve => 
  setTimeout(resolve, 50 * Math.pow(2, attempt))
)
// Results: 50ms, 100ms, 200ms

// Linear backoff (alternative)
await new Promise(resolve => 
  setTimeout(resolve, 100 * (attempt + 1))
)
// Results: 100ms, 200ms, 300ms
```

### HTTP Status Codes
- **503 Service Unavailable** - Max retries exceeded (temporary condition, client should retry)
- **500 Internal Server Error** - Unexpected database error (permanent failure)
- **201 Created** - Success

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Single creation succeeds
- [ ] Validation errors return 400
- [ ] Authorization failures return 403
- [ ] Database errors return 500

### Integration Tests
- [ ] Concurrent creation (10 requests) - no duplicates
- [ ] Collision detection triggers retry
- [ ] Max attempts returns 503
- [ ] Retry backoff timing

### Load Tests
```bash
# Concurrent creation test
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/{resource} \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"field1": "value"}' &
done
wait

# Check for duplicates
psql -c "SELECT resource_id, COUNT(*) FROM {resources} GROUP BY resource_id HAVING COUNT(*) > 1"
# Should return 0 rows
```

---

## 📊 Monitoring & Alerts

### Metrics to Track
```typescript
// Log these in production
{
  metric: 'id_generation_collision',
  resource: '{resource}',
  attempt: 2,
  resource_id: 'CASE-2025-12345ABC'
}

{
  metric: 'id_generation_max_retries',
  resource: '{resource}',
  max_attempts: 3
}
```

### Alert Thresholds
- **Warning:** >1% collision rate (investigate)
- **Critical:** >5% collision rate or any max_retries (urgent fix needed)

---

## 🚨 Common Pitfalls

### ❌ DON'T: Generate ID outside retry loop
```typescript
// BAD - ID generated once, retries use same ID
const id = await generateId()
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await insert(id)  // Always fails after first collision
}
```

### ✅ DO: Generate new ID on each attempt
```typescript
// GOOD - New ID on each retry
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  const id = await generateId()  // Fresh ID
  await insert(id)
}
```

### ❌ DON'T: Skip validation before retry loop
```typescript
// BAD - Validation in loop wastes retries
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  if (!email.includes('@')) return error  // Validates every attempt!
  await insert()
}
```

### ✅ DO: Validate before retry loop
```typescript
// GOOD - Validate once
if (!email.includes('@')) return error
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await insert()
}
```

---

## 🎓 Advanced: Database-Level Solutions

### Option 1: Move ID Generation to Database (BEST)
```sql
-- Create sequence function (like invoices)
CREATE FUNCTION get_next_{resource}_id() RETURNS TEXT AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT nextval('{resource}_seq') INTO next_num;
  RETURN '{PREFIX}-' || next_num;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Use in TypeScript
const id = await supabase.rpc('get_next_{resource}_id')
// No retries needed - atomic!
```

### Option 2: Trigger-Based Generation
```sql
-- Auto-generate ID on insert
CREATE OR REPLACE FUNCTION generate_{resource}_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resource_id IS NULL THEN
    NEW.resource_id := 'PREFIX-' || nextval('{resource}_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_{resource}_id
  BEFORE INSERT ON {resources}
  FOR EACH ROW
  EXECUTE FUNCTION generate_{resource}_id();
```

```typescript
// Insert without ID - database generates it
const { data } = await supabase
  .from('{resources}')
  .insert([{ field1, field2 }])  // No resource_id!
  .select()
// resource_id auto-generated by trigger
```

---

## 📚 Additional Resources

- **PostgreSQL Error Codes:** https://www.postgresql.org/docs/current/errcodes-appendix.html
- **Supabase RPC Functions:** https://supabase.com/docs/guides/database/functions
- **CodeRabbit Review:** See `CODERABBIT_REVIEW.md` for original findings

---

## 🔄 Migration Path

### Immediate (This Sprint)
1. ✅ Patients route - **DONE** (has retry logic)
2. ⚠️ Cases route - **TODO** (implement retry pattern)
3. ⚠️ Employees route - **TODO** (implement retry pattern)
4. ⚠️ Operations route - **TODO** (implement retry pattern)
5. ✅ Invoices route - **DONE** (uses database sequence)

### Future Enhancement
6. Consider moving all ID generation to database sequences
7. Add comprehensive load testing
8. Implement monitoring dashboard

---

*Last Updated: November 8, 2025*  
*Status: Pattern established, rollout in progress*
