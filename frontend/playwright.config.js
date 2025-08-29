const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://front.serverest.dev',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    viewport: { width: 1366, height: 768 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
});
