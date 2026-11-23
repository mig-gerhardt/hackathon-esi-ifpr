const prisma = require('../../lib/prisma');
const { ErroNaoEncontrado, ErroRegraNegocio } = require('../../lib/erros');

function listarCriterios() {
  return prisma.criterio.findMany({
    orderBy: [{ peso: 'desc' }, { id: 'asc' }],
    include: { _count: { select: { notas: true } } },
  });
}

async function buscarCriterio(id) {
  const criterio = await prisma.criterio.findUnique({
    where: { id },
    include: { _count: { select: { notas: true } } },
  });
  if (!criterio) throw new ErroNaoEncontrado('Critério não encontrado.');
  return criterio;
}

// Depois que um jurado lança uma nota, o critério fica travado: mudar o peso
// ou apagar o critério mudaria notas que já foram dadas.
function garantirSemNotas(criterio) {
  if (criterio._count.notas > 0) {
    throw new ErroRegraNegocio(
      `O critério "${criterio.nome}" já tem notas lançadas e não pode mais ser alterado nem excluído.`,
    );
  }
}

function criarCriterio(dados) {
  return prisma.criterio.create({ data: dados });
}

async function atualizarCriterio(id, dados) {
  garantirSemNotas(await buscarCriterio(id));
  return prisma.criterio.update({ where: { id }, data: dados });
}

async function excluirCriterio(id) {
  garantirSemNotas(await buscarCriterio(id));
  await prisma.criterio.delete({ where: { id } });
}

module.exports = {
  listarCriterios,
  buscarCriterio,
  criarCriterio,
  atualizarCriterio,
  excluirCriterio,
};
