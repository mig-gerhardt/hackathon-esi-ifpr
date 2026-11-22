const projetosService = require('./projetos.service');

async function enviarProjeto(req, res) {
  await projetosService.enviarProjeto(req.usuario, req.body);
  req.flash('sucesso', 'Link do projeto salvo. Vocês podem trocá-lo até o prazo de entrega.');
  res.redirect('/minha-equipe');
}

module.exports = { enviarProjeto };
