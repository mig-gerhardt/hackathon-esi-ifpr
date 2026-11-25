// Fluxo do hackathon de ponta a ponta, só pelas páginas do site:
// inscrição → aprovação → envio do projeto → avaliação → publicação → resultados.
const request = require('supertest');
const app = require('../../src/app');
const { PAPEIS, STATUS_EQUIPE } = require('../../src/lib/constantes');
const { paraEntradaLocal } = require('../../src/lib/datas');
const { prisma, DIA_MS, limparBanco, criarEvento, criarUsuario } = require('../helpers/banco');
const { criarNavegador, enviarFormulario, entrarComo, seguir } = require('../helpers/navegador');

beforeAll(async () => {
  await limparBanco();
  await criarEvento({ avaliacaoAberta: false });
});

test('fluxo completo do hackathon', async () => {
  // A comissão e um jurado já existem.
  const comissao = criarNavegador();
  await entrarComo(comissao, await criarUsuario({ papel: PAPEIS.COMISSAO }));

  // 1. A comissão cadastra os critérios.
  for (const [nome, peso] of [
    ['Inovação', '3'],
    ['Impacto', '2'],
  ]) {
    const resposta = await enviarFormulario(
      comissao,
      '/comissao/criterios/novo',
      { nome, peso, descricao: '' },
      '/comissao/criterios/novo',
    );
    expect(resposta.headers.location).toBe('/comissao/criterios');
  }
  const [inovacao, impacto] = await prisma.criterio.findMany({ orderBy: { id: 'asc' } });

  // 2. A comissão cria a conta do jurado.
  await enviarFormulario(
    comissao,
    '/comissao/usuarios/novo-jurado',
    { nome: 'Carlos Mendes', email: 'carlos@ifpr.edu.br', senha: 'senha-do-jurado' },
    '/comissao/usuarios/novo-jurado',
  );

  // 3. Duas pessoas criam conta pelo site; a primeira cria a equipe e adiciona a segunda.
  const lider = criarNavegador();
  const contas = [
    ['Lucas Almeida', 'lucas@estudantes.ifpr.edu.br'],
    ['Beatriz Santos', 'beatriz@estudantes.ifpr.edu.br'],
  ];
  for (const [nome, email] of contas) {
    await enviarFormulario(
      email === contas[0][1] ? lider : criarNavegador(),
      '/criar-conta',
      { nome, email, senha: 'senha-segura', confirmacaoSenha: 'senha-segura' },
      '/criar-conta',
    );
  }
  await enviarFormulario(lider, '/minha-equipe', { nome: 'Byte Verde' }, '/minha-equipe');
  await enviarFormulario(
    lider,
    '/minha-equipe/membros',
    { email: 'beatriz@estudantes.ifpr.edu.br' },
    '/minha-equipe',
  );
  const equipe = await prisma.equipe.findFirst({ include: { membros: true } });
  expect(equipe.membros).toHaveLength(2);
  expect(equipe.status).toBe(STATUS_EQUIPE.PENDENTE);

  // Antes da aprovação, o envio do projeto é recusado.
  const cedo = await enviarFormulario(
    lider,
    '/minha-equipe/projeto',
    { linkRepositorio: 'https://github.com/byte-verde/app' },
    '/minha-equipe',
  );
  expect((await seguir(lider, cedo)).text).toContain('Só equipes aprovadas');

  // 4. A comissão aprova a equipe.
  await enviarFormulario(
    comissao,
    `/comissao/equipes/${equipe.id}/aprovar`,
    {},
    '/comissao/equipes',
  );
  const paginaDoLider = await lider.get('/minha-equipe');
  expect(paginaDoLider.text).toContain('Aprovada');

  // 5. A equipe envia o projeto (link inválido primeiro, depois o certo).
  const invalido = await enviarFormulario(
    lider,
    '/minha-equipe/projeto',
    { linkRepositorio: 'github.com/sem-https' },
    '/minha-equipe',
  );
  expect((await seguir(lider, invalido)).text).toContain('começando com https://');
  await enviarFormulario(
    lider,
    '/minha-equipe/projeto',
    { linkRepositorio: 'https://github.com/byte-verde/app' },
    '/minha-equipe',
  );
  expect(await prisma.projeto.count()).toBe(1);

  // 6. Com a avaliação fechada, o jurado não consegue dar nota.
  const jurado = criarNavegador();
  await entrarComo(jurado, { email: 'carlos@ifpr.edu.br' }, 'senha-do-jurado');
  const urlAvaliacao = `/jurado/equipes/${equipe.id}`;
  const fechada = await enviarFormulario(
    jurado,
    urlAvaliacao,
    { [`notas[criterio-${inovacao.id}]`]: '9' },
    urlAvaliacao,
  );
  expect((await seguir(jurado, fechada)).text).toContain('A avaliação está fechada');
  expect(await prisma.nota.count()).toBe(0);

  // 7. A comissão abre a avaliação; o jurado avalia e depois corrige uma nota.
  await enviarFormulario(comissao, '/comissao/avaliacao/abrir', {}, '/comissao/avaliacao');
  const notasEnviadas = {
    [`notas[criterio-${inovacao.id}]`]: '9',
    [`notas[criterio-${impacto.id}]`]: '7,5',
    comentario: 'Boa ideia.',
  };
  const salvo = await enviarFormulario(jurado, urlAvaliacao, notasEnviadas, urlAvaliacao);
  expect(salvo.headers.location).toBe('/jurado');
  const painel = await seguir(jurado, salvo);
  expect(painel.text).toContain('Avaliação salva');
  expect(painel.text).toContain('Avaliada');

  await enviarFormulario(
    jurado,
    urlAvaliacao,
    { ...notasEnviadas, [`notas[criterio-${inovacao.id}]`]: '8' },
    urlAvaliacao,
  );
  expect(await prisma.nota.count()).toBe(2);

  // Nota inválida volta para o formulário com o erro junto do campo.
  const errada = await enviarFormulario(
    jurado,
    urlAvaliacao,
    { [`notas[criterio-${inovacao.id}]`]: '11' },
    urlAvaliacao,
  );
  const comErro = await seguir(jurado, errada);
  expect(comErro.text).toContain(`id="nota-${inovacao.id}-erro"`);
  expect(comErro.text).toContain('Dê uma nota de 0 a 10.');

  // 8. Antes da publicação, o público não vê o ranking.
  const antes = await request(app).get('/resultados');
  expect(antes.text).toContain('O resultado ainda não foi divulgado');
  expect(antes.text).not.toContain('Byte Verde');

  // 9. A comissão publica; o público vê a nota final: (8 × 3 + 7,5 × 2) / 5 = 7,80.
  await enviarFormulario(
    comissao,
    '/comissao/avaliacao/publicar-resultado',
    {},
    '/comissao/avaliacao',
  );
  const depois = await request(app).get('/resultados');
  expect(depois.text).toContain('Byte Verde');
  expect(depois.text).toContain('7,80');
  expect(depois.text).toContain('1º');
});

