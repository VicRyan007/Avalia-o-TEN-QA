const { test, expect, request } = require('@playwright/test');
const { BASE_URL } = require('../utils/env');
const { ensureAdminAndLogin } = require('../utils/auth');

test.describe('POST /login', () => {
  test('credenciais válidas retornam 200 e authorization Bearer', async () => {
    const token = await ensureAdminAndLogin();
    expect(token).toMatch(/^Bearer\s.+/);
  });

  test('email/senha inválidos retornam 401/400', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const res = await api.post('/login', { data: { email: `user.${Date.now()}@example.com`, password: 'x' } });
    expect([400,401]).toContain(res.status());
  });

  test('ausência de email e/ou password gera erro de validação', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r1 = await api.post('/login', { data: { email: `u.${Date.now()}@example.com` } });
    const r2 = await api.post('/login', { data: { password: '123' } });
    expect([400,422]).toContain(r1.status());
    expect([400,422]).toContain(r2.status());
  });

  test('formato de email inválido', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.post('/login', { data: { email: 'invalido', password: '123' } });
    expect([400,401,422]).toContain(r.status());
  });

  test('content-type incorreto ou body malformado', async () => {
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { 'Content-Type': 'text/plain' } });
    const r = await api.post('/login', { data: 'email=foo' });
    expect([400, 415, 422]).toContain(r.status());
  });

  test('header Authorization ausente para rota protegida retorna 401/403', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.post('/produtos', { data: { nome: `X ${Date.now()}`, preco: 10, descricao: 'Y', quantidade: 1 } });
    expect([401,403]).toContain(r.status());
  });

  test('limites de email e senha', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const long = 'a'.repeat(1001) + '@example.com';
    const r1 = await api.post('/login', { data: { email: long, password: '123' } });
    const r2 = await api.post('/login', { data: { email: `user.${Date.now()}@example.com`, password: '' } });
    const r3 = await api.post('/login', { data: { email: `user.${Date.now()}@example.com`, password: ' '.repeat(10) } });
    const r4 = await api.post('/login', { data: { email: `user.${Date.now()}@example.com`, password: 'x'.repeat(1000) } });
    expect([400,401,422]).toContain(r1.status());
    expect([400,401,422]).toContain(r2.status());
    expect([400,401,422]).toContain(r3.status());
    expect([400,401,422]).toContain(r4.status());
  });
});
