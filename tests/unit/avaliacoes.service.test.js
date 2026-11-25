const avaliacoesService = require('../../src/modules/avaliacoes/avaliacoes.service');
const { PAPEIS, STATUS_EQUIPE, SITUACAO_AVALIACAO } = require('../../src/lib/constantes');
const { ErroNaoEncontrado, ErroValidacao } = require('../../src/lib/erros');
const {
  prisma,
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipe,
  criarEquipeAprovada,
  criarCriterio,
} = require('../helpers/banco');

let jurado;
let inovacao;
let impacto;

beforeEach(async () => {
  await limparBanco();
  await criarEvento();
  jurado = await criarUsuario({ papel: PAPEIS.JURADO });
  inovacao = await criarCriterio({ nome: 'Inovação', peso: 3 });
  impacto = await criarCriterio({ nome: 'Impacto', peso: 2 });
});

function notas(valores) {
  return Object.fromEntries(Object.entries(valores).map(([id, valor]) => [String(id), valor]));
}

describe('situacaoDaAvaliacao', () => {
  test('pendente sem notas, parcial com algumas, avaliada com todas', () => {
    expect(avaliacoesService.situacaoDaAvaliacao(0, 4)).toBe(SITUACAO_AVALIACAO.PENDENTE);
    expect(avaliacoesService.situacaoDaAvaliacao(2, 4)).toBe(SITUACAO_AVALIACAO.PARCIAL);
    expect(avaliacoesService.situacaoDaAvaliacao(4, 4)).toBe(SITUACAO_AVALIACAO.AVALIADA);
    expect(avaliacoesService.situacaoDaAvaliacao(0, 0)).toBe(SITUACAO_AVALIACAO.PENDENTE);
  });
});

describe('salvarAvaliacao', () => {
  test('salva uma nota por critério e o comentário', async () => {
    const { equipe } = await criarEquipeAprovada();
    await avaliacoesService.salvarAvaliacao(jurado.id, equipe.id, {
      notas: notas({ [inovacao.id]: 8.5, [impacto.id]: 7 }),
      comentario: 'Bom trabalho',
    });
    const salvas = await prisma.nota.findMany({ orderBy: { criterioId: 'asc' } });
    expect(salvas.map((n) => n.valor)).toEqual([8.5, 7]);
    const comentario = await prisma.comentarioAvaliacao.findFirst();
    expect(comentario.texto).toBe('Bom trabalho');
  });

  test('avaliar de novo atualiza as notas, nunca duplica', async () => {
    const { equipe } = await criarEquipeAprovada();
    const enviar = (valor) =>
      avaliacoesService.salvarAvaliacao(jurado.id, equipe.id, {
        notas: notas({ [inovacao.id]: valor }),
        comentario: '',
      });
    await enviar(5);
    await enviar(9.5);
    const salvas = await prisma.nota.findMany({ where: { criterioId: inovacao.id } });
    expect(salvas).toHaveLength(1);
    expect(salvas[0].valor).toBe(9.5);
  });

  test('campo em branco apaga a nota daquele critério e comentário vazio apaga o comentário', async () => {
    const { equipe } = await criarEquipeAprovada();
    await avaliacoesService.salvarAvaliacao(jurado.id, equipe.id, {
      notas: notas({ [inovacao.id]: 8, [impacto.id]: 6 }),
      comentario: 'Texto',
    });
    await avaliacoesService.salvarAvaliacao(jurado.id, equipe.id, {
      notas: notas({ [inovacao.id]: 8 }),
      comentario: '',
    });
    expect(await prisma.nota.count()).toBe(1);
    expect(await prisma.comentarioAvaliacao.count()).toBe(0);
  });

  test('jurados diferentes têm notas separadas', async () => {
    const { equipe } = await criarEquipeAprovada();
    const outroJurado = await criarUsuario({ papel: PAPEIS.JURADO });
    for (const pessoa of [jurado, outroJurado]) {
      await avaliacoesService.salvarAvaliacao(pessoa.id, equipe.id, {
        notas: notas({ [inovacao.id]: 7 }),
        comentario: '',
      });
    }
    expect(await prisma.nota.count()).toBe(2);
  });

  test('não avalia com a avaliação fechada', async () => {
    await prisma.configuracaoEvento.update({ where: { id: 1 }, data: { avaliacaoAberta: false } });
    const { equipe } = await criarEquipeAprovada();
    await expect(
      avaliacoesService.salvarAvaliacao(jurado.id, equipe.id, {
        notas: notas({ [inovacao.id]: 7 }),
        comentario: '',
      }),
    ).rejects.toThrow(/A avaliação está fechada/);
  });

  test('só equipes aprovadas são avaliadas', async () => {
    const pendente = await criarEquipe({ lider: await criarUsuario() });
    await expect(
      avaliacoesService.salvarAvaliacao(jurado.id, pendente.id, { notas: {}, comentario: '' }),
    ).rejects.toThrow(ErroNaoEncontrado);
  });

  test('recusa critério inexistente', async () => {
    const { equipe } = await criarEquipeAprovada();
    await expect(
      avaliacoesService.salvarAvaliacao(jurado.id, equipe.id, {
        notas: { 9999: 5 },
        comentario: '',
      }),
    ).rejects.toThrow(ErroValidacao);
  });
});

