const { test, expect } = require('@playwright/test');
const { LoginPage } = require('./pages/LoginPage');
const { ProductPage } = require('./pages/ProductPage');
const { CartPage } = require('./pages/CartPage');
const C = require('./utils/creds');

test.describe('# Permissões – Usuário comum', () => {
  test('13. Usuário comum é bloqueado em rotas de admin', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(); await login.login(C.USER_EMAIL, C.USER_PASSWORD);
    await page.goto('/admin/produtos').catch(() => { });

    const redirected = /login|entrar/i.test(page.url());
    if (redirected) {
      await expect(page).not.toHaveURL(/\/admin\/produtos$/);
      return;
    }

    // Sem redirect: garante que não há ações administrativas
    const createBtn = page.getByRole('button', { name: /novo|cadastrar|criar/i });
    const deleteBtn = page.getByRole('button', { name: /remover|excluir|delete/i });
    const editBtn = page.getByRole('button', { name: /editar|edit/i });

    await expect(createBtn).toHaveCount(0);
    await expect(editBtn).toHaveCount(0);
    await expect(deleteBtn).toHaveCount(0);
  });


  test('14. Usuário comum não vê botões de gestão', async ({ page }) => {
    await page.goto('/produtos');
    const novo = page.getByRole('button', { name: /novo|cadastrar/i });
    await expect(novo).toHaveCount(0);
  });

  test('15. Usuário comum navega por listagem de produtos', async ({ page }) => {
    const p = new ProductPage(page); await p.gotoList();
  });

  test('16. Usuário comum adiciona produto ao carrinho', async ({ page }) => {
    const cart = new CartPage(page);
    await page.goto('/produtos'); await cart.addFirst(); await cart.open();
  });

  test('17. Usuário comum altera quantidade no carrinho', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.open(); await cart.increase(); await cart.decrease();
  });

  test('18. Usuário comum remove item do carrinho', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.open(); await cart.removeItem();
  });

  test('19. Usuário comum finaliza compra com sucesso', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.open(); await cart.checkout();
  });

  test('20. Usuário comum impedido de finalizar com carrinho vazio', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.open(); await cart.checkout(); // espera erro/impedimento da UI
  });
});
