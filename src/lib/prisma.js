// Garante que o .env foi lido antes de o Prisma procurar a DATABASE_URL.
require('../config/env');
const { PrismaClient } = require('@prisma/client');

// Um único cliente para a aplicação inteira: cada PrismaClient abre seu
// próprio conjunto de conexões com o banco.
const prisma = new PrismaClient();

module.exports = prisma;
