const { lerId } = require('../../lib/validacao');
const { valoresParaMostrar } = require('../../lib/formularios');
const { PESO_MINIMO, PESO_MAXIMO } = require('../../lib/constantes');
const criteriosService = require('./criterios.service');

const LIMITES_DO_PESO = { pesoMinimo: PESO_MINIMO, pesoMaximo: PESO_MAXIMO };

async function listarCriterios(_req, res) {
  res.render('criterios/lista', {
    titulo: 'Critérios de avaliação',
    criterios: await criteriosService.listarCriterios(),
  });
}

function mostrarNovoCriterio(_req, res) {
  res.render('criterios/formulario', {
    titulo: 'Novo critério',
    acao: '/comissao/criterios/novo',
    valores: valoresParaMostrar(res, {}),
    ...LIMITES_DO_PESO,
  });
}

async function criarCriterio(req, res) {
  await criteriosService.criarCriterio(req.body);
  req.flash('sucesso', 'Critério criado.');
  res.redirect('/comissao/criterios');
}

async function mostrarEdicao(req, res) {
  const criterio = await criteriosService.buscarCriterio(lerId(req.params.id));
  res.render('criterios/formulario', {
    titulo: `Editar critério ${criterio.nome}`,
    acao: `/comissao/criterios/${criterio.id}/editar`,
    valores: valoresParaMostrar(res, criterio),
    bloqueado: criterio._count.notas > 0,
    ...LIMITES_DO_PESO,
  });
}

async function atualizarCriterio(req, res) {
  await criteriosService.atualizarCriterio(lerId(req.params.id), req.body);
  req.flash('sucesso', 'Critério atualizado.');
  res.redirect('/comissao/criterios');
}

async function confirmarExclusao(req, res) {
  const criterio = await criteriosService.buscarCriterio(lerId(req.params.id));
  res.render('comum/confirmar', {
    titulo: 'Excluir critério',
    pergunta: `Excluir o critério "${criterio.nome}"?`,
    explicacao: 'O critério deixa de aparecer na avaliação dos jurados.',
    acao: `/comissao/criterios/${criterio.id}/excluir`,
    rotuloDoBotao: 'Excluir critério',
    voltar: '/comissao/criterios',
  });
}

async function excluirCriterio(req, res) {
  await criteriosService.excluirCriterio(lerId(req.params.id));
  req.flash('sucesso', 'Critério excluído.');
  res.redirect('/comissao/criterios');
}

module.exports = {
  listarCriterios,
  mostrarNovoCriterio,
  criarCriterio,
  mostrarEdicao,
  atualizarCriterio,
  confirmarExclusao,
  excluirCriterio,
};
