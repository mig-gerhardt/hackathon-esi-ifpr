const { z } = require('zod');
const { textoObrigatorio, textoOpcional, campoEmail } = require('../../lib/validacao');
const { STATUS_EQUIPE } = require('../../lib/constantes');

const esquemaEquipe = z.object({
  nome: textoObrigatorio('o nome da equipe', 60),
});

const esquemaNovoMembro = z.object({
  email: campoEmail,
});

const esquemaTransferencia = z.object({
  novoLiderId: z.coerce
    .number({ error: 'Escolha um integrante.' })
    .int()
    .positive('Escolha um integrante.'),
});

const esquemaRecusa = z.object({
  motivo: textoOpcional(300),
});

// Filtro da lista de equipes da comissão (?status=PENDENTE). Valor inválido = sem filtro.
const esquemaFiltroStatus = z.enum(Object.values(STATUS_EQUIPE)).optional().catch(undefined);

module.exports = {
  esquemaEquipe,
  esquemaNovoMembro,
  esquemaTransferencia,
  esquemaRecusa,
  esquemaFiltroStatus,
};
