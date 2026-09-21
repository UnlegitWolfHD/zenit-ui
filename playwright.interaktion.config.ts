import { defineConfig, devices } from '@playwright/test';

/**
 * Eigener Lauf fuer die Interaktionstests auf Port 4320, damit die
 * Screenshot-Suite auf 4310 ungestoert daneben laufen kann. Die Tests nutzen
 * nur relative Adressen ueber `baseURL` und laufen deshalb auch mit, wenn die
 * Standard-Konfiguration sie einsammelt.
 */
const PORT = 4320;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'e2e',
  testMatch: 'interaktion.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
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
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
