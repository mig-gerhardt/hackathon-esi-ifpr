const comissaoService = require('./comissao.service');

async function mostrarPainel(_req, res) {
  res.render('comissao/painel', {
    titulo: 'Painel da comissão',
    resumo: await comissaoService.obterResumo(),
  });
}

module.exports = { mostrarPainel };
