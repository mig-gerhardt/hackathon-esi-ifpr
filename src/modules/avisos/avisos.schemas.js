const { z } = require('zod');
const { textoObrigatorio, campoBooleano, campoDataHora } = require('../../lib/validacao');

const esquemaAviso = z.object({
  titulo: textoObrigatorio('o título', 120),
  texto: textoObrigatorio('o texto do aviso', 1000),
  fixado: campoBooleano,
  urgente: campoBooleano,
  publicadoEm: campoDataHora('a data de publicação'),
});

module.exports = { esquemaAviso };
