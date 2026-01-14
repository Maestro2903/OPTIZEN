### Dead code and unused items snapshot

This file summarizes the most relevant findings from running `npx knip` on the main app (excluding the `WEBSITE` marketing project and `.next` artifacts).

#### Unused application files (manual review recommended before deletion)

- `components/features/patients/patient-search-selector.tsx`
- `components/features/revenue/revenue-charts.tsx`
- `components/forms/certificate-forms.tsx`
- `components/forms/pharmacy-item-form.tsx`
- `components/index.ts`
- `components/print/attendance-print.tsx`
- `components/print/bed-print.tsx`
- `components/print/certificate-print.tsx`
- `components/print/employee-print.tsx`
- `components/ui/accordion.tsx`
- `components/ui/breadcrumb.tsx`
- `components/ui/command.tsx`
- `components/ui/progress.tsx`
- `lib/constants/medical.ts`
- `lib/constants/operationsMock.ts`
- `lib/constants/roles.ts`
- `lib/services/api-client.ts`
- `scripts/create-test-users.ts`
- `scripts/reset-superadmin-password.js`
- `scripts/reset-superadmin-password.ts`
- `scripts/reset-test-user-passwords.ts`

These are **candidates for deletion or consolidation**. Some may be kept intentionally (for example, scripts used manually, or components reserved for future UI work). Before removing any file:

1. Search for imports/usages across the repo.
2. Confirm it is not referenced dynamically (e.g. via `import()` or string-based routing).
3. If still unused, either:
   - Delete it, or
   - Move it under a `legacy/` or `playground/` area with a short comment.

#### Unused dependencies (from `package.json`)

- `@radix-ui/react-accordion`
- `@radix-ui/react-progress`
- `@tanstack/react-table`
- `cmdk`
- `framer-motion`
- `zustand`

Before uninstalling any of these:

- Re-run `npx knip` after code changes.
- Search for *dynamic* usage (for example, if a dependency is only required in a script or imported with a variable).

#### Unused devDependencies

- `picomatch`

#### Notes

- The `WEBSITE/` subproject and its `.next` build output are intentionally treated as a **separate Next.js app** and not cleaned up here.
- This report is meant to be regenerated periodically; treat it as a **guide for safe cleanup**, not an automatic delete list.






