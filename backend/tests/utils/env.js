module.exports = {
  BASE_URL: process.env.SERVEREST_BASE_URL || 'https://serverest.dev',
  FRONT_URL: process.env.SERVEREST_FRONT_URL || 'https://front.serverest.dev',
  ADMIN: {
    name: process.env.API_ADMIN_NAME || 'Admin QA',
    email: process.env.API_ADMIN_EMAIL || `admin.qa.${Math.floor(Math.random()*999999)}@example.com`,
    password: process.env.API_ADMIN_PASSWORD || '123456'
  }
};
