const { ErroValidacao } = require('../lib/erros');

// Converte os problemas do zod em { campo: 'mensagem' }, ficando com a
// primeira mensagem de cada campo. Campos aninhados viram "notas.3".
function errosPorCampo(problemas) {
  const erros = {};
  for (const problema of problemas) {
    const campo = problema.path.join('.') || 'formulario';
    if (!erros[campo]) erros[campo] = problema.message;
  }
  return erros;
}

// Valida `dados` com o schema e devolve os dados já limpos e convertidos.
function validar(esquema, dados) {
  const resultado = esquema.safeParse(dados);
  if (!resultado.success) {
    throw new ErroValidacao(errosPorCampo(resultado.error.issues));
  }
  return resultado.data;
}

// Middleware para as rotas: valida o corpo do formulário e troca req.body
// pelos dados validados. O controller só recebe dados confiáveis.
// O texto original fica em req.corpoOriginal, para o formulário voltar
// exatamente como a pessoa digitou se o service recusar os dados.
function validarCorpo(esquema) {
  return (req, _res, next) => {
    req.corpoOriginal = req.body ?? {};
    req.body = validar(esquema, req.corpoOriginal);
    next();
  };
}

// Define para onde o usuário volta se o formulário tiver erro.
// Aceita um caminho fixo ou uma função que recebe a requisição.
function voltarPara(destino) {
  return (req, _res, next) => {
    req.voltarPara = typeof destino === 'function' ? destino(req) : destino;
    next();
  };
}

module.exports = { validar, validarCorpo, voltarPara, errosPorCampo };
