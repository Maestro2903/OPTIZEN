### EYECARE stability, tests, and how to run them

This project is a Next.js 14 + TypeScript app backed by Supabase. This document summarizes how to run the main quality gates and how they fit together.

---

### Commands (local)

- **Lint (ESLint + Next.js rules)**

  ```bash
  npm run lint
  ```

- **Build (type‑check + Next.js build)**

  ```bash
  npm run build
  ```

- **Playwright E2E tests**

  ```bash
  # one‑time (already run in this repo, but required on new machines/CI images)
  npx playwright install

  # run all E2E tests
  npx playwright test --reporter=line
  ```

Playwright is configured in `playwright.config.ts` to:

- Start the dev server via `npm run dev`.
- Use `E2E_BASE_URL` (defaults to `http://localhost:3000`).
- Store tests under `tests/e2e/`.

Key suites added:

- `tests/e2e/auth.spec.ts` – auth redirects + login page rendering.
- `tests/e2e/smoke-dashboard.spec.ts` – navigation smoke across core dashboard routes.
- `tests/e2e/patients-appointments.spec.ts` – patients/appointments routes redirect to login when unauthenticated.
- `tests/e2e/operations-billing.spec.ts` – operations/billing/revenue routes redirect to login when unauthenticated.

---

### CI pipeline (GitHub Actions)

A CI workflow is defined in `.github/workflows/ci.yml` and runs on every push/PR to `main`:

1. Install dependencies via `npm ci`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Install Playwright browsers: `npx playwright install --with-deps`.
5. Run all Playwright tests: `npx playwright test --reporter=line`.

Environment variables expected in CI (set as repository secrets):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If these are missing or misconfigured, middleware/auth and any Supabase calls will fail.

---

### Dead code and unused items

Static analysis via `npx knip` has been run and summarized in:

- `docs/DEAD_CODE_AND_UNUSED_REPORT.md`

Use that file as a **guide** for:

- Removing truly unused components, print layouts, and scripts.
- Deciding whether to keep or migrate legacy helpers (e.g. older constants/services).

Always re‑run `npm run lint` (and ideally `npx knip`) after cleanup.

---

### Hardening & prompts

For deeper hardening passes, use:

- `HARDENING_PROMPTS.md`

It contains ready‑to‑use prompts for:

- API route audits (validation, RBAC/RLS, error handling).
- Refactoring large components like `components/forms/operation-form.tsx`.
- Generating additional unit/integration/E2E tests aligned with this codebase.

---

### Suggested workflow for changes

1. Make code changes.
2. Run locally:
   - `npm run lint`
   - `npm run build`
   - `npx playwright test --reporter=line`
3. If touching critical flows (patients, appointments, operations, billing), consider:
   - Running or extending the relevant E2E suites under `tests/e2e/`.
   - Using prompts from `HARDENING_PROMPTS.md` to inspect the affected files.
4. Open a PR and let CI run the full pipeline.