describe('listarEquipesParaJurado', () => {
  test('mostra só as aprovadas, com a situação de cada uma para este jurado', async () => {
    const { equipe: avaliada } = await criarEquipeAprovada(2, 'Avaliada');
    const { equipe: parcial } = await criarEquipeAprovada(2, 'Parcial');
    await criarEquipeAprovada(2, 'Pendente');
    await criarEquipe({ lider: await criarUsuario(), status: STATUS_EQUIPE.PENDENTE });
    await avaliacoesService.salvarAvaliacao(jurado.id, avaliada.id, {
      notas: notas({ [inovacao.id]: 8, [impacto.id]: 8 }),
      comentario: '',
    });
    await avaliacoesService.salvarAvaliacao(jurado.id, parcial.id, {
      notas: notas({ [inovacao.id]: 8 }),
      comentario: '',
    });

    const lista = await avaliacoesService.listarEquipesParaJurado(jurado.id);

    expect(lista.map((e) => [e.nome, e.situacao])).toEqual([
      ['Avaliada', SITUACAO_AVALIACAO.AVALIADA],
      ['Parcial', SITUACAO_AVALIACAO.PARCIAL],
      ['Pendente', SITUACAO_AVALIACAO.PENDENTE],
    ]);
  });
});

describe('obterAvaliacao', () => {
  test('traz critérios, notas já dadas e comentário', async () => {
    const { equipe } = await criarEquipeAprovada();
    await avaliacoesService.salvarAvaliacao(jurado.id, equipe.id, {
      notas: notas({ [impacto.id]: 6.5 }),
      comentario: 'Ok',
    });
    const avaliacao = await avaliacoesService.obterAvaliacao(jurado.id, equipe.id);
    expect(avaliacao.criterios.map((c) => c.nome)).toEqual(['Inovação', 'Impacto']);
    expect(avaliacao.notasPorCriterio).toEqual({ [impacto.id]: 6.5 });
    expect(avaliacao.comentario).toBe('Ok');
  });
});

describe('obterResumoDaAvaliacao', () => {
  test('conta avaliações concluídas e pendentes por jurado', async () => {
    const outroJurado = await criarUsuario({ papel: PAPEIS.JURADO, nome: 'Zélia' });
    const { equipe: primeira } = await criarEquipeAprovada();
    const { equipe: segunda } = await criarEquipeAprovada();
    await avaliacoesService.salvarAvaliacao(jurado.id, primeira.id, {
      notas: notas({ [inovacao.id]: 8, [impacto.id]: 8 }),
      comentario: '',
    });
    await avaliacoesService.salvarAvaliacao(jurado.id, segunda.id, {
      notas: notas({ [inovacao.id]: 8 }),
      comentario: '',
    });

    const resumo = await avaliacoesService.obterResumoDaAvaliacao();

    expect(resumo.quantidadeDeEquipes).toBe(2);
    expect(resumo.avaliacoesConcluidas).toBe(1);
    expect(resumo.avaliacoesPendentes).toBe(3);
    const doJurado = resumo.jurados.find((j) => j.id === jurado.id);
    expect(doJurado).toMatchObject({ avaliadas: 1, parciais: 1, pendentes: 0 });
    const doOutro = resumo.jurados.find((j) => j.id === outroJurado.id);
    expect(doOutro).toMatchObject({ avaliadas: 0, parciais: 0, pendentes: 2 });
  });
});
