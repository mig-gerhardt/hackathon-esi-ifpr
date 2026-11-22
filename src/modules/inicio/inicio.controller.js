const { QUANTIDADE_AVISOS_NA_INICIO } = require('../../lib/constantes');
const avisosService = require('../avisos/avisos.service');
const eventoService = require('../evento/evento.service');

async function mostrarInicio(req, res) {
  const ultimosAvisos = await avisosService.listarUltimosAvisos(QUANTIDADE_AVISOS_NA_INICIO);
  res.render('inicio/index', {
    titulo: 'Início',
    ultimosAvisos,
    inscricoesAbertas: eventoService.inscricoesAbertas(res.locals.evento),
  });
}

// Vitrine de todos os componentes visuais. Existe só em desenvolvimento.
function mostrarEstilo(_req, res) {
  res.render('inicio/estilo', { titulo: 'Guia de estilo' });
}

module.exports = { mostrarInicio, mostrarEstilo };
