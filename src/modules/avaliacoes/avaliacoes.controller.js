const { lerId } = require('../../lib/validacao');
const { NOTA_MINIMA, NOTA_MAXIMA } = require('../../lib/constantes');
const avaliacoesService = require('./avaliacoes.service');
const eventoService = require('../evento/evento.service');
const { PREFIXO_CAMPO_NOTA } = require('./avaliacoes.schemas');

// ---------- Jurado ----------

async function mostrarPainelDoJurado(req, res) {
  res.render('avaliacoes/painel-jurado', {
    titulo: 'Painel do jurado',
    equipes: await avaliacoesService.listarEquipesParaJurado(req.usuario.id),
  });
}

// Valor de cada campo de nota, pelo nome do campo (criterio-<id>): o que foi
// digitado (se o formulário voltou com erro) ou a nota já salva.
function valoresDasNotas(res, notasPorCriterio) {
  const digitadas = res.locals.valores.notas;
  if (digitadas) return digitadas;
  const valores = {};
  for (const [criterioId, valor] of Object.entries(notasPorCriterio)) {
    valores[PREFIXO_CAMPO_NOTA + criterioId] = String(valor);
  }
  return valores;
}

async function mostrarAvaliacao(req, res) {
  const avaliacao = await avaliacoesService.obterAvaliacao(req.usuario.id, lerId(req.params.id));
  const voltouComErro = Object.keys(res.locals.valores).length > 0;
  res.render('avaliacoes/avaliar', {
    titulo: `Avaliar ${avaliacao.equipe.nome}`,
    ...avaliacao,
    valoresDasNotas: valoresDasNotas(res, avaliacao.notasPorCriterio),
    comentario: voltouComErro ? res.locals.valores.comentario : avaliacao.comentario,
    prefixoCampoNota: PREFIXO_CAMPO_NOTA,
    notaMinima: NOTA_MINIMA,
    notaMaxima: NOTA_MAXIMA,
  });
}

async function salvarAvaliacao(req, res) {
  const equipeId = lerId(req.params.id);
  await avaliacoesService.salvarAvaliacao(req.usuario.id, equipeId, req.body);
  req.flash('sucesso', 'Avaliação salva.');
  res.redirect('/jurado');
}

// ---------- Comissão: período de avaliação e publicação do resultado ----------

async function mostrarAvaliacaoDaComissao(_req, res) {
  res.render('avaliacoes/comissao-avaliacao', {
    titulo: 'Avaliação',
    resumo: await avaliacoesService.obterResumoDaAvaliacao(),
  });
}

function alternarConfiguracao(alterar, valor, mensagem) {
  return async (req, res) => {
    await alterar(valor);
    req.flash('sucesso', mensagem);
    res.redirect('/comissao/avaliacao');
  };
}

module.exports = {
  mostrarPainelDoJurado,
  mostrarAvaliacao,
  salvarAvaliacao,
  mostrarAvaliacaoDaComissao,
  abrirAvaliacao: alternarConfiguracao(
    eventoService.definirAvaliacaoAberta,
    true,
    'Avaliação aberta. Os jurados já podem lançar notas.',
  ),
  fecharAvaliacao: alternarConfiguracao(
    eventoService.definirAvaliacaoAberta,
    false,
    'Avaliação fechada. Os jurados não podem mais lançar notas.',
  ),
  publicarResultado: alternarConfiguracao(
    eventoService.definirResultadoPublicado,
    true,
    'Resultado publicado. O ranking já aparece em Resultados.',
  ),
  ocultarResultado: alternarConfiguracao(
    eventoService.definirResultadoPublicado,
    false,
    'O resultado deixou de ser público.',
  ),
};
