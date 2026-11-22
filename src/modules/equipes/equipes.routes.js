const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo, voltarPara } = require('../../middlewares/validar');
const {
  esquemaEquipe,
  esquemaNovoMembro,
  esquemaTransferencia,
  esquemaRecusa,
} = require('./equipes.schemas');
const controller = require('./equipes.controller');

const rotas = Router();

// ---------- Participante ----------
const participante = [exigirPapel(PAPEIS.PARTICIPANTE), voltarPara('/minha-equipe')];

rotas.get('/minha-equipe', exigirPapel(PAPEIS.PARTICIPANTE), controller.mostrarMinhaEquipe);
rotas.post('/minha-equipe', participante, validarCorpo(esquemaEquipe), controller.criarEquipe);
rotas.post(
  '/minha-equipe/editar',
  participante,
  validarCorpo(esquemaEquipe),
  controller.editarEquipe,
);
rotas.post(
  '/minha-equipe/membros',
  participante,
  validarCorpo(esquemaNovoMembro),
  controller.adicionarMembro,
);
rotas.post('/minha-equipe/membros/:membroId/remover', participante, controller.removerMembro);
rotas.post(
  '/minha-equipe/lideranca',
  participante,
  validarCorpo(esquemaTransferencia),
  controller.transferirLideranca,
);
rotas.post('/minha-equipe/sair', participante, controller.sairDaEquipe);
rotas.get('/minha-equipe/excluir', participante, controller.confirmarExclusaoDaMinhaEquipe);
rotas.post('/minha-equipe/excluir', participante, controller.excluirMinhaEquipe);

// ---------- Comissão ----------
const comissao = exigirPapel(PAPEIS.COMISSAO);
const voltarParaEquipe = voltarPara((req) => `/comissao/equipes/${req.params.id}`);

rotas.get('/comissao/equipes', comissao, controller.listarEquipes);
rotas.get('/comissao/equipes/:id', comissao, controller.mostrarEquipe);
rotas.post('/comissao/equipes/:id/aprovar', comissao, voltarParaEquipe, controller.aprovarEquipe);
rotas.post(
  '/comissao/equipes/:id/recusar',
  comissao,
  voltarParaEquipe,
  validarCorpo(esquemaRecusa),
  controller.recusarEquipe,
);
rotas.post(
  '/comissao/equipes/:id/membros/:membroId/remover',
  comissao,
  voltarParaEquipe,
  controller.removerMembroPelaComissao,
);
rotas.get('/comissao/equipes/:id/excluir', comissao, controller.confirmarExclusaoPelaComissao);
rotas.post(
  '/comissao/equipes/:id/excluir',
  comissao,
  voltarParaEquipe,
  controller.excluirEquipePelaComissao,
);

module.exports = rotas;
