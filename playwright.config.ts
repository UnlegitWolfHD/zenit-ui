import { defineConfig, devices } from '@playwright/test';

/**
 * Demo-App auf einem eigenen Port, damit ein laufendes `ng serve` nicht stoert.
 * `E2E_PORT` legt einen abweichenden Port fest; dann startet der Lauf immer
 * einen eigenen Server, statt einen fremden mitzubenutzen.
 */
const EIGENER_PORT = process.env['E2E_PORT'];
const PORT = Number(EIGENER_PORT ?? 4310);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  // Bilder liegen als e2e/screenshots/<route>-<breite>.png. Ohne {platform}:
  // geprueft wird nur unter Windows.
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
    command: `npx ng serve ui-demo --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'] && !EIGENER_PORT,
    timeout: 300_000,
  },
});
