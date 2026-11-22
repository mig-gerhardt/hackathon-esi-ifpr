const prisma = require('../../lib/prisma');
const { PAPEIS, STATUS_EQUIPE } = require('../../lib/constantes');
const { formatarDataHora } = require('../../lib/datas');
const {
  ErroValidacao,
  ErroNaoAutorizado,
  ErroNaoEncontrado,
  ErroRegraNegocio,
} = require('../../lib/erros');
const eventoService = require('../evento/evento.service');

const DADOS_DA_PESSOA = { select: { id: true, nome: true, email: true } };

const INCLUIR_DETALHES = {
  lider: DADOS_DA_PESSOA,
  membros: { ...DADOS_DA_PESSOA, orderBy: { nome: 'asc' } },
  projeto: true,
};

const MENSAGEM_NOME_EM_USO = 'Já existe uma equipe com este nome.';

// O nome é único sem diferenciar maiúsculas: "Byte Verde" e "byte verde" são iguais.
function normalizarNome(nome) {
  return nome.trim().toLocaleLowerCase('pt-BR');
}

function ehComissao(usuario) {
  return usuario.papel === PAPEIS.COMISSAO;
}

function ehNomeRepetido(erro) {
  return erro.code === 'P2002';
}

async function buscarEquipe(id) {
  const equipe = await prisma.equipe.findUnique({ where: { id }, include: INCLUIR_DETALHES });
  if (!equipe) throw new ErroNaoEncontrado('Equipe não encontrada.');
  return equipe;
}

async function buscarEquipeDoUsuario(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { equipeId: true },
  });
  if (!usuario?.equipeId) return null;
  return buscarEquipe(usuario.equipeId);
}

// Para as ações do participante sobre a própria equipe.
async function buscarIdDaEquipeDoUsuario(usuarioId) {
  const equipe = await buscarEquipeDoUsuario(usuarioId);
  if (!equipe) throw new ErroRegraNegocio('Você não faz parte de nenhuma equipe.');
  return equipe.id;
}

async function garantirNomeDisponivel(nome, equipeIdAtual = null) {
  const existente = await prisma.equipe.findUnique({
    where: { nomeNormalizado: normalizarNome(nome) },
  });
  if (existente && existente.id !== equipeIdAtual) {
    throw new ErroValidacao({ nome: MENSAGEM_NOME_EM_USO });
  }
}

async function garantirInscricoesAbertas(agora) {
  const evento = await eventoService.obterEvento();
  if (!eventoService.inscricoesAbertas(evento, agora)) {
    throw new ErroRegraNegocio(
      `O prazo de inscrição terminou em ${formatarDataHora(evento.prazoInscricao)}. A equipe não pode mais ser alterada.`,
    );
  }
  return evento;
}

function garantirLider(usuario, equipe) {
  if (equipe.liderId !== usuario.id) {
    throw new ErroNaoAutorizado('Só o líder da equipe pode fazer isso.');
  }
}

async function criarEquipe(usuario, { nome }, agora = new Date()) {
  if (usuario.papel !== PAPEIS.PARTICIPANTE) {
    throw new ErroRegraNegocio('Só participantes podem formar equipes.');
  }
  await garantirInscricoesAbertas(agora);
  if (await buscarEquipeDoUsuario(usuario.id)) {
    throw new ErroRegraNegocio('Você já faz parte de uma equipe.');
  }
  await garantirNomeDisponivel(nome);
  try {
    return await prisma.equipe.create({
      data: {
        nome,
        nomeNormalizado: normalizarNome(nome),
        liderId: usuario.id,
        membros: { connect: { id: usuario.id } },
      },
      include: INCLUIR_DETALHES,
    });
  } catch (erro) {
    if (ehNomeRepetido(erro)) throw new ErroValidacao({ nome: MENSAGEM_NOME_EM_USO });
    throw erro;
  }
}

// Editar não muda o status: uma equipe aprovada continua aprovada.
async function editarEquipe(usuario, equipeId, { nome }, agora = new Date()) {
  const equipe = await buscarEquipe(equipeId);
  garantirLider(usuario, equipe);
  await garantirInscricoesAbertas(agora);
  await garantirNomeDisponivel(nome, equipe.id);
  return prisma.equipe.update({
    where: { id: equipe.id },
    data: { nome, nomeNormalizado: normalizarNome(nome) },
  });
}

function validarNovoMembro(pessoa, equipe) {
  if (!pessoa) {
    throw new ErroValidacao({
      email: 'Não encontramos um participante cadastrado com este e-mail.',
    });
  }
  if (pessoa.papel !== PAPEIS.PARTICIPANTE) {
    throw new ErroValidacao({
      email: 'Jurados e membros da comissão não podem participar de equipes.',
    });
  }
  if (pessoa.equipeId === equipe.id) {
    throw new ErroValidacao({ email: `${pessoa.nome} já está na sua equipe.` });
  }
  if (pessoa.equipeId) {
    throw new ErroValidacao({ email: `${pessoa.nome} já faz parte de outra equipe.` });
  }
}

