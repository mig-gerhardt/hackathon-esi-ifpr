// Simula um navegador nos testes de integração: guarda cookies entre as
// requisições e sabe pegar o token CSRF dos formulários.
const request = require('supertest');
const { SENHA_PADRAO } = require('./banco');

function criarNavegador(app = require('../../src/app')) {
  return request.agent(app);
}

function extrairCsrf(html) {
  const encontrado = html.match(/name="_csrf" value="([^"]+)"/);
  if (!encontrado) throw new Error('Token CSRF não encontrado na página.');
  return encontrado[1];
}

// Abre a página `deOnde`, pega o token e envia o formulário para `url`.
async function enviarFormulario(navegador, url, dados = {}, deOnde = '/entrar') {
  const pagina = await navegador.get(deOnde);
  const _csrf = extrairCsrf(pagina.text);
  return navegador
    .post(url)
    .type('form')
    .send({ ...dados, _csrf });
}

async function entrarComo(navegador, usuario, senha = SENHA_PADRAO) {
  const resposta = await enviarFormulario(navegador, '/entrar', { email: usuario.email, senha });
  if (resposta.status !== 302 || resposta.headers.location === '/entrar') {
    throw new Error(`Não foi possível entrar como ${usuario.email}`);
  }
  return resposta;
}

// Mensagens flash e erros aparecem na página seguinte ao redirecionamento.
async function seguir(navegador, resposta) {
  return navegador.get(resposta.headers.location);
}

// Carrega uma cópia nova do app com variáveis de ambiente trocadas
// (ex.: NODE_ENV=production). No fim do teste, chame app.encerrar().
function carregarAppCom(variaveis) {
  const originais = {};
  for (const [nome, valor] of Object.entries(variaveis)) {
    originais[nome] = process.env[nome];
    process.env[nome] = valor;
  }
  let app;
  jest.isolateModules(() => {
    app = require('../../src/app');
  });
  Object.assign(process.env, originais);
  return app;
}

module.exports = {
  carregarAppCom,
  criarNavegador,
  extrairCsrf,
  enviarFormulario,
  entrarComo,
  seguir,
};
