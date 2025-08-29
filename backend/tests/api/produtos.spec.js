const { test, expect, request } = require('@playwright/test');
const { BASE_URL } = require('../utils/env');
const { ensureAdminAndLogin } = require('../utils/auth');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const productSchema = require('../schemas/productList.schema.json');
const ajv = new Ajv({ allErrors: true }); addFormats(ajv);
const validate = ajv.compile(productSchema);

function pname() { return `Produto ${Date.now()}-${Math.floor(Math.random()*100000)}`; }

test.describe('GET /produtos', () => {
  test('listar todos 200 e contrato válido', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const res = await api.get('/produtos');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(validate(body)).toBeTruthy();
  });

  test('filtros por _id, nome, preco, descricao, quantidade', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const res = await api.get('/produtos', { params: { nome: 'a', descricao: 'a', preco: 10, quantidade: 1 } });
    expect([200,400]).toContain(res.status());
  });

  test('tipos inválidos nas queries não quebram', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/produtos', { params: { preco: 'abc', quantidade: -1 } });
    expect([200, 400]).toContain(r.status());
  });

  test('limites de valores e strings', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const long = 'a'.repeat(1001);
    const r = await api.get('/produtos', { params: { nome: long, descricao: long } });
    expect([200,400]).toContain(r.status());
  });
});

test.describe('POST /produtos (admin)', () => {
  test('criar válido com token admin 201/200', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const res = await api.post('/produtos', { data: { nome: pname(), preco: 10, descricao: 'Desc', quantidade: 1 } });
    expect([201,200]).toContain(res.status());
  });

  test('nome duplicado 400/409', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const name = pname();
    const r1 = await api.post('/produtos', { data: { nome: name, preco: 10, descricao: 'D', quantidade: 1 } });
    expect([201,200]).toContain(r1.status());
    const r2 = await api.post('/produtos', { data: { nome: name, preco: 11, descricao: 'E', quantidade: 2 } });
    expect([400,409]).toContain(r2.status());
  });

  test('sem token 401/403', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.post('/produtos', { data: { nome: pname(), preco: 10, descricao: 'D', quantidade: 1 } });
    expect([401,403]).toContain(r.status());
  });

  test('campos inválidos', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const r1 = await api.post('/produtos', { data: { nome: '', preco: -1, descricao: '', quantidade: -1 } });
    const r2 = await api.post('/produtos', { data: { preco: 0, descricao: 'D', quantidade: 0 } });
    expect([400,422]).toContain(r1.status());
    expect([400,422]).toContain(r2.status());
  });

  test('content-type inválido', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token, 'Content-Type': 'text/plain' } });
    const r = await api.post('/produtos', { data: 'x' });
    expect([400,415,422]).toContain(r.status());
  });
});

test.describe('GET /produtos/{id}', () => {
  test('buscar existente 200', async () => {
    const token = await ensureAdminAndLogin();
    const apiA = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const c = await apiA.post('/produtos', { data: { nome: pname(), preco: 10, descricao: 'D', quantidade: 1 } });
    expect([201,200]).toContain(c.status());
    const { _id } = await c.json();
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get(`/produtos/${_id}`);
    expect([200,201]).toContain(r.status());
  });

  test('id inexistente 400/404', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/produtos/000000000000000000000000');
    expect([400,404]).toContain(r.status());
  });

  test('id inválido', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/produtos/abc');
    expect([400,404]).toContain(r.status());
  });
});

test.describe('PUT /produtos/{id} (admin)', () => {
  test('atualizar existente 200/204/400', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const c = await api.post('/produtos', { data: { nome: pname(), preco: 10, descricao: 'D', quantidade: 1 } });
    expect([201,200]).toContain(c.status());
    const { _id, nome, descricao } = await c.json();
    const u = await api.put(`/produtos/${_id}`, { data: { nome, preco: 20, descricao, quantidade: 2 } });
    expect([200,204,400]).toContain(u.status());
  });

  test('id inexistente pode criar 201 ou falhar', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const u = await api.put('/produtos/000000000000000000000000', { data: { nome: pname(), preco: 10, descricao: 'D', quantidade: 1 } });
    expect([201,200,400,404]).toContain(u.status());
  });

  test('nome duplicado 400/409', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const nameA = pname();
    const nameB = pname();
    const a = await api.post('/produtos', { data: { nome: nameA, preco: 10, descricao: 'D', quantidade: 1 } });
    const b = await api.post('/produtos', { data: { nome: nameB, preco: 10, descricao: 'D', quantidade: 1 } });
    expect([201,200]).toContain(a.status());
    expect([201,200]).toContain(b.status());
    const { _id } = await b.json();
    const u = await api.put(`/produtos/${_id}`, { data: { nome: nameA, preco: 10, descricao: 'D', quantidade: 1 } });
    expect([400,409]).toContain(u.status());
  });

  test('sem token 401/403', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.put('/produtos/000000000000000000000000', { data: { nome: pname(), preco: 10, descricao: 'D', quantidade: 1 } });
    expect([401,403]).toContain(r.status());
  });
});

test.describe('DELETE /produtos/{id} (admin)', () => {
  test('excluir produto 200/204', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const c = await api.post('/produtos', { data: { nome: pname(), preco: 10, descricao: 'D', quantidade: 1 } });
    expect([201,200]).toContain(c.status());
    const { _id } = await c.json();
    const d = await api.delete(`/produtos/${_id}`);
    expect([200,204]).toContain(d.status());
  });

  test('repetir exclusão do mesmo id', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const c = await api.post('/produtos', { data: { nome: pname(), preco: 10, descricao: 'D', quantidade: 1 } });
    expect([201,200]).toContain(c.status());
    const { _id } = await c.json();
    await api.delete(`/produtos/${_id}`);
    const d2 = await api.delete(`/produtos/${_id}`);
    expect([200,204,400,404]).toContain(d2.status());
  });

  test('id inválido', async () => {
    const token = await ensureAdminAndLogin();
    const api = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: token } });
    const d = await api.delete('/produtos/abc');
    expect([400,404]).toContain(d.status());
  });

  test('não permite excluir produto que está em carrinho', async () => {
    const adminToken = await ensureAdminAndLogin();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminToken } });

    const prod = await admin.post('/produtos', { data: { nome: `PXC-${Date.now()}`, preco: 30, descricao: 'D', quantidade: 5 } });
    expect([201,200]).toContain(prod.status());
    const idProduto = (await prod.json())._id;

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = `usercart.${Date.now()}@example.com`;
    const user = await anon.post('/usuarios', { data: { nome: 'Buyer', email, password: '123', administrador: 'false' } });
    expect(user.status()).toBe(201);
    const login = await anon.post('/login', { data: { email, password: '123' } });
    expect(login.status()).toBe(200);
    const buyerToken = (await login.json()).authorization;
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: buyerToken } });

    const cart = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto, quantidade: 1 }] } });
    expect([201,200]).toContain(cart.status());

    const delProd = await admin.delete(`/produtos/${idProduto}`);
    expect([400]).toContain(delProd.status());
  });
});
