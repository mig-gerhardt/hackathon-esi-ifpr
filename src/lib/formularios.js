// Se o formulário voltou com erro, mostramos o que a pessoa digitou (guardado
// na sessão pelo middleware de erros); senão, os valores atuais do registro.
function valoresParaMostrar(res, valoresAtuais) {
  return Object.keys(res.locals.valores).length > 0 ? res.locals.valores : valoresAtuais;
}

module.exports = { valoresParaMostrar };
