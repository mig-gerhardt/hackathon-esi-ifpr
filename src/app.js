// Cria e configura o app Express. Não chama listen(): o server.js sobe o
// servidor e os testes usam o app direto com o supertest.
const path = require('node:path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const session = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');

const config = require('./config/env');
const prisma = require('./lib/prisma');
const { carregarUsuario } = require('./middlewares/autenticacao');
const { protecaoCsrf, disponibilizarTokenCsrf } = require('./middlewares/csrf');
const {
  definirLocaisPadrao,
  adicionarFlash,
  carregarDadosDoSite,
} = require('./middlewares/locais');
const { paginaNaoEncontrada, tratarErros } = require('./middlewares/erros');
const rotas = require('./rotas');

const DURACAO_DA_SESSAO_MS = 8 * 60 * 60 * 1000; // 8 horas
const INTERVALO_LIMPEZA_SESSOES_MS = 60 * 60 * 1000; // 1 hora
const TAMANHO_MAXIMO_FORMULARIO = '50kb';

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/principal');
app.use(expressLayouts);
app.disable('x-powered-by');

// No Render a aplicação fica atrás de um proxy HTTPS.
if (config.ehProducao) app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: config.ehProducao ? [] : null,
      },
    },
  }),
);

// Arquivos estáticos antes da sessão: CSS e imagens não precisam dela.
app.use(express.static(path.join(__dirname, 'public'), { maxAge: config.ehProducao ? '1d' : 0 }));

app.use(definirLocaisPadrao);
app.use(express.urlencoded({ extended: true, limit: TAMANHO_MAXIMO_FORMULARIO }));

const armazemDeSessoes = new PrismaSessionStore(prisma, {
  // Nos testes não deixamos um timer rodando (ele impediria o Jest de terminar).
  checkPeriod: config.ehTeste ? undefined : INTERVALO_LIMPEZA_SESSOES_MS,
  dbRecordIdIsSessionId: true,
});

// Usado para desligar o app com calma (fecha o timer de limpeza e o banco).
app.encerrar = async () => {
  await armazemDeSessoes.shutdown();
  await prisma.$disconnect();
};

app.use(
  session({
    name: 'hackathon.sid',
    secret: config.segredoSessao,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.ehProducao,
      maxAge: DURACAO_DA_SESSAO_MS,
    },
    store: armazemDeSessoes,
  }),
);

app.use(adicionarFlash);
app.use(carregarUsuario);
app.use(disponibilizarTokenCsrf);
app.use(carregarDadosDoSite);
app.use(protecaoCsrf);

app.use(rotas);

app.use(paginaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
