const bcrypt = require('bcrypt');
const config = require('../../config/env');
const prisma = require('../../lib/prisma');
const { PAPEIS } = require('../../lib/constantes');
const { ErroValidacao } = require('../../lib/erros');
const usuariosService = require('../usuarios/usuarios.service');

// Mensagem genérica: não revela se o e-mail existe ou se a senha está errada.
const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha incorretos.';

// Hash de uma senha qualquer. Quando o e-mail não existe, comparamos com ele
// mesmo assim, para a resposta demorar o mesmo tempo nos dois casos.
const HASH_FALSO = bcrypt.hashSync('senha-de-uma-conta-que-nao-existe', config.custoBcrypt);

// Toda conta criada pelo cadastro público é de participante.
function cadastrar({ nome, email, senha }) {
  return usuariosService.criarUsuario({ nome, email, senha, papel: PAPEIS.PARTICIPANTE });
}

async function autenticar({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  const senhaConfere = await bcrypt.compare(senha, usuario?.senhaHash ?? HASH_FALSO);
  if (!usuario || !senhaConfere) {
    throw new ErroValidacao({}, MENSAGEM_LOGIN_INVALIDO);
  }
  return usuariosService.buscarUsuarioDaSessao(usuario.id);
}

module.exports = { cadastrar, autenticar, MENSAGEM_LOGIN_INVALIDO };
