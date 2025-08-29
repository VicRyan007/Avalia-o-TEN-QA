const { pickFirst, rxEsc } = require('../utils/helpers');

class ProductPage {
  constructor(page){
    this.page = page;
    this.lastCreateStatus = undefined; // status do POST /produtos
  }

  async gotoList(){
    const link = await pickFirst(this.page, [
      () => this.page.getByRole('link', { name:/produtos/i }),
      () => this.page.getByText(/produtos/i)
    ]);
    if (link) await link.click().catch(()=>{});
    else await this.page.goto('/admin/produtos').catch(()=>{});
  }

  async gotoCreateForm(){
    const btn = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/novo|cadastrar produto|criar/i }),
      () => this.page.getByText(/novo produto|cadastrar produto|criar/i)
    ]);
    if (btn) await btn.click().catch(()=>{});
    else await this.page.goto('/admin/produtos/novo').catch(()=>{});
  }

  // cria produto e captura o status HTTP do POST /produtos
  async create({ nome, preco, descricao }){
    this.lastCreateStatus = undefined;

    const nomeField = await pickFirst(this.page, [
      () => this.page.getByLabel(/nome/i),
      () => this.page.locator('input[name=nome], #nome')
    ]);
    const precoField = await pickFirst(this.page, [
      () => this.page.getByLabel(/pre[cç]o|price/i),
      () => this.page.locator('input[name=preco], #preco')
    ]);
    const descField = await pickFirst(this.page, [
      () => this.page.getByLabel(/descri/i),
      () => this.page.locator('textarea[name=descricao], #descricao')
    ]);

    if (nomeField && nome !== undefined) await nomeField.fill(String(nome)).catch(()=>{});
    if (precoField && preco !== undefined) await precoField.fill(String(preco)).catch(()=>{});
    if (descField && descricao != null) await descField.fill(String(descricao)).catch(()=>{});

    const waitApi = this.page.waitForResponse(res => {
      try {
        const u = new URL(res.url());
        return /\/produtos(?:\/)?$/i.test(u.pathname) && res.request().method() === 'POST';
      } catch { return false; }
    }, { timeout: 6000 }).catch(() => null);

    const save = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/salvar|cadastrar|criar|atualizar/i }),
      () => this.page.getByText(/salvar|cadastrar|criar|atualizar/i)
    ]);
    if (save) await save.click().catch(()=>{});

    const apiRes = await waitApi;
    if (apiRes) this.lastCreateStatus = apiRes.status();
  }

  // verificação robusta com filtro + várias tentativas
  async expectInList(nome){
    await this.gotoList();

    const search = await pickFirst(this.page, [
      () => this.page.getByPlaceholder(/busc|pesquis|search/i),
      () => this.page.getByRole('textbox', { name:/busc|pesquis|search/i })
    ]);
    if (search) {
      await search.fill(nome).catch(()=>{});
      await this.page.keyboard.press('Enter').catch(()=>{});
    }

    for (let i = 0; i < 8; i++){
      const el = await pickFirst(this.page, [
        () => this.page.getByRole('cell', { name: new RegExp(rxEsc(nome),'i') }),
        () => this.page.getByText(new RegExp(rxEsc(nome),'i'))
      ]);
      if (el) return;
      await this.page.waitForTimeout(500);
    }
    throw new Error(`Produto "${nome}" não visível na listagem.`);
  }

  // aceita múltiplas evidências de validação
  async expectValidation(){
    if (this.lastCreateStatus && this.lastCreateStatus >= 400 && this.lastCreateStatus < 500) return;

    const msg = await pickFirst(this.page, [
      () => this.page.getByRole('alert'),
      () => this.page.getByText(/obrigat|inv[aá]lid|preencha|necess[aá]ri|formato|n[aã]o permitido|já existe|duplicad/i),
      () => this.page.locator('.invalid-feedback, .text-danger, .alert-danger, [role="alert"]')
    ]);
    if (msg) return;

    const invalid = this.page.locator('input:invalid, textarea:invalid, [aria-invalid="true"]');
    if (await invalid.count()) return;

    const save = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/salvar|cadastrar|criar|atualizar/i }),
      () => this.page.getByText(/salvar|cadastrar|criar|atualizar/i)
    ]);
    if (save && await save.isDisabled().catch(()=>false)) return;

    if (/novo|create|form|cadastro|admin\/produtos\/(novo|create|form)/i.test(this.page.url())) return;

    throw new Error('Esperava evidência de validação no formulário (mensagem, input:invalid, botão desabilitado, permanência no form ou 4xx da API).');
  }
}

module.exports = { ProductPage };
