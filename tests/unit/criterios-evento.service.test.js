const criteriosService = require('../../src/modules/criterios/criterios.service');
const eventoService = require('../../src/modules/evento/evento.service');
const { PAPEIS } = require('../../src/lib/constantes');
const { ErroNaoEncontrado, ErroRegraNegocio, ErroValidacao } = require('../../src/lib/erros');
const {
  prisma,
  DIA_MS,
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipeAprovada,
} = require('../helpers/banco');

beforeEach(async () => {
  await limparBanco();
});

describe('critérios', () => {
  test('cria, lista por peso, edita e exclui critério sem notas', async () => {
    const leve = await criteriosService.criarCriterio({ nome: 'Leve', descricao: '', peso: 1 });
    await criteriosService.criarCriterio({ nome: 'Pesado', descricao: '', peso: 5 });
    expect((await criteriosService.listarCriterios()).map((c) => c.nome)).toEqual([
      'Pesado',
      'Leve',
    ]);
    await criteriosService.atualizarCriterio(leve.id, { nome: 'Leve', descricao: 'x', peso: 2 });
    expect((await criteriosService.buscarCriterio(leve.id)).peso).toBe(2);
    await criteriosService.excluirCriterio(leve.id);
    await expect(criteriosService.buscarCriterio(leve.id)).rejects.toThrow(ErroNaoEncontrado);
  });

  test('critério com nota lançada não pode ser editado nem excluído', async () => {
    await criarEvento();
    const criterio = await criteriosService.criarCriterio({
      nome: 'Inovação',
      descricao: '',
      peso: 3,
    });
    const jurado = await criarUsuario({ papel: PAPEIS.JURADO });
    const { equipe } = await criarEquipeAprovada();
    await prisma.nota.create({
      data: { juradoId: jurado.id, equipeId: equipe.id, criterioId: criterio.id, valor: 8 },
    });

    await expect(
      criteriosService.atualizarCriterio(criterio.id, { nome: 'X', descricao: '', peso: 1 }),
    ).rejects.toThrow(/já tem notas lançadas/);
    await expect(criteriosService.excluirCriterio(criterio.id)).rejects.toThrow(ErroRegraNegocio);
  });
});

describe('configuração do evento', () => {
  test('cria a configuração com valores iniciais se o banco estiver vazio', async () => {
    const evento = await eventoService.obterEvento();
    expect(evento).toMatchObject({ id: 1, minIntegrantes: 2, maxIntegrantes: 5 });
    expect(await prisma.configuracaoEvento.count()).toBe(1);
  });

  test('atualiza os dados do evento', async () => {
    await criarEvento();
    const agora = Date.now();
    const atualizado = await eventoService.atualizarEvento({
      nome: 'Hackathon',
      edicao: 2,
      dataHora: new Date(agora),
      local: 'Bloco A',
      descricao: 'Descrição',
      prazoInscricao: new Date(agora),
      prazoEntrega: new Date(agora + DIA_MS),
      minIntegrantes: 3,
      maxIntegrantes: 4,
      avaliacaoAberta: false,
      resultadoPublicado: false,
    });
    expect(atualizado).toMatchObject({ edicao: 2, minIntegrantes: 3, maxIntegrantes: 4 });
  });

  test('recusa máximo menor que o mínimo e entrega antes da inscrição', async () => {
    const agora = Date.now();
    await expect(
      eventoService.atualizarEvento({
        minIntegrantes: 4,
        maxIntegrantes: 2,
        prazoInscricao: new Date(agora + DIA_MS),
        prazoEntrega: new Date(agora),
      }),
    ).rejects.toMatchObject({
      constructor: ErroValidacao,
      erros: {
        maxIntegrantes: expect.any(String),
        prazoEntrega: expect.any(String),
      },
    });
  });

  test('abre/fecha a avaliação e publica/oculta o resultado', async () => {
    await criarEvento({ avaliacaoAberta: false, resultadoPublicado: false });
    expect((await eventoService.definirAvaliacaoAberta(true)).avaliacaoAberta).toBe(true);
    expect((await eventoService.definirResultadoPublicado(true)).resultadoPublicado).toBe(true);
    expect((await eventoService.definirResultadoPublicado(false)).resultadoPublicado).toBe(false);
  });

  test('inscrições e entregas abertas dependem dos prazos', () => {
    const evento = {
      prazoInscricao: new Date('2026-12-01T12:00:00Z'),
      prazoEntrega: new Date('2026-12-03T12:00:00Z'),
    };
    const antes = new Date('2026-11-30T12:00:00Z');
    const entreOsPrazos = new Date('2026-12-02T12:00:00Z');
    const depois = new Date('2026-12-04T12:00:00Z');
    expect(eventoService.inscricoesAbertas(evento, antes)).toBe(true);
    expect(eventoService.inscricoesAbertas(evento, entreOsPrazos)).toBe(false);
    expect(eventoService.entregasAbertas(evento, entreOsPrazos)).toBe(true);
    expect(eventoService.entregasAbertas(evento, depois)).toBe(false);
  });
});
