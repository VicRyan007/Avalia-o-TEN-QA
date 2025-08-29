const { expect } = require('@playwright/test');
const { pickFirst } = require('../utils/helpers');

class HomePage {
  constructor(page){ this.page = page; }

  async expectLoggedIn(){
    await expect(async () => {
      const onLogin = /login|entrar/i.test(this.page.url());

      const [nav, hasLogout, hasProductsLink, hasWelcome, hasCardsOrGrid] = await Promise.all([
        this.page.locator('nav, [role=navigation]').count().catch(()=>0),
        this.page.getByRole('button', { name:/sair|logout/i }).count().catch(()=>0),
        this.page.getByRole('link', { name:/produtos/i }).count().catch(()=>0),
        this.page.getByText(/bem[-\s]?vindo|ol[aá],? |home|dashboard/i).count().catch(()=>0),
        this.page.locator('[data-testid*=card], .card, .grid, .products, [data-testid*=product]').count().catch(()=>0),
      ]);

      expect(!onLogin && (nav || hasLogout || hasProductsLink || hasWelcome || hasCardsOrGrid)).toBeTruthy();
    }).toPass({ timeout: 15000, intervals: [300, 600, 1200] });
  }

  async logout(){
    const btn = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/sair|logout/i }),
      () => this.page.getByText(/sair|logout/i)
    ]);
    if (btn) await btn.click().catch(()=>{});
  }

  async ensureLoggedIn(){
    await this.expectLoggedIn();
  }
}

module.exports = { HomePage };
