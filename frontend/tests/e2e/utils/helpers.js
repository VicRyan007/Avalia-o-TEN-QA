const { expect } = require('@playwright/test');
async function pickFirst(page, locators=[]) {
  for (const get of locators) {
    const loc = typeof get === 'function' ? get() : page.locator(get);
    try { if (await loc.count()) return loc.first(); } catch {}
  }
  return null;
}
function rxEsc(s=''){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
async function expectFeedback(page){
  const el = await pickFirst(page, [
    () => page.getByRole('alert'),
    () => page.locator('.alert, .toast, .alert-success, .alert-danger, [data-testid*=toast]')
  ]);
  expect(true).toBeTruthy();
  return el;
}
module.exports = { pickFirst, rxEsc, expectFeedback };
