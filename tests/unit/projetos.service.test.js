const projetosService = require('../../src/modules/projetos/projetos.service');
const { STATUS_EQUIPE } = require('../../src/lib/constantes');
const {
  prisma,
  DIA_MS,
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipe,
  criarEquipeAprovada,
} = require('../helpers/banco');

const LINK = 'https://github.com/byte-verde/coleta-pinhais';

beforeEach(async () => {
  await limparBanco();
  await criarEvento();
});

describe('enviarProjeto', () => {
  test('integrante de equipe aprovada envia o link', async () => {
    const { equipe, membros } = await criarEquipeAprovada(2);
    const projeto = await projetosService.enviarProjeto(membros[0], { linkRepositorio: LINK });
    expect(projeto).toMatchObject({ equipeId: equipe.id, linkRepositorio: LINK });
  });

  test('enviar de novo troca o link, sem criar outro projeto', async () => {
    const { equipe, lider } = await criarEquipeAprovada(2);
    await projetosService.enviarProjeto(lider, { linkRepositorio: LINK });
    await projetosService.enviarProjeto(lider, { linkRepositorio: 'https://gitlab.com/x/y' });
    const projetos = await prisma.projeto.findMany({ where: { equipeId: equipe.id } });
    expect(projetos).toHaveLength(1);
    expect(projetos[0].linkRepositorio).toBe('https://gitlab.com/x/y');
  });

  test('equipe pendente ou recusada não envia', async () => {
    for (const status of [STATUS_EQUIPE.PENDENTE, STATUS_EQUIPE.RECUSADA]) {
      const lider = await criarUsuario();
      await criarEquipe({ lider, status });
      await expect(projetosService.enviarProjeto(lider, { linkRepositorio: LINK })).rejects.toThrow(
        'Só equipes aprovadas pela comissão podem enviar o projeto.',
      );
    }
  });

  test('quem não tem equipe não envia', async () => {
    await expect(
      projetosService.enviarProjeto(await criarUsuario(), { linkRepositorio: LINK }),
    ).rejects.toThrow(/precisa fazer parte de uma equipe/);
  });

  test('não envia depois do prazo de entrega', async () => {
    const { lider } = await criarEquipeAprovada(2);
    const depoisDoPrazo = new Date(Date.now() + 12 * DIA_MS);
    await expect(
      projetosService.enviarProjeto(lider, { linkRepositorio: LINK }, depoisDoPrazo),
    ).rejects.toThrow(/prazo de entrega terminou/);
  });
});

test('contarProjetosEnviados conta só os de equipes aprovadas', async () => {
  const { lider } = await criarEquipeAprovada(2);
  await projetosService.enviarProjeto(lider, { linkRepositorio: LINK });
  const recusada = await criarEquipe({
    lider: await criarUsuario(),
    status: STATUS_EQUIPE.RECUSADA,
  });
  await prisma.projeto.create({ data: { equipeId: recusada.id, linkRepositorio: LINK } });
  expect(await projetosService.contarProjetosEnviados()).toBe(1);
});
