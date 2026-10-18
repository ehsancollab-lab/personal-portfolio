import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 45000,
  expect: { timeout: 8000 }, reporter: [['list'], ['json', { outputFile: '../work/portfolio-browser/results.json' }]],
  outputDir: '../work/portfolio-browser/artifacts',
  use: { browserName: 'chromium', launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] }, ignoreHTTPSErrors: true, screenshot: 'only-on-failure', trace: 'retain-on-failure', viewport: { width: 1440, height: 1000 } },
  webServer: { command: 'node tests/preview-server.mjs', url: 'http://localhost:4173', reuseExistingServer: true }
});
