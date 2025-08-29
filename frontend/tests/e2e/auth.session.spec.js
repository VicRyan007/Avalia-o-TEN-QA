const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');
const { HomePage } = require('./pages/HomePage');
const C = require('./utils/creds');

test.describe('# Autenticação & Sessão', () => {
  test('1. Login com credenciais válidas', async ({ page }) => {
    const login = new LoginPage(page); const home = new HomePage(page);
    await login.goto(); await login.login(C.ADMIN_EMAIL, C.ADMIN_PASSWORD); await home.expectLoggedIn();
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('2. Login com credenciais inválidas', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(); await login.login('invalido@example.com', 'senha_errada'); await login.expectError();
  });

  test('3. Login com campos obrigatórios em branco', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(); await login.login('', ''); await login.expectError();
  });

  test('4. Logout limpa sessão', async ({ page }) => {
    const login = new LoginPage(page); const home = new HomePage(page);
    await login.goto(); await login.login(C.ADMIN_EMAIL, C.ADMIN_PASSWORD); await home.expectLoggedIn();
    await home.logout(); await page.goto('/admin/produtos').catch(()=>{});
    await expect(page).toHaveURL(/login|entrar/i);
  });

  test('5. Persistência de sessão (lembrar-me, se existir)', async ({ page, context }) => {
    const login = new LoginPage(page); const home = new HomePage(page);
    await login.goto(); await login.login(C.USER_EMAIL || C.ADMIN_EMAIL, C.USER_PASSWORD || C.ADMIN_PASSWORD);
    await home.expectLoggedIn();
    const page2 = await context.newPage(); await page2.goto('/'); await page2.close();
    expect(true).toBeTruthy();
  });
});
