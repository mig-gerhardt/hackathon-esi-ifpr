const bcrypt = require('bcrypt');
const config = require('../../config/env');
const prisma = require('../../lib/prisma');
const { PAPEIS } = require('../../lib/constantes');
const { ErroValidacao, ErroNaoEncontrado, ErroRegraNegocio } = require('../../lib/erros');

// Dados do usuário que podem circular pela aplicação (nunca o hash da senha).
const CAMPOS_PUBLICOS = { id: true, nome: true, email: true, papel: true, equipeId: true };

function gerarHashDaSenha(senha) {
  return bcrypt.hash(senha, config.custoBcrypt);
}

function buscarUsuarioDaSessao(id) {
  return prisma.usuario.findUnique({ where: { id }, select: CAMPOS_PUBLICOS });
}

async function buscarUsuario(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: CAMPOS_PUBLICOS });
  if (!usuario) throw new ErroNaoEncontrado('Usuário não encontrado.');
  return usuario;
}

// Usado no cadastro público (participante) e pela comissão (jurado).
async function criarUsuario({ nome, email, senha, papel }) {
  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    throw new ErroValidacao({ email: 'Já existe uma conta com este e-mail.' });
  }
  return prisma.usuario.create({
    data: { nome, email, papel, senhaHash: await gerarHashDaSenha(senha) },
    select: CAMPOS_PUBLICOS,
  });
}

function criarJurado(dados) {
  return criarUsuario({ ...dados, papel: PAPEIS.JURADO });
}

function listarUsuarios({ papel } = {}) {
  return prisma.usuario.findMany({
    where: papel ? { papel } : {},
    select: { ...CAMPOS_PUBLICOS, equipe: { select: { id: true, nome: true } } },
    orderBy: [{ nome: 'asc' }],
  });
}

function contarUsuariosPorPapel(papel) {
  return prisma.usuario.count({ where: { papel } });
}

// Regras: a comissão não remove o próprio papel de comissão, e quem está
// numa equipe não pode virar jurado ou comissão sem sair da equipe antes.
async function alterarPapel(usuarioLogado, usuarioId, novoPapel) {
  const usuario = await buscarUsuario(usuarioId);
  if (usuario.id === usuarioLogado.id && novoPapel !== PAPEIS.COMISSAO) {
    throw new ErroRegraNegocio('Você não pode remover o seu próprio papel de comissão.');
  }
  if (novoPapel !== PAPEIS.PARTICIPANTE && usuario.equipeId) {
    throw new ErroRegraNegocio(
      `${usuario.nome} está numa equipe. Tire a pessoa da equipe antes de torná-la jurado ou comissão.`,
    );
  }
  return prisma.usuario.update({
    where: { id: usuarioId },
    data: { papel: novoPapel },
    select: CAMPOS_PUBLICOS,
  });
}

module.exports = {
  CAMPOS_PUBLICOS,
  buscarUsuarioDaSessao,
  buscarUsuario,
  criarUsuario,
  criarJurado,
  listarUsuarios,
  contarUsuariosPorPapel,
  alterarPapel,
};
