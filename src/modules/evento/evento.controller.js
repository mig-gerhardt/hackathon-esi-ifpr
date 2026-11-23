const { paraEntradaLocal } = require('../../lib/datas');
const { valoresParaMostrar } = require('../../lib/formularios');
const eventoService = require('./evento.service');

function valoresDoFormulario(evento) {
  return {
    ...evento,
    dataHora: paraEntradaLocal(evento.dataHora),
    prazoInscricao: paraEntradaLocal(evento.prazoInscricao),
    prazoEntrega: paraEntradaLocal(evento.prazoEntrega),
    avaliacaoAberta: evento.avaliacaoAberta ? 'on' : undefined,
    resultadoPublicado: evento.resultadoPublicado ? 'on' : undefined,
  };
}

function mostrarConfiguracao(_req, res) {
  res.render('evento/formulario', {
    titulo: 'Configuração do evento',
    valores: valoresParaMostrar(res, valoresDoFormulario(res.locals.evento)),
  });
}

async function salvarConfiguracao(req, res) {
  await eventoService.atualizarEvento(req.body);
  req.flash('sucesso', 'Configuração do evento salva.');
  res.redirect('/comissao/evento');
}

module.exports = { mostrarConfiguracao, salvarConfiguracao };
