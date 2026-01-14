import type { PlaywrightTestConfig } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
}

export default config






