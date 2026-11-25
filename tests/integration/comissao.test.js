// Telas da comissão: cadastros (agenda, avisos, critérios), equipes e usuários.
const request = require('supertest');
const app = require('../../src/app');
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
const { criarNavegador, entrarComo, enviarFormulario, seguir } = require('../helpers/navegador');

let comissao;
let usuarioDaComissao;

beforeEach(async () => {
  await limparBanco();
  await criarEvento();
  usuarioDaComissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
  comissao = criarNavegador();
  await entrarComo(comissao, usuarioDaComissao);
});

describe('agenda', () => {
  const item = {
    titulo: 'Abertura',
    inicio: '2026-12-02T14:00',
    fim: '2026-12-02T14:30',
    local: 'Auditório',
    descricao: '',
  };

  test('cria, edita e exclui um item, com confirmação', async () => {
    await enviarFormulario(comissao, '/comissao/agenda/novo', item, '/comissao/agenda/novo');
    const criado = await prisma.itemAgenda.findFirst();
    expect(criado.titulo).toBe('Abertura');

    const edicao = await comissao.get(`/comissao/agenda/${criado.id}/editar`);
    expect(edicao.text).toContain('value="2026-12-02T14:00"');
    await enviarFormulario(
      comissao,
      `/comissao/agenda/${criado.id}/editar`,
      { ...item, titulo: 'Abertura oficial' },
      '/comissao/agenda',
    );
    expect((await prisma.itemAgenda.findFirst()).titulo).toBe('Abertura oficial');

    const confirmacao = await comissao.get(`/comissao/agenda/${criado.id}/excluir`);
    expect(confirmacao.text).toContain('Excluir &#34;Abertura oficial&#34; da agenda?');
    await enviarFormulario(
      comissao,
      `/comissao/agenda/${criado.id}/excluir`,
      {},
      '/comissao/agenda',
    );
    expect(await prisma.itemAgenda.count()).toBe(0);
  });

  test('fim antes do início volta para o formulário com o que foi digitado', async () => {
    const resposta = await enviarFormulario(
      comissao,
      '/comissao/agenda/novo',
      { ...item, fim: '2026-12-02T13:00' },
      '/comissao/agenda/novo',
    );
    const pagina = await seguir(comissao, resposta);
    expect(pagina.text).toContain('O fim precisa ser depois do início.');
    expect(pagina.text).toContain('value="2026-12-02T13:00"');
    expect(pagina.text).toContain('value="Abertura"');
  });

  test('a página pública agrupa por dia e mostra os itens', async () => {
    await enviarFormulario(comissao, '/comissao/agenda/novo', item, '/comissao/agenda/novo');
    const pagina = await request(app).get('/agenda');
    expect(pagina.text).toContain('Quarta-feira, 2 de dezembro');
    expect(pagina.text).toContain('Abertura');
    expect(pagina.text).toContain('14:00');
  });
});

describe('avisos', () => {
  test('cria, edita e exclui um aviso', async () => {
    await enviarFormulario(
      comissao,
      '/comissao/avisos/novo',
      {
        titulo: 'Credenciamento',
        texto: 'Leve documento.',
        fixado: 'on',
        publicadoEm: '2026-11-01T10:00',
      },
      '/comissao/avisos/novo',
    );
    const aviso = await prisma.aviso.findFirst();
    expect(aviso).toMatchObject({ fixado: true, urgente: false });

    const edicao = await comissao.get(`/comissao/avisos/${aviso.id}/editar`);
    expect(edicao.text).toMatch(/id="fixado" name="fixado"\s+checked/);
    await enviarFormulario(
      comissao,
      `/comissao/avisos/${aviso.id}/editar`,
      { titulo: 'Credenciamento', texto: 'Leve RG.', publicadoEm: '2026-11-01T10:00' },
      '/comissao/avisos',
    );
    expect((await prisma.aviso.findFirst()).fixado).toBe(false);

    expect((await comissao.get(`/comissao/avisos/${aviso.id}/excluir`)).status).toBe(200);
    await enviarFormulario(
      comissao,
      `/comissao/avisos/${aviso.id}/excluir`,
      {},
      '/comissao/avisos',
    );
    expect(await prisma.aviso.count()).toBe(0);
  });

  test('aviso inexistente mostra 404', async () => {
    expect((await comissao.get('/comissao/avisos/999/editar')).status).toBe(404);
  });
});

