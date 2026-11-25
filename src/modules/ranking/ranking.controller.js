const rankingService = require('./ranking.service');

async function mostrarResultados(req, res) {
  const { evento } = res.locals;
  const podeVer = rankingService.podeVerResultado(req.usuario, evento);
  const ranking = podeVer ? await rankingService.obterRanking() : null;
  res.render('ranking/resultados', {
    titulo: 'Resultados',
    ranking,
    ehPrevia: podeVer && !evento.resultadoPublicado,
  });
}

module.exports = { mostrarResultados };
