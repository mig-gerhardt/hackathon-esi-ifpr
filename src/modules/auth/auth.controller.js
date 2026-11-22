const { LOGINS_DE_DEMONSTRACAO } = require('../../lib/demonstracao');
const authService = require('./auth.service');

const PAGINA_INICIAL_POR_PAPEL = {
  PARTICIPANTE: '/minha-equipe',
  JURADO: '/jurado',
  COMISSAO: '/comissao',
};

// Só aceita voltar para um caminho interno do site (evita redirecionar para outro domínio).
function ehCaminhoInterno(caminho) {
  return typeof caminho === 'string' && caminho.startsWith('/') && !caminho.startsWith('//');
}

function mostrarEntrar(req, res) {
  if (req.usuario) return res.redirect(PAGINA_INICIAL_POR_PAPEL[req.usuario.papel]);
  res.render('auth/entrar', {
    titulo: 'Entrar',
    loginsDeDemonstracao: res.locals.ehProducao ? [] : LOGINS_DE_DEMONSTRACAO,
    scripts: res.locals.ehProducao ? [] : ['/js/login-demonstracao.js'],
  });
}

// Cria uma sessão nova (com outro id) ao entrar. Isso impede que alguém que
// conhecia o id antigo da sessão continue usando-a ("session fixation").
function iniciarSessao(req, usuario) {
  const destinoSalvo = req.session.voltarAposLogin;
  return new Promise((resolver, rejeitar) => {
    req.session.regenerate((erro) => {
      if (erro) return rejeitar(erro);
      req.session.usuarioId = usuario.id;
      resolver(
        ehCaminhoInterno(destinoSalvo) ? destinoSalvo : PAGINA_INICIAL_POR_PAPEL[usuario.papel],
      );
    });
  });
}

async function entrar(req, res) {
  const usuario = await authService.autenticar(req.body);
  const destino = await iniciarSessao(req, usuario);
  req.flash('sucesso', `Olá, ${usuario.nome.split(' ')[0]}.`);
  res.redirect(destino);
}

function mostrarCriarConta(req, res) {
  if (req.usuario) return res.redirect('/');
  res.render('auth/criar-conta', { titulo: 'Criar conta' });
}

async function criarConta(req, res) {
  const usuario = await authService.cadastrar(req.body);
  const destino = await iniciarSessao(req, usuario);
  req.flash('sucesso', 'Conta criada. Agora você já pode formar ou entrar numa equipe.');
  res.redirect(destino);
}

function sair(req, res, next) {
  req.session.destroy((erro) => {
    if (erro) return next(erro);
    res.clearCookie('hackathon.sid');
    res.redirect('/');
  });
}

module.exports = {
  mostrarEntrar,
  entrar,
  mostrarCriarConta,
  criarConta,
  sair,
};
