import { defineConfig, devices } from '@playwright/test';

/**
 * Run of its own for the example application on port 4350, so that the demo
 * suite on 4310 and the interaction tests on 4320 can run next to it
 * undisturbed. The web server builds the library first, because the
 * application compiles against dist/zenit-ui, and then rewrites the sources
 * the pages display.
 */
const PORT = Number(process.env['E2E_PORT'] ?? 4350);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: 'beispiel.spec.ts',
  // Images live as e2e/screenshots/beispiel-<state>-<width>.png. There is no
  // platform in the path, so the baselines belong to one platform only; the CI
  // workflow runs this job on the platform they were recorded on.
  snapshotPathTemplate: 'e2e/screenshots/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
    // The application starts with defaultScheme: 'system'. Without this
    // setting Playwright reports "light" and the default images would be
    // light; the dark scheme is the default of the system (tokens.css).
    colorScheme: 'dark',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `npm run build:lib && node tools/generate-example-snippets.mjs && npx ng serve beispiel-app --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
