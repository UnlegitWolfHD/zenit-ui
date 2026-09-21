import { defineConfig, devices } from '@playwright/test';

/**
 * Eigener Lauf fuer die Beispiel-App auf Port 4350, damit die Demo-Suite auf
 * 4310 und die Interaktionstests auf 4320 ungestoert daneben laufen. Der
 * Webserver baut zuerst die Library, weil die App gegen dist/zenit-ui
 * kompiliert.
 */
const PORT = Number(process.env['E2E_PORT'] ?? 4350);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: 'beispiel.spec.ts',
  // Bilder liegen als e2e/screenshots/beispiel-<zustand>-<breite>.png.
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
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `npx ng build zenit-ui && npx ng serve beispiel-app --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
