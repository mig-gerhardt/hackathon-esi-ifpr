const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo } = require('../../middlewares/validar');
const { esquemaEvento } = require('./evento.schemas');
const controller = require('./evento.controller');

const rotas = Router();
const comissao = exigirPapel(PAPEIS.COMISSAO);

rotas.get('/comissao/evento', comissao, controller.mostrarConfiguracao);
rotas.post(
  '/comissao/evento',
  comissao,
  validarCorpo(esquemaEvento),
  controller.salvarConfiguracao,
);

module.exports = rotas;