test('depois do prazo de inscrição, a página da equipe avisa e não oferece criar equipe', async () => {
  await prisma.configuracaoEvento.update({
    where: { id: 1 },
    data: { prazoInscricao: new Date(Date.now() - DIA_MS) },
  });
  const navegador = criarNavegador();
  await entrarComo(navegador, await criarUsuario());
  const pagina = await navegador.get('/minha-equipe');
  expect(pagina.text).toContain('As inscrições terminaram');
  expect(pagina.text).not.toContain('Criar equipe');
});

test('a comissão edita a configuração do evento e a página inicial mostra os novos dados', async () => {
  const comissao = criarNavegador();
  await entrarComo(comissao, await criarUsuario({ papel: PAPEIS.COMISSAO }));
  const agora = Date.now();
  const resposta = await enviarFormulario(
    comissao,
    '/comissao/evento',
    {
      nome: '1º Hackathon do curso de Ciência da Computação',
      edicao: '1',
      dataHora: paraEntradaLocal(new Date(agora + 10 * DIA_MS)),
      local: 'Auditório do Campus Pinhais',
      descricao: 'Descrição nova.',
      prazoInscricao: paraEntradaLocal(new Date(agora + 5 * DIA_MS)),
      prazoEntrega: paraEntradaLocal(new Date(agora + 11 * DIA_MS)),
      minIntegrantes: '3',
      maxIntegrantes: '4',
    },
    '/comissao/evento',
  );
  expect(resposta.headers.location).toBe('/comissao/evento');
  const inicio = await request(app).get('/');
  expect(inicio.text).toContain('Auditório do Campus Pinhais');
  expect(inicio.text).toContain('3 a 4 integrantes');
});

test('aviso urgente aparece na faixa de todas as páginas', async () => {
  const comissao = criarNavegador();
  await entrarComo(comissao, await criarUsuario({ papel: PAPEIS.COMISSAO }));
  await enviarFormulario(
    comissao,
    '/comissao/avisos/novo',
    {
      titulo: 'A abertura mudou para o auditório, às 14h',
      texto: 'Detalhes no mural.',
      urgente: 'on',
      publicadoEm: paraEntradaLocal(new Date(Date.now() - 60 * 1000)),
    },
    '/comissao/avisos/novo',
  );
  for (const url of ['/', '/agenda', '/resultados', '/entrar']) {
    const pagina = await request(app).get(url);
    expect(pagina.text).toContain('class="faixa-aviso"');
    expect(pagina.text).toContain('A abertura mudou para o auditório, às 14h');
  }
});
