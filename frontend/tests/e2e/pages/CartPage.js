const { pickFirst } = require('../utils/helpers');

class CartPage {
  constructor(page){ this.page = page; }

  async addFirst(){
    const add = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/adicionar|comprar|add to cart|carrinho/i }),
      () => this.page.locator('[data-testid*=add-to-cart], .btn-add, .add-to-cart')
    ]);
    if (add) await add.first().click().catch(()=>{});
  }

  async open(){
    const open = await pickFirst(this.page, [
      () => this.page.getByRole('link', { name:/carrinho|cart/i }),
      () => this.page.getByRole('button', { name:/carrinho|cart/i }),
      () => this.page.locator('[data-testid*=open-cart], .cart-link, .icon-cart')
    ]);
    if (open) await open.click().catch(()=>{});
    else await this.page.goto('/carrinho').catch(()=>{});
  }

  async increase(){
    const plus = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/(\+|mais|increase)/i }),
      () => this.page.locator('[data-testid*=qty-plus], .qty-plus, .inc')
    ]);
    if (plus) await plus.click().catch(()=>{});
  }

  async decrease(){
    const minus = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/(-|menos|decrease)/i }),
      () => this.page.locator('[data-testid*=qty-minus], .qty-minus, .dec')
    ]);
    if (minus) await minus.click().catch(()=>{});
  }

  async removeItem(){
    const rm = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/remover|excluir|remove/i }),
      () => this.page.locator('[data-testid*=remove], .remove-item, .trash')
    ]);
    if (rm) await rm.click().catch(()=>{});
  }

  async checkout(){
    const go = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/finalizar|checkout|pagar|concluir/i }),
      () => this.page.locator('[data-testid*=checkout], .btn-checkout')
    ]);
    if (go) await go.click().catch(()=>{});
  }
}

module.exports = { CartPage };
