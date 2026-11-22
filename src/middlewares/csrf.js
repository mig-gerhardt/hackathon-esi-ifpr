// Proteção contra CSRF com o padrão "synchronizer token": um token secreto fica
// guardado na sessão e é colocado num campo escondido (_csrf) de cada formulário.
// Todo POST precisa devolver o mesmo token; outro site não consegue lê-lo.
const { csrfSync } = require('csrf-sync');

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.body?._csrf,
});

function disponibilizarTokenCsrf(req, res, next) {
  res.locals.csrfToken = generateToken(req);
  next();
}

module.exports = {
  protecaoCsrf: csrfSynchronisedProtection,
  disponibilizarTokenCsrf,
};
