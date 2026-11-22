const { lerId } = require('../../lib/validacao');
const { NOMES_DOS_STATUS_EQUIPE } = require('../../lib/constantes');
const eventoService = require('../evento/evento.service');
const equipesService = require('./equipes.service');
const { esquemaFiltroStatus } = require('./equipes.schemas');

// ---------- Participante: "Minha equipe" ----------

async function mostrarMinhaEquipe(req, res) {
  const equipe = await equipesService.buscarEquipeDoUsuario(req.usuario.id);
  const { evento } = res.locals;
  res.render('equipes/minha-equipe', {
    titulo: 'Minha equipe',
    equipe,
    ehLider: equipe?.liderId === req.usuario.id,
    inscricoesAbertas: eventoService.inscricoesAbertas(evento),
    entregasAbertas: eventoService.entregasAbertas(evento),
  });
}

async function criarEquipe(req, res) {
  const equipe = await equipesService.criarEquipe(req.usuario, req.body);
  req.flash('sucesso', `Equipe ${equipe.nome} criada. Agora adicione os integrantes.`);
  res.redirect('/minha-equipe');
}

// As ações abaixo pegam a equipe do próprio usuário: ninguém consegue mexer
// numa equipe alheia trocando um id na URL.
function equipeDoUsuario(req) {
  return equipesService.buscarIdDaEquipeDoUsuario(req.usuario.id);
}

async function editarEquipe(req, res) {
  await equipesService.editarEquipe(req.usuario, await equipeDoUsuario(req), req.body);
  req.flash('sucesso', 'Nome da equipe atualizado.');
  res.redirect('/minha-equipe');
}

async function adicionarMembro(req, res) {
  const membro = await equipesService.adicionarMembro(
    req.usuario,
    await equipeDoUsuario(req),
    req.body,
  );
  req.flash('sucesso', `${membro.nome} entrou na equipe.`);
  res.redirect('/minha-equipe');
}

async function removerMembro(req, res) {
  const membro = await equipesService.removerMembro(
    req.usuario,
    await equipeDoUsuario(req),
    lerId(req.params.membroId),
  );
  req.flash('sucesso', `${membro.nome} saiu da equipe.`);
  res.redirect('/minha-equipe');
}

async function transferirLideranca(req, res) {
  await equipesService.transferirLideranca(
    req.usuario,
    await equipeDoUsuario(req),
    req.body.novoLiderId,
  );
  req.flash('sucesso', 'Liderança transferida.');
  res.redirect('/minha-equipe');
}

async function sairDaEquipe(req, res) {
  await equipesService.sairDaEquipe(req.usuario);
  req.flash('sucesso', 'Você saiu da equipe.');
  res.redirect('/minha-equipe');
}

async function confirmarExclusaoDaMinhaEquipe(req, res) {
  const equipe = await equipesService.buscarEquipeDoUsuario(req.usuario.id);
  if (!equipe) return res.redirect('/minha-equipe');
  res.render('comum/confirmar', {
    titulo: 'Excluir equipe',
    pergunta: `Excluir a equipe ${equipe.nome}?`,
    explicacao:
      'Todos os integrantes ficam sem equipe e o projeto enviado é apagado. Essa ação não pode ser desfeita.',
    acao: '/minha-equipe/excluir',
    rotuloDoBotao: 'Excluir equipe',
    voltar: '/minha-equipe',
  });
}

async function excluirMinhaEquipe(req, res) {
  const equipe = await equipesService.excluirEquipe(req.usuario, await equipeDoUsuario(req));
  req.flash('sucesso', `A equipe ${equipe.nome} foi excluída.`);
  res.redirect('/minha-equipe');
}

// ---------- Comissão: gestão das equipes ----------

async function listarEquipes(req, res) {
  const status = esquemaFiltroStatus.parse(req.query.status);
  const [equipes, contagem] = await Promise.all([
    equipesService.listarEquipes({ status }),
    equipesService.contarEquipesPorStatus(),
  ]);
  res.render('equipes/comissao-lista', {
    titulo: status ? `Equipes ${NOMES_DOS_STATUS_EQUIPE[status].toLowerCase()}s` : 'Equipes',
    equipes,
    contagem,
    statusSelecionado: status ?? null,
  });
}

async function mostrarEquipe(req, res) {
  const equipe = await equipesService.buscarEquipe(lerId(req.params.id));
  res.render('equipes/comissao-detalhe', { titulo: `Equipe ${equipe.nome}`, equipe });
}

async function aprovarEquipe(req, res) {
  const equipe = await equipesService.aprovarEquipe(lerId(req.params.id));
  req.flash('sucesso', `Equipe ${equipe.nome} aprovada.`);
  res.redirect(`/comissao/equipes/${equipe.id}`);
}

async function recusarEquipe(req, res) {
  const equipe = await equipesService.recusarEquipe(lerId(req.params.id), req.body);
  req.flash('sucesso', `Equipe ${equipe.nome} recusada.`);
  res.redirect(`/comissao/equipes/${equipe.id}`);
}

async function removerMembroPelaComissao(req, res) {
  const equipeId = lerId(req.params.id);
  const membro = await equipesService.removerMembro(
    req.usuario,
    equipeId,
    lerId(req.params.membroId),
  );
  req.flash('sucesso', `${membro.nome} foi removido da equipe.`);
  res.redirect(`/comissao/equipes/${equipeId}`);
}

async function confirmarExclusaoPelaComissao(req, res) {
  const equipe = await equipesService.buscarEquipe(lerId(req.params.id));
  res.render('comum/confirmar', {
    titulo: 'Excluir equipe',
    pergunta: `Excluir a equipe ${equipe.nome}?`,
    explicacao:
      'Os integrantes ficam sem equipe e o projeto e as notas da equipe são apagados. Essa ação não pode ser desfeita.',
    acao: `/comissao/equipes/${equipe.id}/excluir`,
    rotuloDoBotao: 'Excluir equipe',
    voltar: `/comissao/equipes/${equipe.id}`,
  });
}

async function excluirEquipePelaComissao(req, res) {
  const equipe = await equipesService.excluirEquipe(req.usuario, lerId(req.params.id));
  req.flash('sucesso', `A equipe ${equipe.nome} foi excluída.`);
  res.redirect('/comissao/equipes');
}

module.exports = {
  mostrarMinhaEquipe,
  criarEquipe,
  editarEquipe,
  adicionarMembro,
  removerMembro,
  transferirLideranca,
  sairDaEquipe,
  confirmarExclusaoDaMinhaEquipe,
  excluirMinhaEquipe,
  listarEquipes,
  mostrarEquipe,
  aprovarEquipe,
  recusarEquipe,
  removerMembroPelaComissao,
  confirmarExclusaoPelaComissao,
  excluirEquipePelaComissao,
};
