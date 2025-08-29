const { test } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');
const { ProductPage } = require('./pages/ProductPage');
const C = require('./utils/creds');

test.describe('# Validações de campos – Produto (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(); await login.login(C.ADMIN_EMAIL, C.ADMIN_PASSWORD);
  });

  test('23. Produto sem nome', async ({ page }) => {
    const p = new ProductPage(page);
    await p.gotoCreateForm(); await p.create({ nome:'', preco:'129.9', descricao:'x' }); await p.expectValidation();
  });

  test('24. Produto sem preço', async ({ page }) => {
    const p = new ProductPage(page);
    await p.gotoCreateForm(); await p.create({ nome:'Sem Preco', preco:'', descricao:'x' }); await p.expectValidation();
  });

  test('25. Produto com preço inválido (texto/negativo/zero)', async ({ page }) => {
    const p = new ProductPage(page);
    await p.gotoCreateForm(); await p.create({ nome:'Preco Invalido', preco:'-10', descricao:'x' }); await p.expectValidation();
  });

  test('26. Produto com descrição acima do limite (se houver)', async ({ page }) => {
    const p = new ProductPage(page);
    await p.gotoCreateForm();
    const long = 'x'.repeat(2000);
    await p.create({ nome:'Desc Longa', preco:'10', descricao: long }); await p.expectValidation();
  });

  test('27. Campos com espaços em branco/trim', async ({ page }) => {
    const p = new ProductPage(page);
    await p.gotoCreateForm(); await p.create({ nome:'   ', preco:'   ', descricao:'   ' }); await p.expectValidation();
  });

  test('28. Tipos incorretos (preço com vírgula)', async ({ page }) => {
    const p = new ProductPage(page);
    await p.gotoCreateForm(); await p.create({ nome:'Preco Virgula', preco:'10,00', descricao:'x' }); await p.expectValidation();
  });
});