async function adicionarMembro(usuario, equipeId, { email }, agora = new Date()) {
  const equipe = await buscarEquipe(equipeId);
  garantirLider(usuario, equipe);
  const evento = await garantirInscricoesAbertas(agora);
  const pessoa = await prisma.usuario.findUnique({ where: { email } });
  validarNovoMembro(pessoa, equipe);
  if (equipe.membros.length >= evento.maxIntegrantes) {
    throw new ErroRegraNegocio(`A equipe já tem o máximo de ${evento.maxIntegrantes} integrantes.`);
  }
  return prisma.usuario.update({ where: { id: pessoa.id }, data: { equipeId: equipe.id } });
}

// O líder remove membros até o prazo. A comissão pode remover a qualquer momento.
async function removerMembro(usuario, equipeId, membroId, agora = new Date()) {
  const equipe = await buscarEquipe(equipeId);
  if (!ehComissao(usuario)) {
    garantirLider(usuario, equipe);
    await garantirInscricoesAbertas(agora);
  }
  if (membroId === equipe.liderId) {
    throw new ErroRegraNegocio(
      'O líder não pode ser removido. Transfira a liderança ou exclua a equipe.',
    );
  }
  if (!equipe.membros.some((membro) => membro.id === membroId)) {
    throw new ErroNaoEncontrado('Esta pessoa não faz parte da equipe.');
  }
  return prisma.usuario.update({ where: { id: membroId }, data: { equipeId: null } });
}

async function transferirLideranca(usuario, equipeId, novoLiderId, agora = new Date()) {
  const equipe = await buscarEquipe(equipeId);
  garantirLider(usuario, equipe);
  await garantirInscricoesAbertas(agora);
  const ehMembro = equipe.membros.some((membro) => membro.id === novoLiderId);
  if (!ehMembro || novoLiderId === equipe.liderId) {
    throw new ErroValidacao({ novoLiderId: 'Escolha outro integrante da equipe.' });
  }
  return prisma.equipe.update({ where: { id: equipe.id }, data: { liderId: novoLiderId } });
}

// Integrantes que não são líderes podem sair da equipe até o prazo.
async function sairDaEquipe(usuario, agora = new Date()) {
  const equipe = await buscarEquipeDoUsuario(usuario.id);
  if (!equipe) throw new ErroRegraNegocio('Você não faz parte de nenhuma equipe.');
  if (equipe.liderId === usuario.id) {
    throw new ErroRegraNegocio('O líder não pode sair. Transfira a liderança ou exclua a equipe.');
  }
  await garantirInscricoesAbertas(agora);
  return prisma.usuario.update({ where: { id: usuario.id }, data: { equipeId: null } });
}

// O líder exclui até o prazo; a comissão, a qualquer momento.
// Ao excluir, os integrantes ficam sem equipe e as notas e o projeto são apagados.
async function excluirEquipe(usuario, equipeId, agora = new Date()) {
  const equipe = await buscarEquipe(equipeId);
  if (!ehComissao(usuario)) {
    garantirLider(usuario, equipe);
    await garantirInscricoesAbertas(agora);
  }
  await prisma.equipe.delete({ where: { id: equipe.id } });
  return equipe;
}

async function aprovarEquipe(equipeId) {
  const equipe = await buscarEquipe(equipeId);
  const evento = await eventoService.obterEvento();
  const quantidade = equipe.membros.length;
  if (quantidade < evento.minIntegrantes) {
    throw new ErroRegraNegocio(
      `A equipe ${equipe.nome} tem ${quantidade} integrante(s) e o mínimo é ${evento.minIntegrantes}. Ela não pode ser aprovada.`,
    );
  }
  return prisma.equipe.update({
    where: { id: equipe.id },
    data: { status: STATUS_EQUIPE.APROVADA, motivoRecusa: null },
  });
}

async function recusarEquipe(equipeId, { motivo }) {
  const equipe = await buscarEquipe(equipeId);
  return prisma.equipe.update({
    where: { id: equipe.id },
    data: { status: STATUS_EQUIPE.RECUSADA, motivoRecusa: motivo || null },
  });
}

function listarEquipes({ status } = {}) {
  return prisma.equipe.findMany({
    where: status ? { status } : {},
    include: { lider: DADOS_DA_PESSOA, projeto: true, _count: { select: { membros: true } } },
    orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
  });
}

function listarEquipesAprovadas() {
  return prisma.equipe.findMany({
    where: { status: STATUS_EQUIPE.APROVADA },
    include: { projeto: true },
    orderBy: { nome: 'asc' },
  });
}

async function contarEquipesPorStatus() {
  const grupos = await prisma.equipe.groupBy({ by: ['status'], _count: { _all: true } });
  const contagem = { PENDENTE: 0, APROVADA: 0, RECUSADA: 0 };
  for (const grupo of grupos) contagem[grupo.status] = grupo._count._all;
  return contagem;
}

module.exports = {
  normalizarNome,
  buscarEquipe,
  buscarEquipeDoUsuario,
  buscarIdDaEquipeDoUsuario,
  criarEquipe,
  editarEquipe,
  adicionarMembro,
  removerMembro,
  transferirLideranca,
  sairDaEquipe,
  excluirEquipe,
  aprovarEquipe,
  recusarEquipe,
  listarEquipes,
  listarEquipesAprovadas,
  contarEquipesPorStatus,
};
