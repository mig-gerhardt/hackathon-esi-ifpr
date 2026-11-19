// Junta as rotas de todos os módulos.
const { Router } = require('express');

const rotas = Router();

rotas.use(require('./modules/inicio/inicio.routes'));
rotas.use(require('./modules/auth/auth.routes'));
rotas.use(require('./modules/equipes/equipes.routes'));
rotas.use(require('./modules/projetos/projetos.routes'));
rotas.use(require('./modules/agenda/agenda.routes'));
rotas.use(require('./modules/avisos/avisos.routes'));
rotas.use(require('./modules/criterios/criterios.routes'));
rotas.use(require('./modules/avaliacoes/avaliacoes.routes'));
rotas.use(require('./modules/ranking/ranking.routes'));
rotas.use(require('./modules/comissao/comissao.routes'));
rotas.use(require('./modules/usuarios/usuarios.routes'));
rotas.use(require('./modules/evento/evento.routes'));

module.exports = rotas;
