# Hackathon BCC

Sistema web do **1º Hackathon do curso de Ciência da Computação do IFPR Campus Pinhais**: inscrição de equipes, agenda, avisos, envio dos projetos, avaliação pelos jurados e ranking final.

Projeto da disciplina de Engenharia de Software I.

## Funcionalidades por papel

Site: https://hackathon-esi-ifpr.onrender.com/

**Visitante**

- Página inicial com as informações do evento, como participar e os últimos avisos.
- Agenda do evento agrupada por dia, com destaque para o que está acontecendo agora e o próximo item, e mural de avisos.
- Faixa com o aviso urgente mais recente no topo de todas as páginas.
- Resultados, depois que a comissão publica o ranking.

**Participante** (toda conta criada pelo site)

- Cria a equipe e vira líder; adiciona e remove integrantes pelo e-mail; transfere a liderança; exclui a equipe (com confirmação). Tudo até o prazo de inscrição.
- Integrantes que não são líderes podem sair da equipe.
- Acompanha o status (pendente, aprovada, recusada com motivo).
- Com a equipe aprovada, envia e troca o link do repositório até o prazo de entrega.

**Jurado** (conta criada pela comissão)

- Painel com as equipes aprovadas e a situação de cada uma (avaliada, parcial, pendente).
- Nota de 0 a 10 por critério (uma casa decimal) e comentário opcional. Avaliar de novo atualiza as notas.

**Comissão organizadora**

- Painel com o resumo: equipes por status, jurados, avaliações pendentes e projetos enviados.
- Equipes: lista com filtro, aprovação (exige o mínimo de integrantes), recusa com motivo, remoção de integrantes, exclusão.
- Agenda, avisos (fixados, urgentes, agendados) e critérios de avaliação (com peso de 1 a 5).
- Avaliação: abre e fecha o período, acompanha o andamento por jurado, publica o resultado.
- Usuários: cria jurados e muda papéis.
- Configuração do evento: nome, edição, data, local, descrição, prazos e limites de integrantes.

## Stack

- Node.js 20+ e Express 5 (monolito)
- EJS com layout e partials (páginas renderizadas no servidor)
- Prisma com SQLite (desenvolvimento e testes) e PostgreSQL (produção)
- zod (validação), express-session com sessões no banco, bcrypt
- helmet, csrf-sync, express-rate-limit
- Jest + supertest, ESLint (flat config) + Prettier
- CSS próprio com variáveis; ícones Lucide em SVG

## Como instalar e rodar (Windows)

Pré-requisitos: [Node.js 20 ou mais novo](https://nodejs.org) e Git.

1. Baixe o projeto e entre na pasta:

   ```powershell
   git clone https://github.com/mig-gerhardt/hackathon-esi-ifpr.git
   cd hackathon-esi-ifpr
   ```

2. Instale as dependências (isso também gera o cliente do Prisma):

   ```powershell
   npm install
   ```

3. Crie o arquivo de configuração a partir do exemplo e troque o `SESSION_SECRET` por um texto aleatório:

   ```powershell
   Copy-Item .env.example .env
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Cole o valor gerado em `SESSION_SECRET` no arquivo `.env`.

4. Crie o banco e carregue os dados de exemplo:

   ```powershell
   npm run db:reset
   ```

5. Suba o servidor e abra http://localhost:3000:

   ```powershell
   npm run dev
   ```

### Scripts

| Script                  | O que faz                                                 |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Sobe o servidor e reinicia a cada alteração               |
| `npm start`             | Sobe o servidor (produção)                                |
| `npm test`              | Roda todos os testes                                      |
| `npm run test:coverage` | Testes com relatório de cobertura (`coverage/index.html`) |
| `npm run lint`          | ESLint                                                    |
| `npm run format`        | Formata o código com o Prettier                           |
| `npm run db:migrate`    | Cria/aplica migrations em desenvolvimento                 |
| `npm run db:seed`       | Apaga os dados e carrega os dados de exemplo              |
| `npm run db:reset`      | Recria o banco do zero e roda o seed                      |

## Usuários de demonstração

Criados pelo seed. **Senha de todos: `hackathon2026`.**

| Papel        | E-mail                                     | Observação                                         |
| ------------ | ------------------------------------------ | -------------------------------------------------- |
| Comissão     | `comissao.bcc@ifpr.edu.br`                 | Fernanda Lopes                                     |
| Jurado       | `carlos.mendes@ifpr.edu.br`                | Já avaliou parte das equipes                       |
| Jurado       | `juliana.prado@ifpr.edu.br`                | Avaliação parcial                                  |
| Participante | `lucas.almeida@estudantes.ifpr.edu.br`     | Líder da equipe Byte Verde (aprovada, com projeto) |
| Participante | `gabriel.ferreira@estudantes.ifpr.edu.br`  | Líder da Código Aberto Pinhais (aprovada)          |
| Participante | `anaclara.souza@estudantes.ifpr.edu.br`    | Líder de Os Compiladores (pendente)                |
| Participante | `vinicius.carvalho@estudantes.ifpr.edu.br` | Null Pointers (recusada)                           |
| Participante | `isabela.gomes@estudantes.ifpr.edu.br`     | Sem equipe                                         |

Em desenvolvimento, a página **Entrar** tem a caixa "Entrar como (só no protótipo)", que preenche o formulário com essas contas. Em produção ela não aparece.

As datas do seed são calculadas a partir do dia em que ele roda: o evento fica 14 dias à frente, as inscrições fecham 3 dias antes e a avaliação já começa aberta para a demonstração.

## Testes

```powershell
npm test
npm run test:coverage
```

- Os testes usam um banco separado (`prisma/teste.db`, configurado em `.env.test`), recriado a cada execução.
- `tests/unit/`: regras de negócio de cada service (equipes, projetos, avaliações, ranking, usuários, agenda, avisos, critérios, evento) e os schemas de validação.
- `tests/integration/`: cadastro e login, proteção de rotas por papel, CSRF, telas da comissão e da equipe, e o fluxo completo (inscrição → aprovação → avaliação → publicação → resultados).
- A cobertura mínima de 80% nos services é exigida pelo Jest (`jest.config.js`). Abra `coverage/index.html` para ver o relatório.

O GitHub Actions (`.github/workflows/ci.yml`) roda lint e testes com cobertura a cada push e pull request.

## Estrutura de pastas

```
src/
  app.js              configura o Express (usado pelo servidor e pelos testes)
  server.js           sobe o servidor
  rotas.js            junta as rotas dos módulos
  config/env.js       lê e valida o .env
  lib/                Prisma, erros, datas, constantes, validação
  middlewares/        autenticação, CSRF, validação, erros, variáveis das views
  modules/            um módulo por assunto (auth, equipes, projetos, agenda, avisos,
                      criterios, avaliacoes, ranking, comissao, usuarios, evento, inicio),
                      cada um com routes, controller, service e schemas
  views/              layout, partials e páginas EJS por módulo
  public/             CSS, JavaScript do navegador e imagens
prisma/               schema, migrations e seed
tests/                unit, integration e helpers
docs/                 arquitetura, rotas e permissões, deploy
```

## Documentação

- [Arquitetura, diagrama ER e decisões técnicas](docs/arquitetura.md)
- [Rotas e permissões](docs/rotas-e-permissoes.md)
- [Deploy no Render com PostgreSQL](docs/deploy.md)

## Equipe

- Miguel Gerhardt Soares e Silva
- Michelly Morena de Castro Loyola

## Disciplina

Engenharia de Software I — Profa. Lauriana Paludo — Bacharelado em Ciência da Computação, IFPR Campus Pinhais
