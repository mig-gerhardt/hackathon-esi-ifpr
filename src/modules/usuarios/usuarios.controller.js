const { lerId } = require('../../lib/validacao');
const { NOMES_DOS_PAPEIS } = require('../../lib/constantes');
const usuariosService = require('./usuarios.service');
const { esquemaFiltroPapel } = require('./usuarios.schemas');

async function listarUsuarios(req, res) {
  const papel = esquemaFiltroPapel.parse(req.query.papel);
  res.render('usuarios/lista', {
    titulo: papel ? `Usuários: ${NOMES_DOS_PAPEIS[papel]}` : 'Usuários',
    usuarios: await usuariosService.listarUsuarios({ papel }),
    papelSelecionado: papel ?? null,
  });
}

function mostrarNovoJurado(_req, res) {
  res.render('usuarios/novo-jurado', { titulo: 'Novo jurado' });
}

async function criarJurado(req, res) {
  const jurado = await usuariosService.criarJurado(req.body);
  req.flash(
    'sucesso',
    `Conta de jurado criada para ${jurado.nome}. Entregue a senha inicial pessoalmente.`,
  );
  res.redirect('/comissao/usuarios?papel=JURADO');
}

async function alterarPapel(req, res) {
  const usuario = await usuariosService.alterarPapel(
    req.usuario,
    lerId(req.params.id),
    req.body.papel,
  );
  req.flash('sucesso', `${usuario.nome} agora é ${NOMES_DOS_PAPEIS[usuario.papel].toLowerCase()}.`);
  res.redirect('/comissao/usuarios');
}

module.exports = { listarUsuarios, mostrarNovoJurado, criarJurado, alterarPapel };
