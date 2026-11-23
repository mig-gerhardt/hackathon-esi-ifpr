const { z } = require('zod');
const { textoObrigatorio, textoOpcional, campoDataHora } = require('../../lib/validacao');

// A regra "o fim precisa ser depois do início" fica no service (agenda.service.js).
const esquemaItemAgenda = z.object({
  titulo: textoObrigatorio('o título', 100),
  descricao: textoOpcional(500),
  inicio: campoDataHora('a data e hora de início'),
  fim: campoDataHora('a data e hora de fim'),
  local: textoOpcional(100),
});

module.exports = { esquemaItemAgenda };
