const {
  calcularRanking,
  obterRanking,
  podeVerResultado,
  arredondar,
} = require('../../src/modules/ranking/ranking.service');
const { PAPEIS, STATUS_EQUIPE } = require('../../src/lib/constantes');
const {
  prisma,
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipe,
  criarEquipeAprovada,
  criarCriterio,
} = require('../helpers/banco');

// Critérios do seed: dois de peso 3 e dois de peso 2.
const INOVACAO = { id: 1, nome: 'Inovação', peso: 3 };
const EXECUCAO = { id: 2, nome: 'Execução técnica', peso: 3 };
const IMPACTO = { id: 3, nome: 'Impacto', peso: 2 };
const APRESENTACAO = { id: 4, nome: 'Apresentação', peso: 2 };

function nota(juradoId, equipeId, criterio, valor) {
  return { juradoId, equipeId, criterioId: criterio.id, valor };
}

function equipe(id, nome = `Equipe ${id}`) {
  return { id, nome };
}

describe('calcularRanking (função pura)', () => {
  test('calcula a média de cada critério entre os jurados e a média ponderada pelos pesos', () => {
    const [linha] = calcularRanking({
      equipes: [equipe(1)],
      criterios: [INOVACAO, IMPACTO],
      notas: [
        nota(10, 1, INOVACAO, 8),
        nota(11, 1, INOVACAO, 9),
        nota(10, 1, IMPACTO, 6),
        nota(11, 1, IMPACTO, 7),
      ],
    });
    // Inovação: (8 + 9) / 2 = 8,5. Impacto: (6 + 7) / 2 = 6,5.
    // Final: (8,5 × 3 + 6,5 × 2) / 5 = 7,7
    expect(linha.mediasPorCriterio).toEqual({ 1: 8.5, 3: 6.5 });
    expect(linha.notaFinal).toBe(7.7);
    expect(linha.posicao).toBe(1);
  });

  test('arredonda a nota final para duas casas decimais', () => {
    const [linha] = calcularRanking({
      equipes: [equipe(1)],
      criterios: [INOVACAO],
      notas: [nota(10, 1, INOVACAO, 7), nota(11, 1, INOVACAO, 8), nota(12, 1, INOVACAO, 8)],
    });
    expect(linha.notaFinal).toBe(7.67);
    expect(linha.mediasPorCriterio[INOVACAO.id]).toBe(7.67);
  });

  test('ordena da maior para a menor nota final', () => {
    const linhas = calcularRanking({
      equipes: [equipe(1, 'Alfa'), equipe(2, 'Beta'), equipe(3, 'Gama')],
      criterios: [INOVACAO],
      notas: [nota(10, 1, INOVACAO, 6), nota(10, 2, INOVACAO, 9), nota(10, 3, INOVACAO, 7.5)],
    });
    expect(linhas.map((l) => [l.posicao, l.nome])).toEqual([
      [1, 'Beta'],
      [2, 'Gama'],
      [3, 'Alfa'],
    ]);
  });

  test('equipes sem nenhuma nota ficam no fim, sem posição e marcadas como sem avaliação', () => {
    const linhas = calcularRanking({
      equipes: [equipe(1, 'Sem Notas'), equipe(2, 'Avaliada')],
      criterios: [INOVACAO],
      notas: [nota(10, 2, INOVACAO, 5)],
    });
    expect(linhas[0].nome).toBe('Avaliada');
    expect(linhas[1]).toMatchObject({
      nome: 'Sem Notas',
      posicao: null,
      notaFinal: null,
      semAvaliacao: true,
    });
  });

  test('critério ainda sem nota fica fora da média ponderada', () => {
    const [linha] = calcularRanking({
      equipes: [equipe(1)],
      criterios: [INOVACAO, IMPACTO],
      notas: [nota(10, 1, INOVACAO, 8)],
    });
    expect(linha.mediasPorCriterio[IMPACTO.id]).toBeNull();
    expect(linha.notaFinal).toBe(8);
  });

  test('desempata pela maior média no critério de maior peso', () => {
    // As duas têm nota final 8,00, mas a Beta foi melhor em Inovação (peso 3).
    const linhas = calcularRanking({
      equipes: [equipe(1, 'Alfa'), equipe(2, 'Beta')],
      criterios: [INOVACAO, IMPACTO],
      notas: [
        nota(10, 1, INOVACAO, 7),
        nota(10, 1, IMPACTO, 9.5),
        nota(10, 2, INOVACAO, 9),
        nota(10, 2, IMPACTO, 6.5),
      ],
    });
    expect(linhas[0].notaFinal).toBe(linhas[1].notaFinal);
    expect(linhas.map((l) => [l.posicao, l.nome])).toEqual([
      [1, 'Beta'],
      [2, 'Alfa'],
    ]);
    expect(linhas.every((l) => !l.empatada)).toBe(true);
  });

  test('se o maior peso empata, desempata pelo próximo critério de maior peso', () => {
    // Mesmo final e mesma Inovação (peso 3); Execução (peso 3, cadastrado depois) decide.
    const linhas = calcularRanking({
      equipes: [equipe(1, 'Alfa'), equipe(2, 'Beta')],
      criterios: [APRESENTACAO, EXECUCAO, INOVACAO],
      notas: [
        nota(10, 1, INOVACAO, 8),
        nota(10, 1, EXECUCAO, 7),
        nota(10, 1, APRESENTACAO, 9),
        nota(10, 2, INOVACAO, 8),
        nota(10, 2, EXECUCAO, 8),
        nota(10, 2, APRESENTACAO, 7.5),
      ],
    });
    expect(linhas[0].notaFinal).toBe(linhas[1].notaFinal);
    expect(linhas[0].nome).toBe('Beta');
    expect(linhas[1].posicao).toBe(2);
  });

  test('empate verdadeiro mantém a mesma posição e a seguinte pula (1, 1, 3)', () => {
    const linhas = calcularRanking({
      equipes: [equipe(1, 'Beta'), equipe(2, 'Alfa'), equipe(3, 'Gama')],
      criterios: [INOVACAO, IMPACTO],
      notas: [
        nota(10, 1, INOVACAO, 8),
        nota(10, 1, IMPACTO, 7),
        nota(10, 2, INOVACAO, 8),
        nota(10, 2, IMPACTO, 7),
        nota(10, 3, INOVACAO, 5),
        nota(10, 3, IMPACTO, 5),
      ],
    });
    expect(linhas.map((l) => [l.posicao, l.nome, l.empatada])).toEqual([
      [1, 'Alfa', true],
      [1, 'Beta', true],
      [3, 'Gama', false],
    ]);
  });

  test('no desempate, a equipe sem nota num critério perde para quem tem nota', () => {
    const linhas = calcularRanking({
      equipes: [equipe(1, 'Alfa'), equipe(2, 'Beta')],
      criterios: [INOVACAO, IMPACTO],
      notas: [nota(10, 1, IMPACTO, 8), nota(10, 2, INOVACAO, 8)],
    });
    expect(linhas[0].notaFinal).toBe(8);
    expect(linhas[1].notaFinal).toBe(8);
    expect(linhas[0].nome).toBe('Beta');
  });

  test('ignora notas de equipes que não estão na lista', () => {
    const linhas = calcularRanking({
      equipes: [equipe(1)],
      criterios: [INOVACAO],
      notas: [nota(10, 1, INOVACAO, 6), nota(10, 99, INOVACAO, 10)],
    });
    expect(linhas).toHaveLength(1);
    expect(linhas[0].notaFinal).toBe(6);
  });

  test('sem equipes, devolve uma lista vazia', () => {
    expect(calcularRanking({ equipes: [], criterios: [INOVACAO], notas: [] })).toEqual([]);
  });

  test('sem critérios, todas as equipes ficam sem avaliação', () => {
    const linhas = calcularRanking({ equipes: [equipe(1)], criterios: [], notas: [] });
    expect(linhas[0].semAvaliacao).toBe(true);
  });
});

