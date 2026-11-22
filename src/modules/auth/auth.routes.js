const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../../config/env');
const { ErroAplicacao } = require('../../lib/erros');
const { validarCorpo } = require('../../middlewares/validar');
const { esquemaLogin, esquemaCadastro } = require('./auth.schemas');
const controller = require('./auth.controller');

const JANELA_DE_TENTATIVAS_MS = 15 * 60 * 1000; // 15 minutos
const STATUS_MUITAS_TENTATIVAS = 429;

// Limita tentativas de login por IP, dificultando ataques de força bruta.
const limitarTentativasDeLogin = rateLimit({
  windowMs: JANELA_DE_TENTATIVAS_MS,
  limit: config.limiteTentativasLogin,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new ErroAplicacao(
        'Muitas tentativas de login. Aguarde 15 minutos e tente de novo.',
        STATUS_MUITAS_TENTATIVAS,
      ),
    );
  },
});

const rotas = Router();

rotas.get('/entrar', controller.mostrarEntrar);
rotas.post('/entrar', limitarTentativasDeLogin, validarCorpo(esquemaLogin), controller.entrar);
rotas.get('/criar-conta', controller.mostrarCriarConta);
rotas.post('/criar-conta', validarCorpo(esquemaCadastro), controller.criarConta);
// Sair não exige login: se a sessão já acabou, só volta para o início.
rotas.post('/sair', controller.sair);

module.exports = rotas;
