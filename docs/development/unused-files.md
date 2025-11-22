# Unused Files Report

This report identifies files in the codebase that are not imported or referenced anywhere in the application.

## Summary

**Total Unused Files Found: 12**
**Files Deleted: 9** (excluding service files as requested)
**Files Kept: 5** (service files preserved)

## Unused Files

### 1. Backup/Old Files

#### `app/(dashboard)/attendance/page-old-backup.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found in codebase
- **Action**: File has been removed

#### `app/(dashboard)/certificates/page-old.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found in codebase
- **Action**: File has been removed

### 2. Replaced Components

#### `components/layout/sidebar.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found. The application uses `components/app-sidebar.tsx` instead
- **Action**: File has been removed

#### `components/invoice-form.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found. The application uses `components/invoice-form-new.tsx` instead
- **Action**: File has been removed

### 3. Unused Component Files

#### `components/nav-projects.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found in codebase
- **Action**: File has been removed

#### `components/team-switcher.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found in codebase
- **Action**: File has been removed

#### `components/optical-item-form.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found in codebase
- **Action**: File has been removed

#### `components/stock-movement-form.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found in codebase
- **Action**: File has been removed

#### `components/bed-details-sheet.tsx`
- **Status**: ✅ DELETED
- **Reason**: No imports found. Note: `bed-details-dialog.tsx` is used instead
- **Action**: File has been removed

### 4. Unused Service Files (KEPT as requested)

#### `lib/services/index.ts`
- **Status**: ⚠️ KEPT (as requested)
- **Reason**: No imports found. The application uses `lib/services/api.ts` directly instead
- **Action**: File preserved per user request

#### `lib/services/patient.service.ts`
- **Status**: ⚠️ KEPT (as requested)
- **Reason**: Only imported by `lib/services/index.ts` (which is also unused)
- **Action**: File preserved per user request

#### `lib/services/appointment.service.ts`
- **Status**: ⚠️ KEPT (as requested)
- **Reason**: Only imported by `lib/services/index.ts` (which is also unused)
- **Action**: File preserved per user request

#### `lib/services/billing.service.ts`
- **Status**: ⚠️ KEPT (as requested)
- **Reason**: Only imported by `lib/services/index.ts` (which is also unused)
- **Action**: File preserved per user request

#### `lib/services/user.service.ts`
- **Status**: ⚠️ KEPT (as requested)
- **Reason**: Only imported by `lib/services/index.ts` (which is also unused)
- **Action**: File preserved per user request

## Notes

- All framework files (Next.js pages, layouts, API routes, middleware) are excluded from this report as they are automatically used by the framework
- Configuration files, migration files, scripts, and type definition files are excluded
- Files in `components/ui/` are assumed to be used (UI component library)
- The application primarily uses `lib/services/api.ts` for API calls, making the individual service files and index file redundant

## Action Items

✅ **Completed Actions:**
1. Deleted 9 unused files (backup files, replaced components, and unused components)
2. Preserved service files as requested

⚠️ **Remaining Considerations:**
1. Service files (`lib/services/*.service.ts` and `index.ts`) are kept but remain unused
2. Consider consolidating service architecture if individual service files are not needed
3. Future cleanup: Review service files to determine if they should be integrated into `api.ts` or removed

## Files to Keep (Even if Unused)

- Scripts in `scripts/` directory (may be run manually)
- Migration files in `supabase/migrations/` (database history)
- Type definition files (`.d.ts`)

---

**Report Generated**: Analysis completed
**Analysis Method**: Static import/reference analysis using grep patterns