describe('arredondar', () => {
  test('arredonda para duas casas, inclusive casos de ponto flutuante', () => {
    expect(arredondar(1.005)).toBe(1.01);
    expect(arredondar(7.666666)).toBe(7.67);
    expect(arredondar(8)).toBe(8);
  });
});

describe('podeVerResultado', () => {
  const naoPublicado = { resultadoPublicado: false };
  const publicado = { resultadoPublicado: true };

  test('antes da publicação, só a comissão vê', () => {
    expect(podeVerResultado({ papel: PAPEIS.COMISSAO }, naoPublicado)).toBe(true);
    expect(podeVerResultado({ papel: PAPEIS.JURADO }, naoPublicado)).toBe(false);
    expect(podeVerResultado({ papel: PAPEIS.PARTICIPANTE }, naoPublicado)).toBe(false);
    expect(podeVerResultado(null, naoPublicado)).toBe(false);
  });

  test('depois da publicação, todos veem', () => {
    expect(podeVerResultado(null, publicado)).toBe(true);
    expect(podeVerResultado({ papel: PAPEIS.PARTICIPANTE }, publicado)).toBe(true);
  });
});

describe('obterRanking (com o banco)', () => {
  beforeEach(async () => {
    await limparBanco();
    await criarEvento();
  });

  test('considera só equipes aprovadas e devolve os critérios por peso', async () => {
    const jurado = await criarUsuario({ papel: PAPEIS.JURADO });
    const leve = await criarCriterio({ nome: 'Leve', peso: 1 });
    const pesado = await criarCriterio({ nome: 'Pesado', peso: 4 });
    const { equipe: aprovada } = await criarEquipeAprovada(2, 'Aprovada');
    const pendente = await criarEquipe({
      lider: await criarUsuario(),
      status: STATUS_EQUIPE.PENDENTE,
      nome: 'Pendente',
    });
    await prisma.nota.createMany({
      data: [
        { juradoId: jurado.id, equipeId: aprovada.id, criterioId: leve.id, valor: 6 },
        { juradoId: jurado.id, equipeId: aprovada.id, criterioId: pesado.id, valor: 9 },
        { juradoId: jurado.id, equipeId: pendente.id, criterioId: leve.id, valor: 10 },
      ],
    });

    const ranking = await obterRanking();

    expect(ranking.criterios.map((c) => c.nome)).toEqual(['Pesado', 'Leve']);
    expect(ranking.linhas).toHaveLength(1);
    expect(ranking.linhas[0]).toMatchObject({ nome: 'Aprovada', notaFinal: 8.4, posicao: 1 });
  });
});
