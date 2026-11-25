const prisma = require('../../lib/prisma');
const { PAPEIS, STATUS_EQUIPE, CASAS_DECIMAIS_RANKING } = require('../../lib/constantes');

const FATOR_ARREDONDAMENTO = 10 ** CASAS_DECIMAIS_RANKING;
// Valor menor que qualquer nota possível (as notas vão de 0 a 10). Usado no
// desempate quando a equipe não tem nota num critério.
const SEM_MEDIA = -1;

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * FATOR_ARREDONDAMENTO) / FATOR_ARREDONDAMENTO;
}

function media(valores) {
  return valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
}

// Critérios do maior para o menor peso. Pesos iguais: ordem de cadastro.
function ordenarPorPeso(criterios) {
  return [...criterios].sort((a, b) => b.peso - a.peso || a.id - b.id);
}

// Média de cada critério entre os jurados que deram nota (null se ninguém deu).
function mediasDaEquipe(equipeId, criterios, notas) {
  const medias = {};
  for (const criterio of criterios) {
    const valores = notas
      .filter((nota) => nota.equipeId === equipeId && nota.criterioId === criterio.id)
      .map((nota) => nota.valor);
    medias[criterio.id] = valores.length > 0 ? media(valores) : null;
  }
  return medias;
}

// Média ponderada das médias pelos pesos. Critérios ainda sem nota ficam de
// fora da conta (o peso deles não entra na divisão).
function notaFinal(medias, criterios) {
  const avaliados = criterios.filter((criterio) => medias[criterio.id] !== null);
  const somaDosPesos = avaliados.reduce((soma, criterio) => soma + criterio.peso, 0);
  if (somaDosPesos === 0) return null;
  const somaPonderada = avaliados.reduce(
    (soma, criterio) => soma + medias[criterio.id] * criterio.peso,
    0,
  );
  return arredondar(somaPonderada / somaDosPesos);
}

// Compara duas linhas: maior nota final primeiro; empate → maior média no
// critério de maior peso, depois no próximo, e assim por diante. 0 = empate real.
function compararLinhas(a, b, criteriosPorPeso) {
  if (a.notaFinal !== b.notaFinal) return b.notaFinal - a.notaFinal;
  for (const criterio of criteriosPorPeso) {
    const diferenca =
      (b.mediasPorCriterio[criterio.id] ?? SEM_MEDIA) -
      (a.mediasPorCriterio[criterio.id] ?? SEM_MEDIA);
    if (diferenca !== 0) return diferenca;
  }
  return 0;
}

// Posição em "ranking de competição": empatadas de verdade dividem a posição e
// a seguinte pula (1, 1, 3).
function atribuirPosicoes(ordenadas, criteriosPorPeso) {
  const empatam = (a, b) => Boolean(a && b) && compararLinhas(a, b, criteriosPorPeso) === 0;
  const classificadas = [];
  ordenadas.forEach((linha, indice) => {
    const anterior = ordenadas[indice - 1];
    const posicao = empatam(anterior, linha) ? classificadas[indice - 1].posicao : indice + 1;
    const empatada = empatam(anterior, linha) || empatam(linha, ordenadas[indice + 1]);
    classificadas.push({ posicao, ...linha, empatada });
  });
  return classificadas;
}

function compararNomes(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
}

/**
 * Calcula o ranking. Função pura: não acessa o banco, só recebe os dados.
 * @param {{ equipes: {id, nome}[], criterios: {id, nome, peso}[],
 *           notas: {equipeId, criterioId, juradoId, valor}[] }} dados
 * @returns linhas em ordem de classificação: { posicao, equipeId, nome, notaFinal,
 *          mediasPorCriterio, semAvaliacao, empatada }. Equipes sem nota vêm no fim,
 *          com posicao null.
 */
function calcularRanking({ equipes, criterios, notas }) {
  const criteriosPorPeso = ordenarPorPeso(criterios);
  const linhas = equipes.map((equipe) => {
    const medias = mediasDaEquipe(equipe.id, criterios, notas);
    const final = notaFinal(medias, criterios);
    const mediasPorCriterio = {};
    for (const criterio of criterios) {
      const valor = medias[criterio.id];
      mediasPorCriterio[criterio.id] = valor === null ? null : arredondar(valor);
    }
    return {
      equipeId: equipe.id,
      nome: equipe.nome,
      notaFinal: final,
      mediasPorCriterio,
      semAvaliacao: final === null,
    };
  });

  const avaliadas = linhas
    .filter((linha) => !linha.semAvaliacao)
    .sort((a, b) => compararLinhas(a, b, criteriosPorPeso) || compararNomes(a, b));

  const classificadas = atribuirPosicoes(avaliadas, criteriosPorPeso);

  const semAvaliacao = linhas
    .filter((linha) => linha.semAvaliacao)
    .sort(compararNomes)
    .map((linha) => ({ posicao: null, ...linha, empatada: false }));

  return [...classificadas, ...semAvaliacao];
}

// Busca os dados no banco e calcula o ranking das equipes aprovadas.
async function obterRanking() {
  const [equipes, criterios, notas] = await Promise.all([
    prisma.equipe.findMany({
      where: { status: STATUS_EQUIPE.APROVADA },
      select: { id: true, nome: true },
    }),
    prisma.criterio.findMany({ select: { id: true, nome: true, peso: true } }),
    prisma.nota.findMany({
      where: { equipe: { status: STATUS_EQUIPE.APROVADA } },
      select: { equipeId: true, criterioId: true, juradoId: true, valor: true },
    }),
  ]);
  return {
    linhas: calcularRanking({ equipes, criterios, notas }),
    criterios: ordenarPorPeso(criterios),
  };
}

// A comissão vê sempre; os demais, só depois que o resultado for publicado.
function podeVerResultado(usuario, evento) {
  return evento.resultadoPublicado || usuario?.papel === PAPEIS.COMISSAO;
}

module.exports = { calcularRanking, obterRanking, podeVerResultado, arredondar };
