### Cursor / Claude hardening prompts for EYECARE

Use these ready‑made prompts in Cursor/Claude to systematically improve stability, find bugs, and generate tests.

---

### 1. Diagnostic: scan a module for bugs and edge cases

**Prompt: API route deep scan**

> You are reviewing a production‑grade Next.js + Supabase API route from the EYECARE app.  
> 1. Identify all potential bugs, race conditions, missing null/undefined checks, and security issues (especially around RBAC and RLS).  
> 2. Check that all query parameters are validated and constrained (pagination, sorting, filters).  
> 3. Check that errors are logged and returned with consistent JSON shapes.  
> 4. Propose concrete, minimal patches to fix issues.  
> 
> Here is the file:
> ```ts
> // paste route file here, e.g. app/api/appointments/route.ts
> ```

**Prompt: complex component / form review**

> You are reviewing a complex React client component from the EYECARE dashboard (Next.js 14, React 18, react-hook-form, zod).  
> 1. Find bugs in state management, effects, and async calls.  
> 2. Call out missing loading/error states or race conditions.  
> 3. Check form validation vs the corresponding API schema (zod / server validation).  
> 4. Suggest small refactors that do NOT change behavior but improve readability and safety.  
> 
> Component:
> ```tsx
> // paste component, e.g. components/forms/operation-form.tsx
> ```

---

### 2. Dead code / unused items analysis

**Prompt: verify if a file can be safely removed**

> In this Next.js 14 + TypeScript monorepo, I want to know if the following file is safe to delete or should be moved to `legacy/`.  
> 1. Search for all imports/usages (including dynamic imports).  
> 2. Check if any routes, API handlers, or print layouts depend on it indirectly.  
> 3. Decide: keep, move to `legacy/`, or delete.  
> 4. If keep, explain why.  
> 
> File to check: `components/print/employee-print.tsx`

**Prompt: turn knip output into an actionable cleanup plan**

> Here is the `docs/DEAD_CODE_AND_UNUSED_REPORT.md` for this project.  
> 1. Group unused files into: safe to delete, probably legacy, and needs manual inspection.  
> 2. For each group, list the exact paths.  
> 3. Generate a step‑by‑step cleanup checklist (can be followed in small PRs).  
> 
> ```md
> // paste docs/DEAD_CODE_AND_UNUSED_REPORT.md
> ```

---

### 3. Refactor prompts for complex components

**Prompt: safely refactor a large form into smaller pieces**

> This is a large React form component using `react-hook-form` + `zod` in the EYECARE dashboard.  
> Goals:  
> - Do NOT change behavior or props.  
> - Extract clearly‑scoped subcomponents (e.g. patient selector, payment section, follow‑up section).  
> - Keep validation schema (`zod`) as the single source of truth.  
> - Ensure type safety is preserved.  
> 
> Step 1: Propose a refactor plan (file names, components, responsibilities).  
> Step 2: Show the exact patches for the first extraction only.  
> 
> ```tsx
> // paste components/forms/operation-form.tsx
> ```

**Prompt: tighten React hooks and effects**

> For the following dashboard component, review all `useEffect`, `useCallback`, and `useMemo` hooks.  
> - Fix missing dependencies (react-hooks/exhaustive-deps).  
> - Avoid recreating functions/arrays on every render.  
> - Keep behavior identical; if behavior must change, explain clearly.  
> 
> ```tsx
> // paste any dashboard page or component
> ```

---

### 4. Test‑generation prompts (unit/integration/E2E)

**Prompt: generate Playwright E2E tests for a protected route**

> The app uses Next.js middleware + Supabase auth to protect dashboard routes (see `middleware.ts`).  
> Please write Playwright tests that:  
> 1. Verify unauthenticated users hitting the route are redirected to `/auth/login`.  
> 2. (Optional) Sketch how we would test the happy path once we have a seeded test user and login helper.  
> 
> Use the existing patterns from:  
> - `tests/e2e/auth.spec.ts`  
> - `tests/e2e/smoke-dashboard.spec.ts`  
> 
> Route to cover: `/app/(dashboard)/patients/page.tsx`

**Prompt: generate API‑level tests for a route**

> For this Next.js Route Handler, generate TypeScript tests using your preferred runner (Vitest/Jest) that:  
> - Hit the handler via `NextRequest` mocks.  
> - Cover success, validation error, and server error paths.  
> - Assert both JSON shape and HTTP status codes.  
> 
> ```ts
> // paste a route handler, e.g. app/api/patients/route.ts
> ```

**Prompt: focused E2E flow (patients + appointments)**

> Using Playwright for the EYECARE dashboard, design an end‑to‑end test plan for:  
> 1. Creating a patient.  
> 2. Creating an appointment for that patient.  
> 3. Verifying the appointment appears in the appointments list with correct date/time/status.  
> 4. Cancelling the appointment and verifying status + UI.  
> 
> Output:  
> - A bullet list test plan.  
> - A skeleton `tests/e2e/patient-appointment-flow.spec.ts` file following the existing test style.

---

### 5. Stability / regression guardrails

**Prompt: regression checklist for a change**

> I’m about to change the following file in the EYECARE app.  
> - List the risk areas (APIs, DB tables, UI flows) that this file touches.  
> - Propose a short regression checklist (manual + automated) I should run after the change.  
> - If there are missing tests, suggest the highest‑value ones to add.  
> 
> ```ts
> // paste file to be changed
> ```

**Prompt: stability review for a feature**

> For the patients + appointments feature set in this project, act as a senior QA/stability engineer.  
> - Identify the top 10 failure modes (e.g. invalid data, race conditions, RLS/RBAC misconfig).  
> - For each, suggest:  
>   - A defensive coding change (validation/guard/logging).  
>   - A test (unit/integration/E2E) that would catch it.  
> - Keep answers specific to this codebase (Next.js 14 app router, Supabase, Playwright).






