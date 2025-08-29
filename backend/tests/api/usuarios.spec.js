const { test, expect, request } = require('@playwright/test');
const { BASE_URL } = require('../utils/env');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const schema = require('../schemas/userList.schema.json');
const ajv = new Ajv({ allErrors: true }); addFormats(ajv);
const validate = ajv.compile(schema);

function uid() { return `${Date.now()}${Math.floor(Math.random()*100000)}`; }

test.describe('GET /usuarios', () => {
  test('listar todos retorna 200 e contrato válido', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const res = await api.get('/usuarios');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(validate(body)).toBeTruthy();
  });

  test('filtrar por _id inexistente retorna coerente', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const res = await api.get('/usuarios', { params: { _id: '000000000000000000000000' } });
    expect(res.status()).toBe(200);
  });

  test('filtros por nome, email, password e administrador', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const q = await api.get('/usuarios', { params: { nome: 'a', email: 'a', password: 'a', administrador: 'true' } });
    expect([200, 400]).toContain(q.status());
  });

  test('valores inválidos nas queries não quebram', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/usuarios', { params: { administrador: 'x' } });
    expect([200, 400]).toContain(r.status());
  });

  test('limites e formatos inválidos nas queries', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const long = 'a'.repeat(1001);
    const r = await api.get('/usuarios', { params: { nome: long, email: long, _id: 'abc' } });
    expect([200, 400]).toContain(r.status());
  });
});

test.describe('POST /usuarios', () => {
  test('criar usuário válido 201', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const payload = { nome: `U ${uid()}`, email: `u.${uid()}@example.com`, password: '123456', administrador: 'false' };
    const res = await api.post('/usuarios', { data: payload });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('_id');
  });

  test('email duplicado retorna 400/409', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const email = `u.${uid()}@example.com`;
    const payload = { nome: `U ${uid()}`, email, password: '123456', administrador: 'false' };
    const r1 = await api.post('/usuarios', { data: payload });
    expect(r1.status()).toBe(201);
    const r2 = await api.post('/usuarios', { data: payload });
    expect([400,409]).toContain(r2.status());
  });

  test('campos obrigatórios ausentes', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.post('/usuarios', { data: { nome: 'X' } });
    expect([400,422]).toContain(r.status());
  });

  test('tipos/valores inválidos para administrador', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.post('/usuarios', { data: { nome: 'X', email: `u.${uid()}@example.com`, password: '1', administrador: 'x' } });
    expect([400,422]).toContain(r.status());
  });

  test('limites de nome/email/password', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const long = 'a'.repeat(1001);
    const r = await api.post('/usuarios', { data: { nome: '', email: 'x', password: '', administrador: 'false' } });
    const r2 = await api.post('/usuarios', { data: { nome: long, email: `${long}@example.com`, password: long, administrador: 'false' } });
    expect([400,422]).toContain(r.status());
    expect([400,422]).toContain(r2.status());
  });
});

test.describe('GET /usuarios/{id}', () => {
  test('buscar por ID existente 200', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const c = await api.post('/usuarios', { data: { nome: `U ${uid()}`, email: `u.${uid()}@example.com`, password: '1', administrador: 'false' } });
    expect(c.status()).toBe(201);
    const { _id } = await c.json();
    const r = await api.get(`/usuarios/${_id}`);
    expect([200, 201]).toContain(r.status());
  });

  test('ID inexistente 400/404', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/usuarios/000000000000000000000000');
    expect([400,404]).toContain(r.status());
  });

  test('formato de ID inválido', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const r = await api.get('/usuarios/abc');
    expect([400,404]).toContain(r.status());
  });
});

test.describe('PUT /usuarios/{id}', () => {
  test('atualizar existente 200/204', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const c = await api.post('/usuarios', { data: { nome: `U ${uid()}`, email: `u.${uid()}@example.com`, password: '1', administrador: 'false' } });
    expect(c.status()).toBe(201);
    const { _id } = await c.json();
    const u = await api.put(`/usuarios/${_id}`, { data: { nome: 'Editado', email: `u.${uid()}@example.com`, password: '2', administrador: 'false' } });
    expect([200,204]).toContain(u.status());
  });

  test('id inexistente pode criar 201 ou falhar 400/404', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const u = await api.put('/usuarios/000000000000000000000000', { data: { nome: 'X', email: `u.${uid()}@example.com`, password: '1', administrador: 'false' } });
    expect([201,200,400,404]).toContain(u.status());
  });

  test('email duplicado ao editar 400/409', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const e1 = `u.${uid()}@example.com`;
    const e2 = `u.${uid()}@example.com`;
    const a = await api.post('/usuarios', { data: { nome: 'A', email: e1, password: '1', administrador: 'false' } });
    const b = await api.post('/usuarios', { data: { nome: 'B', email: e2, password: '1', administrador: 'false' } });
    expect(a.status()).toBe(201); expect(b.status()).toBe(201);
    const { _id } = await b.json();
    const u = await api.put(`/usuarios/${_id}`, { data: { nome: 'B', email: e1, password: '1', administrador: 'false' } });
    expect([400,409]).toContain(u.status());
  });
});

test.describe('DELETE /usuarios/{id}', () => {
  test('excluir usuário sem carrinho 200/204', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const c = await api.post('/usuarios', { data: { nome: `U ${uid()}`, email: `u.${uid()}@example.com`, password: '1', administrador: 'false' } });
    expect(c.status()).toBe(201);
    const { _id } = await c.json();
    const d = await api.delete(`/usuarios/${_id}`);
    expect([200,204]).toContain(d.status());
  });

  test('repetir exclusão do mesmo ID', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const c = await api.post('/usuarios', { data: { nome: `U ${uid()}`, email: `u.${uid()}@example.com`, password: '1', administrador: 'false' } });
    expect(c.status()).toBe(201);
    const { _id } = await c.json();
    await api.delete(`/usuarios/${_id}`);
    const d2 = await api.delete(`/usuarios/${_id}`);
    expect([200,204,400,404]).toContain(d2.status());
  });

  test('formato de ID inválido', async () => {
    const api = await request.newContext({ baseURL: BASE_URL });
    const d = await api.delete('/usuarios/abc');
    expect([200,400,404]).toContain(d.status());
  });

  test('não permite excluir usuário com carrinho cadastrado', async () => {
    const adminApiToken = await (await require('../utils/auth').ensureAdminAndLogin)();
    const admin = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: adminApiToken } });

    const produto = await admin.post('/produtos', { data: { nome: `PX-${uid()}`, preco: 10, descricao: 'D', quantidade: 3 } });
    expect([201,200]).toContain(produto.status());
    const idProduto = (await produto.json())._id;

    const anon = await request.newContext({ baseURL: BASE_URL });
    const email = `carrinho.${uid()}@example.com`;
    const user = await anon.post('/usuarios', { data: { nome: 'HasCart', email, password: '123', administrador: 'false' } });
    expect(user.status()).toBe(201);
    const idUsuario = (await user.json())._id;

    const login = await anon.post('/login', { data: { email, password: '123' } });
    expect(login.status()).toBe(200);
    const buyerToken = (await login.json()).authorization;
    const buyer = await request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: buyerToken } });

    const cart = await buyer.post('/carrinhos', { data: { produtos: [{ idProduto, quantidade: 1 }] } });
    expect([201,200]).toContain(cart.status());

    const del = await anon.delete(`/usuarios/${idUsuario}`);
    expect([400]).toContain(del.status());
  });
});
