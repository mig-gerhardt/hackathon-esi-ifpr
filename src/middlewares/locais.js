// Prepara as variáveis que todas as views usam (res.locals) e as mensagens flash.
const config = require('../config/env');
const datas = require('../lib/datas');
const {
  PAPEIS,
  STATUS_EQUIPE,
  NOMES_DOS_PAPEIS,
  NOMES_DOS_STATUS_EQUIPE,
  NOMES_DAS_SITUACOES_AVALIACAO,
} = require('../lib/constantes');
const eventoService = require('../modules/evento/evento.service');
const avisosService = require('../modules/avisos/avisos.service');

// Campos que nunca voltam preenchidos num formulário com erro.
const CAMPOS_QUE_NAO_VOLTAM = ['senha', 'confirmacaoSenha', '_csrf'];

// Valores fixos e seguros, definidos antes de tudo. Assim até a página de erro
// consegue ser desenhada quando o banco de dados falha.
function definirLocaisPadrao(req, res, next) {
  Object.assign(res.locals, {
    titulo: 'Hackathon BCC',
    scripts: [],
    mensagens: [],
    valores: {},
    erros: {},
    usuarioAtual: null,
    csrfToken: '',
    evento: null,
    avisoUrgente: null,
    caminhoAtual: req.path,
    ehProducao: config.ehProducao,
    datas,
    PAPEIS,
    STATUS_EQUIPE,
    NOMES_DOS_PAPEIS,
    NOMES_DOS_STATUS_EQUIPE,
    NOMES_DAS_SITUACOES_AVALIACAO,
  });
  next();
}

// Mensagens flash: guardadas na sessão e mostradas uma única vez na próxima página.
function adicionarFlash(req, res, next) {
  req.flash = (tipo, mensagem) => {
    req.session.flash = [...(req.session.flash ?? []), { tipo, mensagem }];
  };
  if (req.method === 'GET') {
    res.locals.mensagens = req.session.flash ?? [];
    delete req.session.flash;
    const formulario = req.session.formulario;
    delete req.session.formulario;
    res.locals.valores = formulario?.valores ?? {};
    res.locals.erros = formulario?.erros ?? {};
  }
  next();
}

// Guarda na sessão o que foi digitado e os erros, para o formulário voltar preenchido.
function guardarFormulario(req, erros = {}) {
  const valores = { ...(req.corpoOriginal ?? req.body ?? {}) };
  for (const campo of CAMPOS_QUE_NAO_VOLTAM) delete valores[campo];
  req.session.formulario = { valores, erros };
}

async function carregarDadosDoSite(req, res, next) {
  res.locals.usuarioAtual = req.usuario ?? null;
  res.locals.evento = await eventoService.obterEvento();
  res.locals.avisoUrgente = await avisosService.buscarAvisoUrgente();
  next();
}

module.exports = { definirLocaisPadrao, adicionarFlash, guardarFormulario, carregarDadosDoSite };
