const {
  ErroAplicacao,
  ErroValidacao,
  ErroRegraNegocio,
  ErroNaoEncontrado,
} = require('../lib/erros');
const { guardarFormulario } = require('./locais');

const TITULOS_POR_STATUS = {
  400: 'Requisição inválida',
  403: 'Acesso negado',
  404: 'Página não encontrada',
  413: 'Envio grande demais',
  422: 'Ação não permitida',
  429: 'Muitas tentativas',
  500: 'Erro no servidor',
};

const MENSAGEM_ERRO_INTERNO =
  'Algo deu errado do nosso lado. Tente de novo em alguns instantes. Se o problema continuar, fale com a comissão organizadora.';

function paginaNaoEncontrada(_req, _res, next) {
  next(new ErroNaoEncontrado());
}

function renderizarErro(res, status, mensagem) {
  const titulo = TITULOS_POR_STATUS[status] ?? TITULOS_POR_STATUS[500];
  res.status(status).render('erros/erro', { titulo, status, mensagem }, (erroDeRender, html) => {
    if (erroDeRender) {
      console.error(erroDeRender);
      res.type('text').send(`${titulo}. ${mensagem}`);
      return;
    }
    res.send(html);
  });
}

// Formulário com erro: volta para a página do formulário, preenchido e com as mensagens.
function voltarAoFormulario(erro, req, res) {
  guardarFormulario(req, erro instanceof ErroValidacao ? erro.erros : {});
  req.flash('erro', erro.message);
  res.redirect(req.voltarPara ?? req.originalUrl);
}

// Middleware central de erros. O usuário nunca vê detalhes técnicos.
function tratarErros(erro, req, res, next) {
  if (res.headersSent) return next(erro);

  if (erro.code === 'EBADCSRFTOKEN') {
    return renderizarErro(
      res,
      403,
      'O formulário expirou ou não veio deste site. Volte, recarregue a página e tente de novo.',
    );
  }

  const ehErroDeFormulario = erro instanceof ErroValidacao || erro instanceof ErroRegraNegocio;
  if (ehErroDeFormulario && req.method !== 'GET' && req.session) {
    return voltarAoFormulario(erro, req, res);
  }

  if (erro instanceof ErroAplicacao) {
    return renderizarErro(res, erro.status, erro.message);
  }

  // Erros do leitor de formulários do Express (corpo malformado ou grande demais).
  if (erro.status === 400 || erro.status === 413) {
    return renderizarErro(res, erro.status, 'Não foi possível ler os dados enviados.');
  }

  console.error(erro);
  return renderizarErro(res, 500, MENSAGEM_ERRO_INTERNO);
}

module.exports = { paginaNaoEncontrada, tratarErros, renderizarErro };
