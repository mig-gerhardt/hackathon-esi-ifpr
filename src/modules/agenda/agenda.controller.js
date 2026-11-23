const { lerId } = require('../../lib/validacao');
const { paraEntradaLocal } = require('../../lib/datas');
const { valoresParaMostrar } = require('../../lib/formularios');
const agendaService = require('./agenda.service');
const avisosService = require('../avisos/avisos.service');

// ---------- Página pública: agenda + mural de avisos ----------

async function mostrarAgenda(_req, res) {
  const [itens, avisos] = await Promise.all([
    agendaService.listarItens(),
    avisosService.listarAvisosPublicados(),
  ]);
  res.render('agenda/agenda', {
    titulo: 'Agenda',
    dias: agendaService.agruparPorDia(itens),
    destaques: agendaService.destacarItens(itens),
    avisos,
  });
}

// ---------- Comissão ----------

async function listarItens(_req, res) {
  res.render('agenda/comissao-lista', {
    titulo: 'Agenda do evento',
    itens: await agendaService.listarItens(),
  });
}

function valoresDoFormulario(item) {
  return {
    titulo: item.titulo,
    descricao: item.descricao,
    local: item.local,
    inicio: paraEntradaLocal(item.inicio),
    fim: paraEntradaLocal(item.fim),
  };
}

function mostrarNovoItem(_req, res) {
  res.render('agenda/formulario', {
    titulo: 'Novo item da agenda',
    acao: '/comissao/agenda/novo',
    valores: valoresParaMostrar(res, {}),
  });
}

async function criarItem(req, res) {
  await agendaService.criarItem(req.body);
  req.flash('sucesso', 'Item adicionado à agenda.');
  res.redirect('/comissao/agenda');
}

async function mostrarEdicao(req, res) {
  const item = await agendaService.buscarItem(lerId(req.params.id));
  res.render('agenda/formulario', {
    titulo: `Editar ${item.titulo}`,
    acao: `/comissao/agenda/${item.id}/editar`,
    valores: valoresParaMostrar(res, valoresDoFormulario(item)),
  });
}

async function atualizarItem(req, res) {
  await agendaService.atualizarItem(lerId(req.params.id), req.body);
  req.flash('sucesso', 'Item da agenda atualizado.');
  res.redirect('/comissao/agenda');
}

async function confirmarExclusao(req, res) {
  const item = await agendaService.buscarItem(lerId(req.params.id));
  res.render('comum/confirmar', {
    titulo: 'Excluir item da agenda',
    pergunta: `Excluir "${item.titulo}" da agenda?`,
    explicacao: 'O item deixa de aparecer na página pública da agenda.',
    acao: `/comissao/agenda/${item.id}/excluir`,
    rotuloDoBotao: 'Excluir item',
    voltar: '/comissao/agenda',
  });
}

async function excluirItem(req, res) {
  await agendaService.excluirItem(lerId(req.params.id));
  req.flash('sucesso', 'Item removido da agenda.');
  res.redirect('/comissao/agenda');
}

module.exports = {
  mostrarAgenda,
  listarItens,
  mostrarNovoItem,
  criarItem,
  mostrarEdicao,
  atualizarItem,
  confirmarExclusao,
  excluirItem,
};
