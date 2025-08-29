const { request, expect } = require('@playwright/test');
const { BASE_URL, ADMIN } = require('./env');

async function ensureAdminAndLogin() {
  const api = await request.newContext({ baseURL: BASE_URL });
  const create = await api.post('/usuarios', { data: { nome: ADMIN.name, email: ADMIN.email, password: ADMIN.password, administrador: 'true' } });
  expect([201, 400]).toContain(create.status());
  const login = await api.post('/login', { data: { email: ADMIN.email, password: ADMIN.password } });
  expect([200, 401, 400]).toContain(login.status());
  if (login.status() !== 200) throw new Error('Falha ao autenticar admin');
  const body = await login.json();
  expect(body).toHaveProperty('authorization');
  return body.authorization;
}

async function loginAs(email, password) {
  const api = await request.newContext({ baseURL: BASE_URL });
  return api.post('/login', { data: { email, password } });
}

module.exports = { ensureAdminAndLogin, loginAs };