describe('critérios', () => {
  test('cria, edita e exclui um critério', async () => {
    await enviarFormulario(
      comissao,
      '/comissao/criterios/novo',
      { nome: 'Impacto', peso: '2', descricao: '' },
      '/comissao/criterios/novo',
    );
    const criterio = await prisma.criterio.findFirst();
    expect((await comissao.get(`/comissao/criterios/${criterio.id}/editar`)).status).toBe(200);
    await enviarFormulario(
      comissao,
      `/comissao/criterios/${criterio.id}/editar`,
      { nome: 'Impacto social', peso: '3', descricao: '' },
      '/comissao/criterios',
    );
    expect(await prisma.criterio.findFirst()).toMatchObject({ nome: 'Impacto social', peso: 3 });
    expect((await comissao.get(`/comissao/criterios/${criterio.id}/excluir`)).status).toBe(200);
    await enviarFormulario(
      comissao,
      `/comissao/criterios/${criterio.id}/excluir`,
      {},
      '/comissao/criterios',
    );
    expect(await prisma.criterio.count()).toBe(0);
  });

  test('peso fora de 1 a 5 é recusado', async () => {
    const resposta = await enviarFormulario(
      comissao,
      '/comissao/criterios/novo',
      { nome: 'Impacto', peso: '9' },
      '/comissao/criterios/novo',
    );
    expect((await seguir(comissao, resposta)).text).toContain('O máximo é 5.');
    expect(await prisma.criterio.count()).toBe(0);
  });

  test('critério com nota não pode ser excluído e a mensagem aparece na lista', async () => {
    const criterio = await criarCriterio();
    const { equipe } = await criarEquipeAprovada();
    const jurado = await criarUsuario({ papel: PAPEIS.JURADO });
    await prisma.nota.create({
      data: { juradoId: jurado.id, equipeId: equipe.id, criterioId: criterio.id, valor: 7 },
    });
    const resposta = await enviarFormulario(
      comissao,
      `/comissao/criterios/${criterio.id}/excluir`,
      {},
      '/comissao/criterios',
    );
    expect(resposta.headers.location).toBe('/comissao/criterios');
    expect((await seguir(comissao, resposta)).text).toContain('já tem notas lançadas');
  });
});

describe('equipes', () => {
  test('lista com filtro por status', async () => {
    await criarEquipeAprovada(2, 'Aprovada Um');
    await criarEquipe({ lider: await criarUsuario(), nome: 'Pendente Um' });
    const pagina = await comissao.get('/comissao/equipes?status=PENDENTE');
    expect(pagina.text).toContain('Pendente Um');
    expect(pagina.text).not.toContain('Aprovada Um');
    const invalido = await comissao.get('/comissao/equipes?status=QUALQUER');
    expect(invalido.text).toContain('Aprovada Um');
  });

  test('recusa com motivo e a equipe vê o motivo', async () => {
    const lider = await criarUsuario();
    const equipe = await criarEquipe({ lider });
    await enviarFormulario(
      comissao,
      `/comissao/equipes/${equipe.id}/recusar`,
      { motivo: 'Tema fora do edital' },
      `/comissao/equipes/${equipe.id}`,
    );
    const participante = criarNavegador();
    await entrarComo(participante, lider);
    const pagina = await participante.get('/minha-equipe');
    expect(pagina.text).toContain('Recusada');
    expect(pagina.text).toContain('Tema fora do edital');
  });

  test('aprovar equipe abaixo do mínimo mostra a regra', async () => {
    const equipe = await criarEquipe({ lider: await criarUsuario() });
    const resposta = await enviarFormulario(
      comissao,
      `/comissao/equipes/${equipe.id}/aprovar`,
      {},
      `/comissao/equipes/${equipe.id}`,
    );
    expect(resposta.headers.location).toBe(`/comissao/equipes/${equipe.id}`);
    expect((await seguir(comissao, resposta)).text).toContain('não pode ser aprovada');
  });

  test('remove integrante e exclui equipe com confirmação', async () => {
    const { equipe, membros } = await criarEquipeAprovada(3);
    await enviarFormulario(
      comissao,
      `/comissao/equipes/${equipe.id}/membros/${membros[0].id}/remover`,
      {},
      `/comissao/equipes/${equipe.id}`,
    );
    expect(await prisma.usuario.count({ where: { equipeId: equipe.id } })).toBe(2);

    const confirmacao = await comissao.get(`/comissao/equipes/${equipe.id}/excluir`);
    expect(confirmacao.text).toContain('não pode ser desfeita');
    const resposta = await enviarFormulario(
      comissao,
      `/comissao/equipes/${equipe.id}/excluir`,
      {},
      `/comissao/equipes/${equipe.id}`,
    );
    expect(resposta.headers.location).toBe('/comissao/equipes');
    expect(await prisma.equipe.count()).toBe(0);
  });
});

