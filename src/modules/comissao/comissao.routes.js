const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const controller = require('./comissao.controller');

const rotas = Router();

rotas.get('/comissao', exigirPapel(PAPEIS.COMISSAO), controller.mostrarPainel);

module.exports = rotas;
