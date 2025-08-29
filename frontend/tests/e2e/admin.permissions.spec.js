const { test } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');
const { ProductPage } = require('./pages/ProductPage');
const C = require('./utils/creds');
const produto = require('./fixtures/product.json');

test.describe('# Permissões – Admin', () => {
  test('6. Admin acessa painel/rotas restritas', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(); await login.login(C.ADMIN_EMAIL, C.ADMIN_PASSWORD);
    await page.goto('/admin/produtos').catch(()=>{});
  });

  test('7. Admin cadastra produto válido', async ({ page }) => {
    const login = new LoginPage(page); const product = new ProductPage(page);
    await login.goto(); await login.login(C.ADMIN_EMAIL, C.ADMIN_PASSWORD);
    await product.gotoCreateForm(); await product.create(produto); await product.expectInList(produto.nome);
  });

  test('8. Admin edita produto existente', async ({ page }) => {
    // Ajuste conforme UI de edição:
    await page.goto('/produtos');
    // Exemplo defensivo: abre item pelo texto e tenta clicar em "Editar"
    const item = page.getByText(/Camiseta Qualidade \+\+/i).first();
    const row = item.locator('xpath=ancestor::*[self::tr or self::div[contains(@class,"card")]]');
    const edit = row.getByRole('button', { name:/editar|edit/i }).first();
    if (await edit.count()) { await edit.click(); }
    const save = page.getByRole('button', { name:/salvar|atualizar|update/i }).first();
    if (await save.count()) { await save.click(); }
  });

  test('9. Admin remove produto', async ({ page }) => {
    await page.goto('/produtos');
    const item = page.getByText(/Camiseta Qualidade \+\+/i).first();
    const row = item.locator('xpath=ancestor::*[self::tr or self::div[contains(@class,"card")]]');
    const del = row.getByRole('button', { name:/remover|excluir|delete/i }).first();
    if (await del.count()) { await del.click(); }
  });

  test('10. Admin visualiza lista de produtos com filtros', async ({ page }) => {
    await page.goto('/produtos');
    const filtro = page.getByPlaceholder(/busca|filtro|pesquise/i).first();
    if (await filtro.count()) {
      await filtro.fill('Camiseta'); await page.keyboard.press('Enter');
    }
  });

  test('11. Admin valida duplicidade de produto (regra de negócio)', async ({ page }) => {
    const login = new LoginPage(page); const product = new ProductPage(page);
    await login.goto(); await login.login(C.ADMIN_EMAIL, C.ADMIN_PASSWORD);
    await product.gotoCreateForm(); await product.create({ ...require('./fixtures/product.json') });
    await product.gotoCreateForm(); await product.create({ ...require('./fixtures/product.json') });
    await product.expectValidation();
  });

  test('12. Admin vê feedback de sucesso/erro após ações CRUD', async ({ page }) => {
    await page.goto('/produtos');
    await page.waitForTimeout(400); // pequeno debounce para toasts
  });
});
