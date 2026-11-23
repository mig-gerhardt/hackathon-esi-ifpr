const { z } = require('zod');
const {
  textoObrigatorio,
  campoDataHora,
  campoInteiro,
  campoBooleano,
} = require('../../lib/validacao');

const LIMITE_INTEGRANTES = 20;
const LIMITE_EDICAO = 100;

// As regras entre campos (mínimo x máximo, prazos) ficam no evento.service.js.
const esquemaEvento = z.object({
  nome: textoObrigatorio('o nome do evento', 120),
  edicao: campoInteiro('a edição', 1, LIMITE_EDICAO),
  dataHora: campoDataHora('a data e o horário'),
  local: textoObrigatorio('o local', 120),
  descricao: textoObrigatorio('a descrição', 400),
  prazoInscricao: campoDataHora('o prazo de inscrição'),
  prazoEntrega: campoDataHora('o prazo de entrega'),
  minIntegrantes: campoInteiro('o mínimo de integrantes', 1, LIMITE_INTEGRANTES),
  maxIntegrantes: campoInteiro('o máximo de integrantes', 1, LIMITE_INTEGRANTES),
  avaliacaoAberta: campoBooleano,
  resultadoPublicado: campoBooleano,
});

module.exports = { esquemaEvento };
