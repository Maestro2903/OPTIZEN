# API Route Fix Pattern - RBAC Integration

## Pattern to Apply to All API Routes

### Files to Update (10 total)
1. ✅ `/api/patients/[id]/route.ts` - COMPLETED
2. `/api/appointments/[id]/route.ts`
3. `/api/cases/[id]/route.ts`
4. `/api/invoices/[id]/route.ts`
5. `/api/employees/[id]/route.ts`
6. `/api/operations/[id]/route.ts`
7. `/api/discharges/[id]/route.ts`
8. `/api/certificates/[id]/route.ts`
9. `/api/beds/[id]/route.ts`
10. `/api/master-data/[id]/route.ts`

---

## Changes Required for Each File

### 1. Add RBAC Import
```typescript
// At the top of the file
import { requirePermission } from '@/lib/middleware/rbac'
```

### 2. Replace Session Checks with RBAC (GET Handler)
**BEFORE:**
```typescript
export async function GET(request: NextRequest, { params }: ...) {
  try {
    const supabase = createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
```

**AFTER:**
```typescript
export async function GET(request: NextRequest, { params }: ...) {
  // Authorization check
  const authCheck = await requirePermission('RESOURCE_NAME', 'view')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params
```

### 3. Replace Session Checks with RBAC (PUT Handler)
**BEFORE:**
```typescript
export async function PUT(request: NextRequest, { params }: ...) {
  try {
    const supabase = createClient()
    const { id } = await params
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
```

**AFTER:**
```typescript
export async function PUT(request: NextRequest, { params }: ...) {
  // Authorization check
  const authCheck = await requirePermission('RESOURCE_NAME', 'edit')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params
```

### 4. Replace Session Checks with RBAC (DELETE Handler)
**BEFORE:**
```typescript
export async function DELETE(request: NextRequest, { params }: ...) {
  try {
    const supabase = createClient()
    const { id } = await params
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
```

**AFTER:**
```typescript
export async function DELETE(request: NextRequest, { params }: ...) {
  // Authorization check
  const authCheck = await requirePermission('RESOURCE_NAME', 'delete')
  if (!authCheck.authorized) return authCheck.response
  const { context } = authCheck

  try {
    const supabase = createClient()
    const { id } = await params
```

### 5. Replace `session.user.id` with `context.user_id`
Find and replace all instances of:
- `session.user.id` → `context.user_id`
- `updated_by: session.user.id` → `updated_by: context.user_id`
- `created_by: session.user.id` → `created_by: context.user_id`

### 6. Remove Manual Authorization Checks
Remove custom authorization logic like:
```typescript
// Remove these types of checks
const isAuthorized = appointment.created_by === session.user.id || ...
if (!isAuthorized) { return ... }
```

RBAC middleware already handles authorization at the resource level.

---

## Resource Name Mapping

| API Route | Resource Name (for RBAC) |
|-----------|-------------------------|
| patients | `'patients'` |
| appointments | `'appointments'` |
| cases | `'cases'` |
| invoices | `'invoices'` |
| employees | `'employees'` |
| operations | `'operations'` |
| discharges | `'discharges'` |
| certificates | `'certificates'` |
| beds | `'beds'` |
| master-data | `'master_data'` |

---

## Example: Complete Updated File

See `/api/patients/[id]/route.ts` for the complete working example.

Key changes:
1. ✅ Import `requirePermission`
2. ✅ Use RBAC at start of each handler
3. ✅ Replace `session.user.id` with `context.user_id`
4. ✅ Remove redundant auth checks
5. ✅ Keep business logic intact

