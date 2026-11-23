const { z } = require('zod');
const { textoObrigatorio, textoOpcional, campoInteiro } = require('../../lib/validacao');
const { PESO_MINIMO, PESO_MAXIMO } = require('../../lib/constantes');

const esquemaCriterio = z.object({
  nome: textoObrigatorio('o nome do critério', 60),
  descricao: textoOpcional(300),
  peso: campoInteiro('o peso', PESO_MINIMO, PESO_MAXIMO),
});

module.exports = { esquemaCriterio };
