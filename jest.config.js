module.exports = {
  testEnvironment: 'node',
  // Recria o banco de testes (prisma/teste.db) uma vez antes de todos os testes.
  globalSetup: '<rootDir>/tests/helpers/preparar-banco.js',
  // Fecha a conexão com o banco ao fim de cada arquivo de teste.
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/configurar-testes.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 20000,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/public/**'],
  coverageReporters: ['text', 'text-summary', 'html'],
  coverageThreshold: {
    './src/modules/**/*.service.js': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
