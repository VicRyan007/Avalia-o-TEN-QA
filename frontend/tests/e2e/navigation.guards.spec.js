const { test, expect } = require('@playwright/test');

test.describe('# Navegação & Guardas de rota', () => {
  test('36. Rota privada sem login: redireciona OU não exibe controles de admin', async ({ page }) => {
    await page.goto('/admin/produtos').catch(()=>{});

    // Caso 1: houve redirect
    if (/login|entrar/i.test(page.url())) {
      await expect(page).toHaveURL(/login|entrar/i);
      return;
    }
    // Caso 2: permaneceu, mas sem ações administrativas
    const createBtn = page.getByRole('button', { name:/novo|cadastrar|criar/i });
    const deleteBtn = page.getByRole('button', { name:/remover|excluir|delete/i });
    const editBtn   = page.getByRole('button', { name:/editar|edit/i });

    await expect(createBtn).toHaveCount(0);
    await expect(editBtn).toHaveCount(0);
    await expect(deleteBtn).toHaveCount(0);
  });

  test('37. Guardas por role: em /admin não autenticado → redirect OU sem controles', async ({ page }) => {
    await page.goto('/admin').catch(()=>{});

    if (/login|entrar|home/i.test(page.url())) {
      await expect(page).toHaveURL(/login|entrar|home/i);
      return;
    }
    const adminActions = page.getByRole('button', { name: /novo|cadastrar|criar|editar|excluir|delete/i });
    await expect(adminActions).toHaveCount(0);
  });
});
