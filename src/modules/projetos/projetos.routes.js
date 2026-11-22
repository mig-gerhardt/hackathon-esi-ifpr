const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo, voltarPara } = require('../../middlewares/validar');
const { esquemaProjeto } = require('./projetos.schemas');
const controller = require('./projetos.controller');

const rotas = Router();

rotas.post(
  '/minha-equipe/projeto',
  exigirPapel(PAPEIS.PARTICIPANTE),
  voltarPara('/minha-equipe'),
  validarCorpo(esquemaProjeto),
  controller.enviarProjeto,
);

module.exports = rotas;
