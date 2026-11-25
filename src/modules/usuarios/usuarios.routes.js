const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo, voltarPara } = require('../../middlewares/validar');
const { esquemaNovoJurado, esquemaPapel } = require('./usuarios.schemas');
const controller = require('./usuarios.controller');

const rotas = Router();
const comissao = exigirPapel(PAPEIS.COMISSAO);

rotas.get('/comissao/usuarios', comissao, controller.listarUsuarios);
rotas.get('/comissao/usuarios/novo-jurado', comissao, controller.mostrarNovoJurado);
rotas.post(
  '/comissao/usuarios/novo-jurado',
  comissao,
  validarCorpo(esquemaNovoJurado),
  controller.criarJurado,
);
rotas.post(
  '/comissao/usuarios/:id/papel',
  comissao,
  voltarPara('/comissao/usuarios'),
  validarCorpo(esquemaPapel),
  controller.alterarPapel,
);

module.exports = rotas;
