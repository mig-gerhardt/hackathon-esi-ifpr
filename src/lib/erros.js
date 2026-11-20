// Erros da aplicação. Os services lançam estes erros e o middleware central
// (src/middlewares/erros.js) decide como responder a cada um.

class ErroAplicacao extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.name = this.constructor.name;
    this.status = status;
  }
}

// Dados enviados num formulário estão inválidos.
// `erros` é um objeto { nomeDoCampo: 'mensagem' } para mostrar junto de cada campo.
class ErroValidacao extends ErroAplicacao {
  constructor(erros = {}, mensagem = 'Confira os campos destacados.') {
    super(mensagem, 400);
    this.erros = erros;
  }
}

// A pessoa está logada, mas não tem permissão para esta ação ou recurso.
class ErroNaoAutorizado extends ErroAplicacao {
  constructor(mensagem = 'Você não tem permissão para acessar esta página.') {
    super(mensagem, 403);
  }
}

class ErroNaoEncontrado extends ErroAplicacao {
  constructor(mensagem = 'A página que você procurou não existe.') {
    super(mensagem, 404);
  }
}

// A ação é válida no formato, mas uma regra do hackathon impede (ex.: prazo encerrado).
class ErroRegraNegocio extends ErroAplicacao {
  constructor(mensagem) {
    super(mensagem, 422);
  }
}

module.exports = {
  ErroAplicacao,
  ErroValidacao,
  ErroNaoAutorizado,
  ErroNaoEncontrado,
  ErroRegraNegocio,
};
