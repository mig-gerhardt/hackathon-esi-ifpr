const prisma = require('../../lib/prisma');
const { STATUS_EQUIPE } = require('../../lib/constantes');
const { formatarDataHora } = require('../../lib/datas');
const { ErroRegraNegocio } = require('../../lib/erros');
const eventoService = require('../evento/evento.service');
const equipesService = require('../equipes/equipes.service');

// Qualquer integrante de uma equipe aprovada envia (ou troca) o link até o prazo.
async function enviarProjeto(usuario, { linkRepositorio }, agora = new Date()) {
  const equipe = await equipesService.buscarEquipeDoUsuario(usuario.id);
  if (!equipe) {
    throw new ErroRegraNegocio('Você precisa fazer parte de uma equipe para enviar um projeto.');
  }
  if (equipe.status !== STATUS_EQUIPE.APROVADA) {
    throw new ErroRegraNegocio('Só equipes aprovadas pela comissão podem enviar o projeto.');
  }
  const evento = await eventoService.obterEvento();
  if (!eventoService.entregasAbertas(evento, agora)) {
    throw new ErroRegraNegocio(
      `O prazo de entrega terminou em ${formatarDataHora(evento.prazoEntrega)}.`,
    );
  }
  return prisma.projeto.upsert({
    where: { equipeId: equipe.id },
    create: { equipeId: equipe.id, linkRepositorio, enviadoEm: agora },
    update: { linkRepositorio },
  });
}

function contarProjetosEnviados() {
  return prisma.projeto.count({ where: { equipe: { status: STATUS_EQUIPE.APROVADA } } });
}

module.exports = { enviarProjeto, contarProjetosEnviados };
