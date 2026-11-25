# Rotas e permissões

Legenda: **✓** acessa · **—** não acessa. Quem não tem permissão recebe:

- **Visitante (sem login)** em rota protegida: redirecionado para `/entrar` (depois do login, volta para a página que tentou abrir).
- **Usuário logado com outro papel**: página **403 Acesso negado**.

Todas as rotas `POST` exigem o token CSRF do formulário (sem ele: **403**). Além do papel, as ações verificam o **recurso**: por exemplo, só o líder altera a própria equipe, e as rotas de `/minha-equipe` sempre usam a equipe do usuário logado (não há id de equipe na URL para trocar).

## Páginas públicas

| Método   | Rota           | Visitante | Participante | Jurado | Comissão | O que faz                              |
| -------- | -------------- | :-------: | :----------: | :----: | :------: | -------------------------------------- |
| GET      | `/`            |     ✓     |      ✓       |   ✓    |    ✓     | Início                                 |
| GET      | `/agenda`      |     ✓     |      ✓       |   ✓    |    ✓     | Agenda + mural de avisos               |
| GET      | `/resultados`  |    ✓¹     |      ✓¹      |   ✓¹   |    ✓     | Ranking                                |
| GET/POST | `/entrar`      |     ✓     |      ✓²      |   ✓²   |    ✓²    | Login (com limite de tentativas)       |
| GET/POST | `/criar-conta` |     ✓     |      ✓²      |   ✓²   |    ✓²    | Cadastro (sempre como participante)    |
| POST     | `/sair`        |     ✓     |      ✓       |   ✓    |    ✓     | Logout                                 |
| GET      | `/estilo`      |    ✓³     |      ✓³      |   ✓³   |    ✓³    | Guia de estilo (só em desenvolvimento) |

¹ Só depois que a comissão publica o resultado. Antes disso, a página explica que o resultado não foi divulgado. A comissão sempre vê (como prévia).
² Quem já está logado é redirecionado para a sua página.
³ Em produção a rota não existe (404).

## Participante

| Método   | Rota                                      | Participante | Jurado | Comissão | O que faz                           | Regras extras                              |
| -------- | ----------------------------------------- | :----------: | :----: | :------: | ----------------------------------- | ------------------------------------------ |
| GET      | `/minha-equipe`                           |      ✓       |   —    |    —     | Ver/criar equipe, membros, projeto  |                                            |
| POST     | `/minha-equipe`                           |      ✓       |   —    |    —     | Criar equipe                        | Sem equipe; até o prazo de inscrição       |
| POST     | `/minha-equipe/editar`                    |      ✓       |   —    |    —     | Renomear                            | Só o líder; até o prazo                    |
| POST     | `/minha-equipe/membros`                   |      ✓       |   —    |    —     | Adicionar membro pelo e-mail        | Só o líder; até o prazo; respeita o máximo |
| POST     | `/minha-equipe/membros/:membroId/remover` |      ✓       |   —    |    —     | Remover membro                      | Só o líder; não remove a si mesmo          |
| POST     | `/minha-equipe/lideranca`                 |      ✓       |   —    |    —     | Transferir liderança                | Só o líder; para um membro                 |
| POST     | `/minha-equipe/sair`                      |      ✓       |   —    |    —     | Sair da equipe                      | Não vale para o líder                      |
| GET/POST | `/minha-equipe/excluir`                   |      ✓       |   —    |    —     | Confirmar e excluir a equipe        | Só o líder; até o prazo                    |
| POST     | `/minha-equipe/projeto`                   |      ✓       |   —    |    —     | Enviar/trocar o link do repositório | Equipe aprovada; até o prazo de entrega    |

## Jurado

| Método | Rota                  | Participante | Jurado | Comissão | O que faz                               | Regras extras                    |
| ------ | --------------------- | :----------: | :----: | :------: | --------------------------------------- | -------------------------------- |
| GET    | `/jurado`             |      —       |   ✓    |    —     | Lista de equipes aprovadas com situação |                                  |
| GET    | `/jurado/equipes/:id` |      —       |   ✓    |    —     | Formulário de notas                     | Só equipes aprovadas (senão 404) |
| POST   | `/jurado/equipes/:id` |      —       |   ✓    |    —     | Salvar notas e comentário               | Avaliação aberta; notas 0–10     |

## Comissão

