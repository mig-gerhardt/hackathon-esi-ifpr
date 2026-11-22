const { z } = require('zod');
const { campoUrlHttps } = require('../../lib/validacao');

const esquemaProjeto = z.object({
  linkRepositorio: campoUrlHttps,
});

module.exports = { esquemaProjeto };
