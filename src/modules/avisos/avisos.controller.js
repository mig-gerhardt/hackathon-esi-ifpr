const { lerId } = require('../../lib/validacao');
const { paraEntradaLocal } = require('../../lib/datas');
const { valoresParaMostrar } = require('../../lib/formularios');
const avisosService = require('./avisos.service');

// O mural público fica na página da agenda (agenda.controller.js).
// Aqui ficam as páginas da comissão.

async function listarAvisos(_req, res) {
  res.render('avisos/comissao-lista', {
    titulo: 'Avisos',
    avisos: await avisosService.listarTodosOsAvisos(),
    agora: new Date(),
  });
}

function valoresDoFormulario(aviso) {
  return {
    titulo: aviso.titulo,
    texto: aviso.texto,
    fixado: aviso.fixado ? 'on' : undefined,
    urgente: aviso.urgente ? 'on' : undefined,
    publicadoEm: paraEntradaLocal(aviso.publicadoEm),
  };
}

function mostrarNovoAviso(_req, res) {
  res.render('avisos/formulario', {
    titulo: 'Novo aviso',
    acao: '/comissao/avisos/novo',
    valores: valoresParaMostrar(res, { publicadoEm: paraEntradaLocal(new Date()) }),
  });
}

async function criarAviso(req, res) {
  await avisosService.criarAviso(req.body);
  req.flash('sucesso', 'Aviso publicado.');
  res.redirect('/comissao/avisos');
}

async function mostrarEdicao(req, res) {
  const aviso = await avisosService.buscarAviso(lerId(req.params.id));
  res.render('avisos/formulario', {
    titulo: `Editar aviso ${aviso.titulo}`,
    acao: `/comissao/avisos/${aviso.id}/editar`,
    valores: valoresParaMostrar(res, valoresDoFormulario(aviso)),
  });
}

async function atualizarAviso(req, res) {
  await avisosService.atualizarAviso(lerId(req.params.id), req.body);
  req.flash('sucesso', 'Aviso atualizado.');
  res.redirect('/comissao/avisos');
}

async function confirmarExclusao(req, res) {
  const aviso = await avisosService.buscarAviso(lerId(req.params.id));
  res.render('comum/confirmar', {
    titulo: 'Excluir aviso',
    pergunta: `Excluir o aviso "${aviso.titulo}"?`,
    explicacao: 'O aviso deixa de aparecer no mural e na faixa de avisos.',
    acao: `/comissao/avisos/${aviso.id}/excluir`,
    rotuloDoBotao: 'Excluir aviso',
    voltar: '/comissao/avisos',
  });
}

async function excluirAviso(req, res) {
  await avisosService.excluirAviso(lerId(req.params.id));
  req.flash('sucesso', 'Aviso excluído.');
  res.redirect('/comissao/avisos');
}

module.exports = {
  listarAvisos,
  mostrarNovoAviso,
  criarAviso,
  mostrarEdicao,
  atualizarAviso,
  confirmarExclusao,
  excluirAviso,
};
