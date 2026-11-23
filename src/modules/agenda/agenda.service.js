const prisma = require('../../lib/prisma');
const { chaveDoDia } = require('../../lib/datas');
const { ErroNaoEncontrado, ErroValidacao } = require('../../lib/erros');

function listarItens() {
  return prisma.itemAgenda.findMany({ orderBy: [{ inicio: 'asc' }, { id: 'asc' }] });
}

async function buscarItem(id) {
  const item = await prisma.itemAgenda.findUnique({ where: { id } });
  if (!item) throw new ErroNaoEncontrado('Item da agenda não encontrado.');
  return item;
}

function garantirFimDepoisDoInicio({ inicio, fim }) {
  if (fim <= inicio) {
    throw new ErroValidacao({ fim: 'O fim precisa ser depois do início.' });
  }
}

async function criarItem(dados) {
  garantirFimDepoisDoInicio(dados);
  return prisma.itemAgenda.create({ data: dados });
}

async function atualizarItem(id, dados) {
  garantirFimDepoisDoInicio(dados);
  await buscarItem(id);
  return prisma.itemAgenda.update({ where: { id }, data: dados });
}

async function excluirItem(id) {
  await buscarItem(id);
  await prisma.itemAgenda.delete({ where: { id } });
}

// Funções puras usadas pela página pública da agenda ------------------------

// Agrupa os itens (já em ordem cronológica) por dia, no horário de Brasília.
// Retorna [{ dia: Date do primeiro item, itens: [...] }].
function agruparPorDia(itens) {
  const grupos = new Map();
  for (const item of itens) {
    const chave = chaveDoDia(item.inicio);
    if (!grupos.has(chave)) grupos.set(chave, { dia: item.inicio, itens: [] });
    grupos.get(chave).itens.push(item);
  }
  return [...grupos.values()];
}

// Marca o que está acontecendo agora e o próximo item a começar.
function destacarItens(itens, agora = new Date()) {
  const acontecendoAgora = itens.filter((item) => item.inicio <= agora && agora < item.fim);
  const proximo = itens.find((item) => item.inicio > agora) ?? null;
  return {
    idsAcontecendoAgora: acontecendoAgora.map((item) => item.id),
    idProximo: proximo?.id ?? null,
  };
}

module.exports = {
  listarItens,
  buscarItem,
  criarItem,
  atualizarItem,
  excluirItem,
  agruparPorDia,
  destacarItens,
};
