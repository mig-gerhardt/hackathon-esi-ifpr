const request = require('supertest');
const app = require('../../src/app');
const { PAPEIS } = require('../../src/lib/constantes');
const { prisma, limparBanco, criarEvento, criarUsuario } = require('../helpers/banco');
const {
  criarNavegador,
  enviarFormulario,
  entrarComo,
  seguir,
  extrairCsrf,
  carregarAppCom,
} = require('../helpers/navegador');

beforeEach(async () => {
  await limparBanco();
  await criarEvento();
});

function cookieDaSessao(resposta) {
  return (resposta.headers['set-cookie'] ?? []).find((c) => c.startsWith('hackathon.sid='));
}

describe('cadastro', () => {
  const dados = {
    nome: 'Ana Souza',
    email: 'ana@estudantes.ifpr.edu.br',
    senha: 'senha-forte-1',
    confirmacaoSenha: 'senha-forte-1',
  };

  test('cria a conta como participante, já entra e vai para Minha equipe', async () => {
    const navegador = criarNavegador();
    const resposta = await enviarFormulario(navegador, '/criar-conta', dados, '/criar-conta');
    expect(resposta.status).toBe(302);
    expect(resposta.headers.location).toBe('/minha-equipe');
    const usuario = await prisma.usuario.findUnique({ where: { email: dados.email } });
    expect(usuario.papel).toBe(PAPEIS.PARTICIPANTE);
    const pagina = await seguir(navegador, resposta);
    expect(pagina.text).toContain('Conta criada');
    expect(pagina.text).toContain('Ana Souza');
  });

  test('um campo "papel" enviado à força é ignorado', async () => {
    const navegador = criarNavegador();
    await enviarFormulario(
      navegador,
      '/criar-conta',
      { ...dados, papel: PAPEIS.COMISSAO },
      '/criar-conta',
    );
    const usuario = await prisma.usuario.findUnique({ where: { email: dados.email } });
    expect(usuario.papel).toBe(PAPEIS.PARTICIPANTE);
  });

  test('com erro, o formulário volta preenchido e a mensagem fica junto do campo', async () => {
    const navegador = criarNavegador();
    const resposta = await enviarFormulario(
      navegador,
      '/criar-conta',
      { ...dados, email: 'invalido' },
      '/criar-conta',
    );
    expect(resposta.headers.location).toBe('/criar-conta');
    const pagina = await seguir(navegador, resposta);
    expect(pagina.text).toContain('value="Ana Souza"');
    expect(pagina.text).toContain('id="email-erro"');
    expect(pagina.text).toContain('aria-describedby="email-erro"');
    expect(pagina.text).toContain('Informe um e-mail válido.');
    expect(pagina.text).not.toContain('senha-forte-1');
  });
});

describe('login e logout', () => {
  test('entra com e-mail e senha corretos, indo para a página do papel', async () => {
    const jurado = await criarUsuario({ papel: PAPEIS.JURADO });
    const resposta = await entrarComo(criarNavegador(), jurado);
    expect(resposta.headers.location).toBe('/jurado');
  });

  test('senha errada mostra a mensagem genérica e mantém o e-mail', async () => {
    const pessoa = await criarUsuario();
    const navegador = criarNavegador();
    const resposta = await enviarFormulario(navegador, '/entrar', {
      email: pessoa.email,
      senha: 'errada',
    });
    expect(resposta.headers.location).toBe('/entrar');
    const pagina = await seguir(navegador, resposta);
    expect(pagina.text).toContain('E-mail ou senha incorretos.');
    expect(pagina.text).toContain(`value="${pessoa.email}"`);
  });

  test('a sessão é trocada no login (proteção contra fixação de sessão)', async () => {
    const pessoa = await criarUsuario();
    const navegador = criarNavegador();
    const pagina = await navegador.get('/entrar');
    const cookieAntes = cookieDaSessao(pagina);
    const resposta = await navegador
      .post('/entrar')
      .type('form')
      .send({ email: pessoa.email, senha: 'senha-de-teste', _csrf: extrairCsrf(pagina.text) });
    const cookieDepois = cookieDaSessao(resposta);
    expect(cookieAntes).toBeDefined();
    expect(cookieDepois).toBeDefined();
    expect(cookieDepois.split(';')[0]).not.toBe(cookieAntes.split(';')[0]);
  });

  test('o cookie da sessão é httpOnly e SameSite=Lax', async () => {
    const pagina = await request(app).get('/entrar');
    const cookie = cookieDaSessao(pagina);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  test('volta para a página que a pessoa tentou abrir antes de entrar', async () => {
    const comissao = await criarUsuario({ papel: PAPEIS.COMISSAO });
    const navegador = criarNavegador();
    await navegador.get('/comissao/avisos');
    const resposta = await entrarComo(navegador, comissao);
    expect(resposta.headers.location).toBe('/comissao/avisos');
  });

  test('sair encerra a sessão', async () => {
    const pessoa = await criarUsuario();
    const navegador = criarNavegador();
    await entrarComo(navegador, pessoa);
    const resposta = await enviarFormulario(navegador, '/sair', {}, '/');
    expect(resposta.headers.location).toBe('/');
    const depois = await navegador.get('/minha-equipe');
    expect(depois.status).toBe(302);
    expect(depois.headers.location).toBe('/entrar');
  });

  test('quem já entrou e abre /entrar vai para a sua página', async () => {
    const pessoa = await criarUsuario();
    const navegador = criarNavegador();
    await entrarComo(navegador, pessoa);
    const resposta = await navegador.get('/entrar');
    expect(resposta.headers.location).toBe('/minha-equipe');
  });
});

describe('caixa de login de demonstração', () => {
  test('aparece fora de produção', async () => {
    const pagina = await request(app).get('/entrar');
    expect(pagina.text).toContain('Entrar como (só no protótipo)');
    expect(pagina.text).toContain('data-login-demonstracao');
  });

  test('não existe em produção', async () => {
    const appDeProducao = carregarAppCom({ NODE_ENV: 'production' });

    const pagina = await request(appDeProducao).get('/entrar');
    expect(pagina.status).toBe(200);
    expect(pagina.text).not.toContain('Entrar como');
    expect(pagina.text).not.toContain('data-login-demonstracao');
    expect(pagina.text).not.toContain('login-demonstracao.js');
    const estilo = await request(appDeProducao).get('/estilo');
    expect(estilo.status).toBe(404);
    await appDeProducao.encerrar();
  });
});

describe('limite de tentativas de login', () => {
  test('depois do limite, responde 429 com página própria', async () => {
    const appComLimiteBaixo = carregarAppCom({ LIMITE_TENTATIVAS_LOGIN: '2' });

    const navegador = criarNavegador(appComLimiteBaixo);
    const tentar = () =>
      enviarFormulario(navegador, '/entrar', { email: 'x@ifpr.edu.br', senha: 'errada' });
    expect((await tentar()).status).toBe(302);
    expect((await tentar()).status).toBe(302);
    const bloqueada = await tentar();
    expect(bloqueada.status).toBe(429);
    expect(bloqueada.text).toContain('Muitas tentativas');
    await appComLimiteBaixo.encerrar();
  });
});
