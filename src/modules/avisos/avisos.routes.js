const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo } = require('../../middlewares/validar');
const { esquemaAviso } = require('./avisos.schemas');
const controller = require('./avisos.controller');

const rotas = Router();
const comissao = exigirPapel(PAPEIS.COMISSAO);

rotas.get('/comissao/avisos', comissao, controller.listarAvisos);
rotas.get('/comissao/avisos/novo', comissao, controller.mostrarNovoAviso);
rotas.post('/comissao/avisos/novo', comissao, validarCorpo(esquemaAviso), controller.criarAviso);
rotas.get('/comissao/avisos/:id/editar', comissao, controller.mostrarEdicao);
rotas.post(
  '/comissao/avisos/:id/editar',
  comissao,
  validarCorpo(esquemaAviso),
  controller.atualizarAviso,
);
rotas.get('/comissao/avisos/:id/excluir', comissao, controller.confirmarExclusao);
rotas.post('/comissao/avisos/:id/excluir', comissao, controller.excluirAviso);

module.exports = rotas;
