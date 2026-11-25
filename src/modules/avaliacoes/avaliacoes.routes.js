const { Router } = require('express');
const { PAPEIS } = require('../../lib/constantes');
const { exigirPapel } = require('../../middlewares/autenticacao');
const { validarCorpo } = require('../../middlewares/validar');
const { esquemaAvaliacao } = require('./avaliacoes.schemas');
const controller = require('./avaliacoes.controller');

const rotas = Router();
const jurado = exigirPapel(PAPEIS.JURADO);
const comissao = exigirPapel(PAPEIS.COMISSAO);

rotas.get('/jurado', jurado, controller.mostrarPainelDoJurado);
rotas.get('/jurado/equipes/:id', jurado, controller.mostrarAvaliacao);
rotas.post(
  '/jurado/equipes/:id',
  jurado,
  validarCorpo(esquemaAvaliacao),
  controller.salvarAvaliacao,
);

rotas.get('/comissao/avaliacao', comissao, controller.mostrarAvaliacaoDaComissao);
rotas.post('/comissao/avaliacao/abrir', comissao, controller.abrirAvaliacao);
rotas.post('/comissao/avaliacao/fechar', comissao, controller.fecharAvaliacao);
rotas.post('/comissao/avaliacao/publicar-resultado', comissao, controller.publicarResultado);
rotas.post('/comissao/avaliacao/ocultar-resultado', comissao, controller.ocultarResultado);

module.exports = rotas;