| Método   | Rota                                              | Participante | Jurado | Comissão | O que faz                                            |
| -------- | ------------------------------------------------- | :----------: | :----: | :------: | ---------------------------------------------------- |
| GET      | `/comissao`                                       |      —       |   —    |    ✓     | Painel (resumo e atalhos)                            |
| GET      | `/comissao/equipes`                               |      —       |   —    |    ✓     | Lista de equipes (`?status=` filtra)                 |
| GET      | `/comissao/equipes/:id`                           |      —       |   —    |    ✓     | Detalhe da equipe                                    |
| POST     | `/comissao/equipes/:id/aprovar`                   |      —       |   —    |    ✓     | Aprovar (exige o mínimo de integrantes)              |
| POST     | `/comissao/equipes/:id/recusar`                   |      —       |   —    |    ✓     | Recusar (motivo opcional)                            |
| POST     | `/comissao/equipes/:id/membros/:membroId/remover` |      —       |   —    |    ✓     | Remover membro (exceto o líder)                      |
| GET/POST | `/comissao/equipes/:id/excluir`                   |      —       |   —    |    ✓     | Confirmar e excluir a equipe                         |
| GET      | `/comissao/agenda`                                |      —       |   —    |    ✓     | Itens da agenda                                      |
| GET/POST | `/comissao/agenda/novo`                           |      —       |   —    |    ✓     | Criar item                                           |
| GET/POST | `/comissao/agenda/:id/editar`                     |      —       |   —    |    ✓     | Editar item                                          |
| GET/POST | `/comissao/agenda/:id/excluir`                    |      —       |   —    |    ✓     | Confirmar e excluir item                             |
| GET      | `/comissao/avisos`                                |      —       |   —    |    ✓     | Avisos (inclui agendados)                            |
| GET/POST | `/comissao/avisos/novo`                           |      —       |   —    |    ✓     | Criar aviso                                          |
| GET/POST | `/comissao/avisos/:id/editar`                     |      —       |   —    |    ✓     | Editar aviso                                         |
| GET/POST | `/comissao/avisos/:id/excluir`                    |      —       |   —    |    ✓     | Confirmar e excluir aviso                            |
| GET      | `/comissao/criterios`                             |      —       |   —    |    ✓     | Critérios                                            |
| GET/POST | `/comissao/criterios/novo`                        |      —       |   —    |    ✓     | Criar critério                                       |
| GET/POST | `/comissao/criterios/:id/editar`                  |      —       |   —    |    ✓     | Editar (bloqueado se já tem nota)                    |
| GET/POST | `/comissao/criterios/:id/excluir`                 |      —       |   —    |    ✓     | Excluir (bloqueado se já tem nota)                   |
| GET      | `/comissao/avaliacao`                             |      —       |   —    |    ✓     | Andamento da avaliação                               |
| POST     | `/comissao/avaliacao/abrir`                       |      —       |   —    |    ✓     | Abrir avaliação                                      |
| POST     | `/comissao/avaliacao/fechar`                      |      —       |   —    |    ✓     | Fechar avaliação                                     |
| POST     | `/comissao/avaliacao/publicar-resultado`          |      —       |   —    |    ✓     | Publicar o ranking                                   |
| POST     | `/comissao/avaliacao/ocultar-resultado`           |      —       |   —    |    ✓     | Tirar o ranking do ar                                |
| GET      | `/comissao/usuarios`                              |      —       |   —    |    ✓     | Usuários (`?papel=` filtra)                          |
| GET/POST | `/comissao/usuarios/novo-jurado`                  |      —       |   —    |    ✓     | Criar conta de jurado                                |
| POST     | `/comissao/usuarios/:id/papel`                    |      —       |   —    |    ✓     | Mudar papel (não o próprio; não quem está em equipe) |
| GET/POST | `/comissao/evento`                                |      —       |   —    |    ✓     | Configuração do evento                               |

## Onde isso está no código

- Papel: `exigirPapel(...)` em `src/middlewares/autenticacao.js`, aplicado em cada arquivo `*.routes.js`.
- Recurso: nos services (`garantirLider`, `buscarIdDaEquipeDoUsuario`, `buscarEquipeAprovada`, `alterarPapel`).
- CSRF: `src/middlewares/csrf.js`. Limite de login: `src/modules/auth/auth.routes.js`.
- Testes: `tests/integration/acesso.test.js` (cada papel tentando o que não pode).
