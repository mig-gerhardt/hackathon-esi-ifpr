const { PAPEIS } = require('../../lib/constantes');
const equipesService = require('../equipes/equipes.service');
const projetosService = require('../projetos/projetos.service');
const usuariosService = require('../usuarios/usuarios.service');
const avaliacoesService = require('../avaliacoes/avaliacoes.service');

// Números do painel da comissão, reunidos a partir dos outros módulos.
async function obterResumo() {
  const [equipesPorStatus, quantidadeDeJurados, projetosEnviados, avaliacao] = await Promise.all([
    equipesService.contarEquipesPorStatus(),
    usuariosService.contarUsuariosPorPapel(PAPEIS.JURADO),
    projetosService.contarProjetosEnviados(),
    avaliacoesService.obterResumoDaAvaliacao(),
  ]);
  return { equipesPorStatus, quantidadeDeJurados, projetosEnviados, avaliacao };
}

module.exports = { obterResumo };
