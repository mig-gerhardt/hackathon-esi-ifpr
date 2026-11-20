// Contas de demonstração criadas pelo prisma/seed.js. A caixa "Entrar como"
// da página de login usa estes dados, mas só fora de produção.
const SENHA_DE_DEMONSTRACAO = 'hackathon2026';

const LOGINS_DE_DEMONSTRACAO = [
  { rotulo: 'Participante', email: 'lucas.almeida@estudantes.ifpr.edu.br' },
  { rotulo: 'Jurado', email: 'carlos.mendes@ifpr.edu.br' },
  { rotulo: 'Comissão', email: 'comissao.bcc@ifpr.edu.br' },
].map((login) => ({ ...login, senha: SENHA_DE_DEMONSTRACAO }));

module.exports = { SENHA_DE_DEMONSTRACAO, LOGINS_DE_DEMONSTRACAO };
