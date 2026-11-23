const agendaService = require('../../src/modules/agenda/agenda.service');
const avisosService = require('../../src/modules/avisos/avisos.service');
const { ErroNaoEncontrado, ErroValidacao } = require('../../src/lib/erros');
const { deEntradaLocal } = require('../../src/lib/datas');
const { prisma, DIA_MS, limparBanco } = require('../helpers/banco');

const horario = (texto) => deEntradaLocal(texto);

beforeEach(async () => {
  await limparBanco();
});

describe('agenda', () => {
  const item = {
    titulo: 'Abertura',
    descricao: '',
    local: 'Auditório',
    inicio: horario('2026-12-02T14:00'),
    fim: horario('2026-12-02T14:30'),
  };

  test('cria, atualiza e exclui itens', async () => {
    const criado = await agendaService.criarItem(item);
    await agendaService.atualizarItem(criado.id, { ...item, titulo: 'Abertura oficial' });
    expect((await agendaService.buscarItem(criado.id)).titulo).toBe('Abertura oficial');
    await agendaService.excluirItem(criado.id);
    await expect(agendaService.buscarItem(criado.id)).rejects.toThrow(ErroNaoEncontrado);
  });

  test('o fim precisa ser depois do início (ao criar e ao editar)', async () => {
    const invertido = { ...item, fim: item.inicio };
    await expect(agendaService.criarItem(invertido)).rejects.toMatchObject({
      erros: { fim: 'O fim precisa ser depois do início.' },
    });
    const criado = await agendaService.criarItem(item);
    await expect(agendaService.atualizarItem(criado.id, invertido)).rejects.toThrow(ErroValidacao);
  });

  test('lista em ordem cronológica', async () => {
    await agendaService.criarItem({
      ...item,
      titulo: 'Depois',
      inicio: horario('2026-12-02T16:00'),
      fim: horario('2026-12-02T17:00'),
    });
    await agendaService.criarItem(item);
    const itens = await agendaService.listarItens();
    expect(itens.map((i) => i.titulo)).toEqual(['Abertura', 'Depois']);
  });

  test('agrupa por dia no horário de Brasília', () => {
    const itens = [
      { id: 1, inicio: horario('2026-12-02T22:00') },
      { id: 2, inicio: horario('2026-12-02T23:30') },
      // 00:30 em Brasília já é outro dia, mesmo sendo 03:30 UTC.
      { id: 3, inicio: horario('2026-12-03T00:30') },
    ];
    const grupos = agendaService.agruparPorDia(itens);
    expect(grupos.map((g) => g.itens.map((i) => i.id))).toEqual([[1, 2], [3]]);
  });

  test('destaca o que está acontecendo agora e o próximo', () => {
    const itens = [
      { id: 1, inicio: horario('2026-12-02T14:00'), fim: horario('2026-12-02T15:00') },
      { id: 2, inicio: horario('2026-12-02T14:30'), fim: horario('2026-12-02T16:00') },
      { id: 3, inicio: horario('2026-12-02T16:00'), fim: horario('2026-12-02T17:00') },
    ];
    const destaques = agendaService.destacarItens(itens, horario('2026-12-02T14:45'));
    expect(destaques).toEqual({ idsAcontecendoAgora: [1, 2], idProximo: 3 });
  });

  test('depois do último item, não há próximo', () => {
    const itens = [
      { id: 1, inicio: horario('2026-12-02T14:00'), fim: horario('2026-12-02T15:00') },
    ];
    expect(agendaService.destacarItens(itens, horario('2026-12-03T10:00'))).toEqual({
      idsAcontecendoAgora: [],
      idProximo: null,
    });
  });
});

describe('avisos', () => {
  const agora = new Date();
  const ontem = new Date(agora.getTime() - DIA_MS);
  const amanha = new Date(agora.getTime() + DIA_MS);

  async function criar(titulo, dados = {}) {
    return avisosService.criarAviso({
      titulo,
      texto: 'Texto',
      fixado: false,
      urgente: false,
      publicadoEm: ontem,
      ...dados,
    });
  }

  test('mural: fixados primeiro, depois do mais recente ao mais antigo', async () => {
    await criar('Antigo', { publicadoEm: new Date(agora.getTime() - 3 * DIA_MS) });
    await criar('Fixado antigo', {
      fixado: true,
      publicadoEm: new Date(agora.getTime() - 5 * DIA_MS),
    });
    await criar('Recente', { publicadoEm: new Date(agora.getTime() - 1000) });
    const mural = await avisosService.listarAvisosPublicados();
    expect(mural.map((a) => a.titulo)).toEqual(['Fixado antigo', 'Recente', 'Antigo']);
  });

  test('avisos agendados para o futuro não aparecem no site, só para a comissão', async () => {
    await criar('Futuro', { publicadoEm: amanha, urgente: true });
    expect(await avisosService.listarAvisosPublicados()).toHaveLength(0);
    expect(await avisosService.buscarAvisoUrgente()).toBeNull();
    expect(await avisosService.listarTodosOsAvisos()).toHaveLength(1);
  });

  test('a faixa mostra o aviso urgente mais recente', async () => {
    await criar('Urgente antigo', {
      urgente: true,
      publicadoEm: new Date(agora.getTime() - 2 * DIA_MS),
    });
    await criar('Urgente novo', { urgente: true });
    await criar('Comum mais novo', { publicadoEm: new Date(agora.getTime() - 1000) });
    expect((await avisosService.buscarAvisoUrgente()).titulo).toBe('Urgente novo');
  });

  test('últimos avisos limita a quantidade', async () => {
    for (const titulo of ['A', 'B', 'C', 'D']) await criar(titulo);
    expect(await avisosService.listarUltimosAvisos(3)).toHaveLength(3);
  });

  test('atualiza e exclui', async () => {
    const aviso = await criar('Original');
    await avisosService.atualizarAviso(aviso.id, { ...aviso, titulo: 'Editado' });
    expect((await avisosService.buscarAviso(aviso.id)).titulo).toBe('Editado');
    await avisosService.excluirAviso(aviso.id);
    expect(await prisma.aviso.count()).toBe(0);
    await expect(avisosService.excluirAviso(aviso.id)).rejects.toThrow(ErroNaoEncontrado);
  });
});
