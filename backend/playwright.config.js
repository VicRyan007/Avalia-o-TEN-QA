const config = {
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { extraHTTPHeaders: { 'Content-Type': 'application/json' }, trace: 'retain-on-failure' }
};
module.exports = config;
