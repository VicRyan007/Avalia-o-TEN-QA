const { test, expect, request } = require('@playwright/test');
const { BASE_URL } = require('../utils/env');
const { ensureAdminAndLogin } = require('../utils/auth');

async function novoUsuario(context) {
  const email = `buyer.${Date.now()}@example.com`;
  const res = await context.post('/usuarios', { data: { nome: 'Buyer', email, password: '123', administrador: 'false' } });
  expect([201,400]).toContain(res.status());
  return email;
}

async function login(context, email, password) {
  const res = await context.post('/login', { data: { email, password } });
  expect(res.status()).toBe(200);
  const b = await res.json(); return b.authorization;
}

async function novoProduto(apiAuth, nome, quantidade=2) {
  const r = await apiAuth.post('/produtos', { data: { nome, preco: 50, descricao: 'D', quantidade } });
  expect([201,200]).toContain(r.status());
  return (await r.json())._id;
}

test.describe('Carrinhos', () => {
  test('listar carrinhos 200', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/carrinhos');
    expect(r.status()).toBe(200);
  });

  test('criar carrinho válido 201 e concluir compra', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });
    const prodId = await novoProduto(admin, `P-${Date.now()}`, 5);

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });

    const cart = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 1 }] } });
    expect([201,200]).toContain(cart.status());

    const conclude = await buyer.delete('/carrinhos/concluir-compra');
    expect([200,201,204]).toContain(conclude.status());
  });

  test('produto duplicado no array retorna erro', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });
    const prodId = await novoProduto(admin, `P-${Date.now()}`, 5);

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });

    const bad = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 1 }, { idProduto: prodId, quantidade: 1 }] } });
    expect([400,409,422]).toContain(bad.status());
  });

  test('segundo carrinho para mesmo usuário retorna erro', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });
    const prodId = await novoProduto(admin, `P-${Date.now()}`, 5);

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });

    const c1 = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 1 }] } });
    expect([201,200]).toContain(c1.status());
    const c2 = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 1 }] } });
    expect([400,409,422]).toContain(c2.status());
  });

  test('produto inexistente ou id inválido', async () => {
    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const bad1 = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: '000000000000000000000000', quantidade: 1 }] } });
    const bad2 = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: 'abc', quantidade: 1 }] } });
    expect([400,404,422]).toContain(bad1.status());
    expect([400,404,422]).toContain(bad2.status());
  });

  test('estoque insuficiente', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });
    const prodId = await novoProduto(admin, `P-${Date.now()}`, 1);

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });

    const bad = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 9999 }] } });
    expect([400,409,422]).toContain(bad.status());
  });

  test('concluir e idempotência', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });
    const prodId = await novoProduto(admin, `P-${Date.now()}`, 5);

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });

    const c = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 1 }] } });
    expect([201,200]).toContain(c.status());
    const d1 = await buyer.delete('/carrinhos/concluir-compra');
    expect([200,201,204]).toContain(d1.status());
    const d2 = await buyer.delete('/carrinhos/concluir-compra');
    expect([200,201,204]).toContain(d2.status());
  });

  test('cancelar e idempotência', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });
    const prodId = await novoProduto(admin, `P-${Date.now()}`, 5);

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });

    const c = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 1 }] } });
    expect([201,200]).toContain(c.status());
    const d1 = await buyer.delete('/carrinhos/cancelar-compra');
    expect([200,201,204]).toContain(d1.status());
    const d2 = await buyer.delete('/carrinhos/cancelar-compra');
    expect([200,201,204]).toContain(d2.status());
  });

  test('sem token retorna 401 em operações protegidas', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.post('/carrinhos', { data: { produtos: [] } });
    expect([401]).toContain(r.status());
  });

  test('buscar carrinho por ID existente', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });
    const prodId = await novoProduto(admin, `P-${Date.now()}`, 3);

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = await novoUsuario(anon);
    const token = await login(anon, email, '123');
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });

    const cart = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto: prodId, quantidade: 1 }] } });
    expect([201,200]).toContain(cart.status());
    const cartId = (await cart.json())._id;

    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get(`/carrinhos/${cartId}`);
    expect([200]).toContain(r.status());
  });

  test('buscar carrinho por ID inexistente', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/carrinhos/000000000000000000000000');
    expect([400,404]).toContain(r.status());
  });
});