describe('usuários', () => {
  test('cria jurado e muda o papel de alguém', async () => {
    await enviarFormulario(
      comissao,
      '/comissao/usuarios/novo-jurado',
      { nome: 'Juliana Prado', email: 'juliana@ifpr.edu.br', senha: 'senha-inicial' },
      '/comissao/usuarios/novo-jurado',
    );
    const lista = await comissao.get('/comissao/usuarios?papel=JURADO');
    expect(lista.text).toContain('Juliana Prado');

    const pessoa = await criarUsuario();
    await enviarFormulario(
      comissao,
      `/comissao/usuarios/${pessoa.id}/papel`,
      { papel: PAPEIS.JURADO },
      '/comissao/usuarios',
    );
    expect((await prisma.usuario.findUnique({ where: { id: pessoa.id } })).papel).toBe(
      PAPEIS.JURADO,
    );
  });

  test('não remove o próprio papel e explica por quê', async () => {
    const resposta = await enviarFormulario(
      comissao,
      `/comissao/usuarios/${usuarioDaComissao.id}/papel`,
      { papel: PAPEIS.PARTICIPANTE },
      '/comissao/usuarios',
    );
    expect((await seguir(comissao, resposta)).text).toContain(
      'Você não pode remover o seu próprio papel de comissão.',
    );
  });

  test('papel inválido é recusado', async () => {
    const pessoa = await criarUsuario();
    await enviarFormulario(
      comissao,
      `/comissao/usuarios/${pessoa.id}/papel`,
      { papel: 'ADMIN' },
      '/comissao/usuarios',
    );
    expect((await prisma.usuario.findUnique({ where: { id: pessoa.id } })).papel).toBe(
      PAPEIS.PARTICIPANTE,
    );
  });
});

describe('painel e avaliação', () => {
  test('o painel mostra o resumo e a página de avaliação abre/fecha', async () => {
    await criarEquipeAprovada(2);
    await criarEquipe({ lider: await criarUsuario(), status: STATUS_EQUIPE.RECUSADA });
    const painel = await comissao.get('/comissao');
    expect(painel.text).toContain('Painel da comissão');
    expect(painel.text).toContain('Projetos enviados');

    await enviarFormulario(comissao, '/comissao/avaliacao/fechar', {}, '/comissao/avaliacao');
    expect((await prisma.configuracaoEvento.findFirst()).avaliacaoAberta).toBe(false);
    await enviarFormulario(
      comissao,
      '/comissao/avaliacao/publicar-resultado',
      {},
      '/comissao/avaliacao',
    );
    await enviarFormulario(
      comissao,
      '/comissao/avaliacao/ocultar-resultado',
      {},
      '/comissao/avaliacao',
    );
    expect((await prisma.configuracaoEvento.findFirst()).resultadoPublicado).toBe(false);
  });
});
