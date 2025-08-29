const { test } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');

test.describe('# Validações de campos – Login', () => {
  test('21. Validação de formato de e-mail', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(); await login.login('email_invalido', 'qualquer'); await login.expectError();
  });

  test('22. Validação de tamanho mínimo de senha', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(); await login.login('user@example.com', '1'); await login.expectError();
  });
});
