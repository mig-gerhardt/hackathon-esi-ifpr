// Página "Minha equipe" do participante, do jeito que é usada no navegador.
const { STATUS_EQUIPE } = require('../../src/lib/constantes');
const { prisma, limparBanco, criarEvento, criarUsuario, criarEquipe } = require('../helpers/banco');
const { criarNavegador, entrarComo, enviarFormulario, seguir } = require('../helpers/navegador');

let lider;
let membro;
let navegadorDoLider;

beforeEach(async () => {
  await limparBanco();
  await criarEvento();
  lider = await criarUsuario({ nome: 'Lucas Almeida' });
  membro = await criarUsuario({ nome: 'Beatriz Santos' });
  navegadorDoLider = criarNavegador();
  await entrarComo(navegadorDoLider, lider);
});

test('sem equipe, mostra o formulário de criação', async () => {
  const pagina = await navegadorDoLider.get('/minha-equipe');
  expect(pagina.text).toContain('Criar equipe');
});

test('nome repetido volta com o erro junto do campo', async () => {
  await criarEquipe({ lider: await criarUsuario(), nome: 'Byte Verde' });
  const resposta = await enviarFormulario(
    navegadorDoLider,
    '/minha-equipe',
    { nome: 'byte verde' },
    '/minha-equipe',
  );
  const pagina = await seguir(navegadorDoLider, resposta);
  expect(pagina.text).toContain('Já existe uma equipe com este nome.');
  expect(pagina.text).toContain('value="byte verde"');
});

test('o líder renomeia, adiciona, transfere a liderança e o novo líder remove o antigo', async () => {
  await criarEquipe({ lider, nome: 'Byte Verde' });

  await enviarFormulario(
    navegadorDoLider,
    '/minha-equipe/editar',
    { nome: 'Byte Verde 2' },
    '/minha-equipe',
  );
  expect((await prisma.equipe.findFirst()).nome).toBe('Byte Verde 2');

  const adicionado = await enviarFormulario(
    navegadorDoLider,
    '/minha-equipe/membros',
    { email: membro.email },
    '/minha-equipe',
  );
  expect((await seguir(navegadorDoLider, adicionado)).text).toContain(
    'Beatriz Santos entrou na equipe',
  );

  await enviarFormulario(
    navegadorDoLider,
    '/minha-equipe/lideranca',
    { novoLiderId: String(membro.id) },
    '/minha-equipe',
  );
  expect((await prisma.equipe.findFirst()).liderId).toBe(membro.id);

  const navegadorDoMembro = criarNavegador();
  await entrarComo(navegadorDoMembro, membro);
  await enviarFormulario(
    navegadorDoMembro,
    `/minha-equipe/membros/${lider.id}/remover`,
    {},
    '/minha-equipe',
  );
  expect((await prisma.usuario.findUnique({ where: { id: lider.id } })).equipeId).toBeNull();
});

test('o integrante sai da equipe', async () => {
  await criarEquipe({ lider: await criarUsuario(), membros: [lider] });
  const resposta = await enviarFormulario(
    navegadorDoLider,
    '/minha-equipe/sair',
    {},
    '/minha-equipe',
  );
  expect((await seguir(navegadorDoLider, resposta)).text).toContain('Você saiu da equipe.');
});

test('o líder exclui a equipe depois de confirmar', async () => {
  await criarEquipe({ lider, membros: [membro], nome: 'Byte Verde' });
  const confirmacao = await navegadorDoLider.get('/minha-equipe/excluir');
  expect(confirmacao.text).toContain('Excluir a equipe Byte Verde?');
  await enviarFormulario(navegadorDoLider, '/minha-equipe/excluir', {}, '/minha-equipe');
  expect(await prisma.equipe.count()).toBe(0);
});

test('sem equipe, a confirmação de exclusão volta para a página da equipe', async () => {
  const resposta = await navegadorDoLider.get('/minha-equipe/excluir');
  expect(resposta.headers.location).toBe('/minha-equipe');
});

test('ação sobre a equipe sem ter equipe mostra mensagem clara', async () => {
  const resposta = await enviarFormulario(
    navegadorDoLider,
    '/minha-equipe/editar',
    { nome: 'Qualquer' },
    '/minha-equipe',
  );
  expect((await seguir(navegadorDoLider, resposta)).text).toContain(
    'Você não faz parte de nenhuma equipe.',
  );
});

test('equipe aprovada vê o formulário de envio do projeto', async () => {
  await criarEquipe({ lider, membros: [membro], status: STATUS_EQUIPE.APROVADA });
  const pagina = await navegadorDoLider.get('/minha-equipe');
  expect(pagina.text).toContain('Link do repositório');
  expect(pagina.text).toContain('Enviar projeto');
});
