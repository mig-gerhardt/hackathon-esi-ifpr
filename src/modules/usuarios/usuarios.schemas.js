const { z } = require('zod');
const { textoObrigatorio, campoEmail } = require('../../lib/validacao');
const { PAPEIS } = require('../../lib/constantes');
const { campoSenhaNova } = require('../auth/auth.schemas');

const esquemaNovoJurado = z.object({
  nome: textoObrigatorio('o nome', 100),
  email: campoEmail,
  senha: campoSenhaNova,
});

const esquemaPapel = z.object({
  papel: z.enum(Object.values(PAPEIS), { error: 'Escolha um papel válido.' }),
});

// Filtro da lista de usuários (?papel=JURADO). Valor inválido = sem filtro.
const esquemaFiltroPapel = z.enum(Object.values(PAPEIS)).optional().catch(undefined);

module.exports = { esquemaNovoJurado, esquemaPapel, esquemaFiltroPapel };
