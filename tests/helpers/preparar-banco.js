// Executado uma vez pelo Jest (globalSetup) antes de todos os testes:
// apaga o banco de testes e aplica as migrations do zero.
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..', '..');

module.exports = function prepararBancoDeTeste() {
  process.env.NODE_ENV = 'test';
  process.loadEnvFile(path.join(RAIZ, '.env.test'));

  for (const arquivo of ['teste.db', 'teste.db-journal']) {
    fs.rmSync(path.join(RAIZ, 'prisma', arquivo), { force: true });
  }

  execSync('npx prisma migrate deploy', {
    cwd: RAIZ,
    env: process.env,
    stdio: 'ignore',
  });
};
