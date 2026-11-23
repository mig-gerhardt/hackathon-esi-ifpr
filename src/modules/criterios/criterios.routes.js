const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo, voltarPara } = require('../../middlewares/validar');
const { esquemaCriterio } = require('./criterios.schemas');
const controller = require('./criterios.controller');

const rotas = Router();
const comissao = exigirPapel(PAPEIS.COMISSAO);
const voltarParaLista = voltarPara('/comissao/criterios');

rotas.get('/comissao/criterios', comissao, controller.listarCriterios);
rotas.get('/comissao/criterios/novo', comissao, controller.mostrarNovoCriterio);
rotas.post(
  '/comissao/criterios/novo',
  comissao,
  validarCorpo(esquemaCriterio),
  controller.criarCriterio,
);
rotas.get('/comissao/criterios/:id/editar', comissao, controller.mostrarEdicao);
rotas.post(
  '/comissao/criterios/:id/editar',
  comissao,
  validarCorpo(esquemaCriterio),
  controller.atualizarCriterio,
);
rotas.get('/comissao/criterios/:id/excluir', comissao, controller.confirmarExclusao);
rotas.post(
  '/comissao/criterios/:id/excluir',
  comissao,
  voltarParaLista,
  controller.excluirCriterio,
);

module.exports = rotas;
