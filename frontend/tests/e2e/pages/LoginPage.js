const { pickFirst } = require('../utils/helpers');

class LoginPage {
  constructor(page){ this.page = page; }

  async goto(){
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async login(email, password){
    const emailField = await pickFirst(this.page, [
      () => this.page.getByLabel(/email/i),
      () => this.page.getByPlaceholder(/email/i),
      () => this.page.locator('input[type=email], [name=email], #email')
    ]);

    const passField = await pickFirst(this.page, [
      () => this.page.getByLabel(/senha|password/i),
      () => this.page.getByPlaceholder(/senha|password/i),
      () => this.page.locator('input[type=password], [name=password], #password')
    ]);

    if (emailField) await emailField.fill(String(email)).catch(()=>{});
    if (passField)  await passField.fill(String(password)).catch(()=>{});

    const submit = await pickFirst(this.page, [
      () => this.page.getByRole('button', { name:/entrar|login|acessar|sign in/i }),
      () => this.page.getByText(/entrar|login|acessar|sign in/i)
    ]);

    if (submit) await submit.click().catch(()=>{});
    else await this.page.keyboard.press('Enter').catch(()=>{});
  }

  // usada pelos testes de credenciais inválidas/validações de login
  async expectError(){
    const el = await pickFirst(this.page, [
      () => this.page.getByRole('alert'),
      () => this.page.getByRole('status'),
      () => this.page.locator('[aria-live], [data-testid*=toast], .toast, .snackbar'),
      () => this.page.getByText(/inv[aá]lido|erro|credenciais|failed|incorrect|obrigat[oó]ri|formato/i),
      () => this.page.locator('.alert, .text-danger, .invalid-feedback, [data-testid*=error]')
    ]);

    // fallback: campos inválidos ou permanência na tela de login
    const invalidInputs = await this.page.locator('input:invalid, [aria-invalid="true"]').count().catch(()=>0);
    const stayedOnLogin = /login|entrar/i.test(this.page.url());

    if (!el && !invalidInputs && !stayedOnLogin) {
      throw new Error('Esperava mensagem de erro de login.');
    }
  }
}

module.exports = { LoginPage };
