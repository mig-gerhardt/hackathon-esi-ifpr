// Cada papel tentando abrir o que não pode, mais CSRF e cabeçalhos de segurança.
const request = require('supertest');
const app = require('../../src/app');
const { PAPEIS } = require('../../src/lib/constantes');
const {
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipe,
  criarEquipeAprovada,
} = require('../helpers/banco');
const { criarNavegador, entrarComo, enviarFormulario } = require('../helpers/navegador');

const PAGINAS_PUBLICAS = ['/', '/agenda', '/resultados', '/entrar', '/criar-conta'];
const PAGINAS_DO_PARTICIPANTE = ['/minha-equipe'];
const PAGINAS_DO_JURADO = ['/jurado'];
const PAGINAS_DA_COMISSAO = [
  '/comissao',
  '/comissao/equipes',
  '/comissao/agenda',
  '/comissao/agenda/novo',
  '/comissao/avisos',
  '/comissao/avisos/novo',
  '/comissao/criterios',
  '/comissao/criterios/novo',
  '/comissao/avaliacao',
  '/comissao/usuarios',
  '/comissao/usuarios/novo-jurado',
  '/comissao/evento',
];

let navegadores;

beforeAll(async () => {
  await limparBanco();
  await criarEvento();
  navegadores = {};
  for (const papel of Object.values(PAPEIS)) {
    const usuario = await criarUsuario({ papel });
    navegadores[papel] = criarNavegador();
    await entrarComo(navegadores[papel], usuario);
  }
});

describe('visitante sem login', () => {
  test.each(PAGINAS_PUBLICAS)('abre a página pública %s', async (url) => {
    expect((await request(app).get(url)).status).toBe(200);
  });

  test.each([...PAGINAS_DO_PARTICIPANTE, ...PAGINAS_DO_JURADO, ...PAGINAS_DA_COMISSAO])(
    'é mandado para o login ao abrir %s',
    async (url) => {
      const resposta = await request(app).get(url);
      expect(resposta.status).toBe(302);
      expect(resposta.headers.location).toBe('/entrar');
    },
  );
});

describe('participante', () => {
  test.each(PAGINAS_DO_PARTICIPANTE)('abre %s', async (url) => {
    expect((await navegadores.PARTICIPANTE.get(url)).status).toBe(200);
  });

  test.each([...PAGINAS_DO_JURADO, ...PAGINAS_DA_COMISSAO])('recebe 403 em %s', async (url) => {
    const resposta = await navegadores.PARTICIPANTE.get(url);
    expect(resposta.status).toBe(403);
    expect(resposta.text).toContain('Acesso negado');
  });

  test('não consegue aprovar equipe por POST direto', async () => {
    const { equipe } = await criarEquipeAprovada();
    const resposta = await enviarFormulario(
      navegadores.PARTICIPANTE,
      `/comissao/equipes/${equipe.id}/aprovar`,
      {},
      '/',
    );
    expect(resposta.status).toBe(403);
  });
});

describe('jurado', () => {
  test.each(PAGINAS_DO_JURADO)('abre %s', async (url) => {
    expect((await navegadores.JURADO.get(url)).status).toBe(200);
  });

  test.each([...PAGINAS_DO_PARTICIPANTE, ...PAGINAS_DA_COMISSAO])(
    'recebe 403 em %s',
    async (url) => {
      expect((await navegadores.JURADO.get(url)).status).toBe(403);
    },
  );

  test('não abre a avaliação de equipe que não foi aprovada', async () => {
    const pendente = await criarEquipe({ lider: await criarUsuario() });
    expect((await navegadores.JURADO.get(`/jurado/equipes/${pendente.id}`)).status).toBe(404);
  });

  test('não enxerga o ranking antes da publicação', async () => {
    const pagina = await navegadores.JURADO.get('/resultados');
    expect(pagina.text).toContain('O resultado ainda não foi divulgado');
  });
});

describe('comissão', () => {
  test.each(PAGINAS_DA_COMISSAO)('abre %s', async (url) => {
    expect((await navegadores.COMISSAO.get(url)).status).toBe(200);
  });

  test.each([...PAGINAS_DO_PARTICIPANTE, ...PAGINAS_DO_JURADO])('recebe 403 em %s', async (url) => {
    expect((await navegadores.COMISSAO.get(url)).status).toBe(403);
  });

  test('vê a prévia do ranking antes da publicação', async () => {
    const pagina = await navegadores.COMISSAO.get('/resultados');
    expect(pagina.text).toContain('Prévia visível só para a comissão');
  });
});

describe('autorização sobre o recurso', () => {
  test('integrante que não é líder não remove colegas', async () => {
    const lider = await criarUsuario();
    const membro = await criarUsuario();
    const colega = await criarUsuario();
    await criarEquipe({ lider, membros: [membro, colega] });
    const navegador = criarNavegador();
    await entrarComo(navegador, membro);
    const resposta = await enviarFormulario(
      navegador,
      `/minha-equipe/membros/${colega.id}/remover`,
      {},
      '/minha-equipe',
    );
    expect(resposta.status).toBe(403);
  });

  test('o líder de uma equipe não mexe em outra trocando o id (a ação usa a própria equipe)', async () => {
    const { lider } = await criarEquipeAprovada(2);
    const { membros: membrosDeOutra } = await criarEquipeAprovada(2);
    const navegador = criarNavegador();
    await entrarComo(navegador, lider);
    const resposta = await enviarFormulario(
      navegador,
      `/minha-equipe/membros/${membrosDeOutra[0].id}/remover`,
      {},
      '/minha-equipe',
    );
    expect(resposta.status).toBe(404);
  });
});

describe('proteções gerais', () => {
  test('POST sem token CSRF é recusado com 403', async () => {
    const resposta = await request(app)
      .post('/entrar')
      .type('form')
      .send({ email: 'a@b.com', senha: 'x' });
    expect(resposta.status).toBe(403);
    expect(resposta.text).toContain('O formulário expirou');
  });

  test('POST com token CSRF de outra sessão é recusado', async () => {
    const outra = await request(app).get('/entrar');
    const token = outra.text.match(/name="_csrf" value="([^"]+)"/)[1];
    const navegador = criarNavegador();
    await navegador.get('/entrar');
    const resposta = await navegador
      .post('/entrar')
      .type('form')
      .send({ email: 'a@b.com', senha: 'x', _csrf: token });
    expect(resposta.status).toBe(403);
  });

  test('envia cabeçalhos de segurança do helmet, com CSP', async () => {
    const resposta = await request(app).get('/');
    expect(resposta.headers['content-security-policy']).toContain("script-src 'self'");
    expect(resposta.headers['x-content-type-options']).toBe('nosniff');
    expect(resposta.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(resposta.headers['x-powered-by']).toBeUndefined();
  });

  test('página inexistente mostra a página 404 do site', async () => {
    const resposta = await request(app).get('/nao-existe');
    expect(resposta.status).toBe(404);
    expect(resposta.text).toContain('Página não encontrada');
    expect(resposta.text).toContain('Hackathon BCC');
  });

  test('id inválido na URL vira 404, sem derrubar o servidor', async () => {
    for (const url of [
      '/comissao/equipes/abc',
      '/comissao/equipes/-1',
      '/comissao/equipes/99999',
    ]) {
      expect((await navegadores.COMISSAO.get(url)).status).toBe(404);
    }
  });

  test('corpo de formulário malformado não derruba o servidor', async () => {
    const resposta = await request(app)
      .post('/entrar')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('%%%');
    expect([400, 403]).toContain(resposta.status);
  });
});
