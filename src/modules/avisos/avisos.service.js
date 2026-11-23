const prisma = require('../../lib/prisma');
const { ErroNaoEncontrado } = require('../../lib/erros');

// Mural: fixados primeiro, depois do mais recente ao mais antigo.
const ORDEM_DO_MURAL = [{ fixado: 'desc' }, { publicadoEm: 'desc' }, { id: 'desc' }];

// Só aparecem no site os avisos cuja data de publicação já chegou.
function listarAvisosPublicados(agora = new Date()) {
  return prisma.aviso.findMany({
    where: { publicadoEm: { lte: agora } },
    orderBy: ORDEM_DO_MURAL,
  });
}

function listarUltimosAvisos(quantidade, agora = new Date()) {
  return prisma.aviso.findMany({
    where: { publicadoEm: { lte: agora } },
    orderBy: ORDEM_DO_MURAL,
    take: quantidade,
  });
}

// O aviso urgente mais recente, mostrado na faixa abaixo do cabeçalho.
function buscarAvisoUrgente(agora = new Date()) {
  return prisma.aviso.findFirst({
    where: { urgente: true, publicadoEm: { lte: agora } },
    orderBy: [{ publicadoEm: 'desc' }, { id: 'desc' }],
  });
}

// Para a comissão: todos, inclusive os agendados para o futuro.
function listarTodosOsAvisos() {
  return prisma.aviso.findMany({ orderBy: ORDEM_DO_MURAL });
}

async function buscarAviso(id) {
  const aviso = await prisma.aviso.findUnique({ where: { id } });
  if (!aviso) throw new ErroNaoEncontrado('Aviso não encontrado.');
  return aviso;
}

function criarAviso(dados) {
  return prisma.aviso.create({ data: dados });
}

async function atualizarAviso(id, dados) {
  await buscarAviso(id);
  return prisma.aviso.update({ where: { id }, data: dados });
}

async function excluirAviso(id) {
  await buscarAviso(id);
  await prisma.aviso.delete({ where: { id } });
}

module.exports = {
  listarAvisosPublicados,
  listarUltimosAvisos,
  buscarAvisoUrgente,
  listarTodosOsAvisos,
  buscarAviso,
  criarAviso,
  atualizarAviso,
  excluirAviso,
};
