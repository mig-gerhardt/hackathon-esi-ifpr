const prisma = require('../../lib/prisma');
const { PAPEIS, STATUS_EQUIPE, SITUACAO_AVALIACAO } = require('../../lib/constantes');
const { ErroNaoEncontrado, ErroRegraNegocio, ErroValidacao } = require('../../lib/erros');
const eventoService = require('../evento/evento.service');
const equipesService = require('../equipes/equipes.service');
const criteriosService = require('../criterios/criterios.service');

// "avaliada" = todas as notas dadas; "parcial" = algumas; "pendente" = nenhuma.
function situacaoDaAvaliacao(quantidadeDeNotas, quantidadeDeCriterios) {
  if (quantidadeDeCriterios === 0 || quantidadeDeNotas === 0) return SITUACAO_AVALIACAO.PENDENTE;
  if (quantidadeDeNotas >= quantidadeDeCriterios) return SITUACAO_AVALIACAO.AVALIADA;
  return SITUACAO_AVALIACAO.PARCIAL;
}

async function garantirAvaliacaoAberta() {
  const evento = await eventoService.obterEvento();
  if (!evento.avaliacaoAberta) {
    throw new ErroRegraNegocio(
      'A avaliação está fechada. As notas só podem ser lançadas quando a comissão abrir o período de avaliação.',
    );
  }
}

async function buscarEquipeAprovada(equipeId) {
  const equipe = await equipesService.buscarEquipe(equipeId);
  if (equipe.status !== STATUS_EQUIPE.APROVADA) {
    throw new ErroNaoEncontrado('Esta equipe não está disponível para avaliação.');
  }
  return equipe;
}

async function listarEquipesParaJurado(juradoId) {
  const [equipes, quantidadeDeCriterios, contagens] = await Promise.all([
    equipesService.listarEquipesAprovadas(),
    prisma.criterio.count(),
    prisma.nota.groupBy({ by: ['equipeId'], where: { juradoId }, _count: { _all: true } }),
  ]);
  const notasPorEquipe = new Map(contagens.map((grupo) => [grupo.equipeId, grupo._count._all]));
  return equipes.map((equipe) => {
    const notasDadas = notasPorEquipe.get(equipe.id) ?? 0;
    return {
      ...equipe,
      notasDadas,
      quantidadeDeCriterios,
      situacao: situacaoDaAvaliacao(notasDadas, quantidadeDeCriterios),
    };
  });
}

async function obterAvaliacao(juradoId, equipeId) {
  const equipe = await buscarEquipeAprovada(equipeId);
  const [criterios, notas, comentario] = await Promise.all([
    criteriosService.listarCriterios(),
    prisma.nota.findMany({ where: { juradoId, equipeId } }),
    prisma.comentarioAvaliacao.findUnique({
      where: { juradoId_equipeId: { juradoId, equipeId } },
    }),
  ]);
  const notasPorCriterio = Object.fromEntries(notas.map((nota) => [nota.criterioId, nota.valor]));
  return { equipe, criterios, notasPorCriterio, comentario: comentario?.texto ?? '' };
}

function operacaoDaNota(chave, valor) {
  if (valor === undefined) return prisma.nota.deleteMany({ where: chave });
  return prisma.nota.upsert({
    where: { juradoId_equipeId_criterioId: chave },
    create: { ...chave, valor },
    update: { valor },
  });
}

function operacaoDoComentario(juradoId, equipeId, texto) {
  if (!texto) return prisma.comentarioAvaliacao.deleteMany({ where: { juradoId, equipeId } });
  return prisma.comentarioAvaliacao.upsert({
    where: { juradoId_equipeId: { juradoId, equipeId } },
    create: { juradoId, equipeId, texto },
    update: { texto },
  });
}

// Salva as notas do jurado para a equipe. Avaliar de novo atualiza (upsert),
// nunca duplica: o banco tem uma chave única (jurado, equipe, critério).
// Um campo deixado em branco apaga a nota daquele critério.
async function salvarAvaliacao(juradoId, equipeId, { notas, comentario }) {
  await garantirAvaliacaoAberta();
  const equipe = await buscarEquipeAprovada(equipeId);
  const criterios = await prisma.criterio.findMany({ select: { id: true } });
  const idsDosCriterios = new Set(criterios.map((criterio) => String(criterio.id)));
  const chaveInvalida = Object.keys(notas).find((chave) => !idsDosCriterios.has(chave));
  if (chaveInvalida) {
    throw new ErroValidacao({}, 'Um dos critérios enviados não existe. Recarregue a página.');
  }
  const operacoes = criterios.map((criterio) =>
    operacaoDaNota(
      { juradoId, equipeId: equipe.id, criterioId: criterio.id },
      notas[String(criterio.id)],
    ),
  );
  operacoes.push(operacaoDoComentario(juradoId, equipe.id, comentario));
  await prisma.$transaction(operacoes);
}

// Resumo para a comissão: quanto da avaliação já foi feito.
async function obterResumoDaAvaliacao() {
  const [jurados, quantidadeDeEquipes, quantidadeDeCriterios, contagens] = await Promise.all([
    prisma.usuario.findMany({
      where: { papel: PAPEIS.JURADO },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.equipe.count({ where: { status: STATUS_EQUIPE.APROVADA } }),
    prisma.criterio.count(),
    prisma.nota.groupBy({
      by: ['juradoId', 'equipeId'],
      where: { equipe: { status: STATUS_EQUIPE.APROVADA } },
      _count: { _all: true },
    }),
  ]);
  const resumoDosJurados = jurados.map((jurado) => {
    const situacoes = contagens
      .filter((grupo) => grupo.juradoId === jurado.id)
      .map((grupo) => situacaoDaAvaliacao(grupo._count._all, quantidadeDeCriterios));
    const avaliadas = situacoes.filter((s) => s === SITUACAO_AVALIACAO.AVALIADA).length;
    const parciais = situacoes.filter((s) => s === SITUACAO_AVALIACAO.PARCIAL).length;
    return {
      ...jurado,
      avaliadas,
      parciais,
      pendentes: quantidadeDeEquipes - avaliadas - parciais,
    };
  });
  const concluidas = resumoDosJurados.reduce((total, jurado) => total + jurado.avaliadas, 0);
  return {
    jurados: resumoDosJurados,
    quantidadeDeEquipes,
    quantidadeDeCriterios,
    avaliacoesConcluidas: concluidas,
    avaliacoesPendentes: jurados.length * quantidadeDeEquipes - concluidas,
  };
}

module.exports = {
  situacaoDaAvaliacao,
  listarEquipesParaJurado,
  obterAvaliacao,
  salvarAvaliacao,
  obterResumoDaAvaliacao,
};
