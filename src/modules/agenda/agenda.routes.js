const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo } = require('../../middlewares/validar');
const { esquemaItemAgenda } = require('./agenda.schemas');
const controller = require('./agenda.controller');

const rotas = Router();
const comissao = exigirPapel(PAPEIS.COMISSAO);

rotas.get('/agenda', controller.mostrarAgenda);

rotas.get('/comissao/agenda', comissao, controller.listarItens);
rotas.get('/comissao/agenda/novo', comissao, controller.mostrarNovoItem);
rotas.post(
  '/comissao/agenda/novo',
  comissao,
  validarCorpo(esquemaItemAgenda),
  controller.criarItem,
);
rotas.get('/comissao/agenda/:id/editar', comissao, controller.mostrarEdicao);
rotas.post(
  '/comissao/agenda/:id/editar',
  comissao,
  validarCorpo(esquemaItemAgenda),
  controller.atualizarItem,
);
rotas.get('/comissao/agenda/:id/excluir', comissao, controller.confirmarExclusao);
rotas.post('/comissao/agenda/:id/excluir', comissao, controller.excluirItem);

module.exports = rotas;
