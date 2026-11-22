const { ErroNaoAutorizado } = require('../lib/erros');
const usuariosService = require('../modules/usuarios/usuarios.service');

// Busca no banco o usuário da sessão a cada requisição. Assim, se a comissão
// mudar o papel de alguém, a mudança vale na hora.
async function carregarUsuario(req, _res, next) {
  req.usuario = null;
  const usuarioId = req.session?.usuarioId;
  if (usuarioId) {
    req.usuario = await usuariosService.buscarUsuarioDaSessao(usuarioId);
    if (!req.usuario) delete req.session.usuarioId;
  }
  next();
}

function redirecionarParaLogin(req, res) {
  if (req.method === 'GET') req.session.voltarAposLogin = req.originalUrl;
  req.flash('info', 'Entre com sua conta para continuar.');
  res.redirect('/entrar');
}

function exigirLogin(req, res, next) {
  if (!req.usuario) return redirecionarParaLogin(req, res);
  next();
}

// Permite a rota só para os papéis informados. Ex.: exigirPapel(PAPEIS.COMISSAO)
function exigirPapel(...papeis) {
  return (req, res, next) => {
    if (!req.usuario) return redirecionarParaLogin(req, res);
    if (!papeis.includes(req.usuario.papel)) throw new ErroNaoAutorizado();
    next();
  };
}

module.exports = { carregarUsuario, exigirLogin, exigirPapel };
