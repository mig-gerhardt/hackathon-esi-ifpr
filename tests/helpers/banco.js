// Funções para preparar o banco de testes: limpar tudo e criar registros.
const bcrypt = require('bcrypt');
const prisma = require('../../src/lib/prisma');
const { PAPEIS, STATUS_EQUIPE } = require('../../src/lib/constantes');

const SENHA_PADRAO = 'senha-de-teste';
const DIA_MS = 24 * 60 * 60 * 1000;

let contador = 0;
let hashDaSenhaPadrao;

function proximoNumero() {
  contador += 1;
  return contador;
}

// Apaga todos os dados. Chamado antes de cada teste (beforeEach) ou suíte.
async function limparBanco() {
  await prisma.$transaction([
    prisma.nota.deleteMany(),
    prisma.comentarioAvaliacao.deleteMany(),
    prisma.projeto.deleteMany(),
    prisma.usuario.updateMany({ data: { equipeId: null } }),
    prisma.equipe.deleteMany(),
    prisma.usuario.deleteMany(),
    prisma.criterio.deleteMany(),
    prisma.itemAgenda.deleteMany(),
    prisma.aviso.deleteMany(),
    prisma.configuracaoEvento.deleteMany(),
    prisma.session.deleteMany(),
  ]);
}

// Evento com inscrições e entregas abertas por padrão.
function criarEvento(dados = {}) {
  const agora = Date.now();
  return prisma.configuracaoEvento.create({
    data: {
      id: 1,
      nome: '1º Hackathon do curso de Ciência da Computação',
      edicao: 1,
      dataHora: new Date(agora + 10 * DIA_MS),
      local: 'IFPR Campus Pinhais',
      descricao: 'Evento de teste.',
      prazoInscricao: new Date(agora + 7 * DIA_MS),
      prazoEntrega: new Date(agora + 11 * DIA_MS),
      minIntegrantes: 2,
      maxIntegrantes: 5,
      avaliacaoAberta: true,
      resultadoPublicado: false,
      ...dados,
    },
  });
}

async function criarUsuario({ papel = PAPEIS.PARTICIPANTE, ...dados } = {}) {
  hashDaSenhaPadrao ??= await bcrypt.hash(SENHA_PADRAO, 4);
  const numero = proximoNumero();
  return prisma.usuario.create({
    data: {
      nome: `Pessoa ${numero}`,
      email: `pessoa${numero}@estudantes.ifpr.edu.br`,
      senhaHash: hashDaSenhaPadrao,
      papel,
      ...dados,
    },
  });
}

// Cria uma equipe com o líder e os membros informados (o líder entra como membro).
function criarEquipe({ lider, membros = [], status = STATUS_EQUIPE.PENDENTE, nome } = {}) {
  const nomeDaEquipe = nome ?? `Equipe ${proximoNumero()}`;
  return prisma.equipe.create({
    data: {
      nome: nomeDaEquipe,
      nomeNormalizado: nomeDaEquipe.toLocaleLowerCase('pt-BR'),
      status,
      liderId: lider.id,
      membros: { connect: [lider, ...membros].map((pessoa) => ({ id: pessoa.id })) },
    },
  });
}

// Equipe aprovada com `quantidade` integrantes já criados.
async function criarEquipeAprovada(quantidade = 2, nome) {
  const pessoas = [];
  for (let i = 0; i < quantidade; i += 1) pessoas.push(await criarUsuario());
  const [lider, ...membros] = pessoas;
  const equipe = await criarEquipe({ lider, membros, status: STATUS_EQUIPE.APROVADA, nome });
  return { equipe, lider, membros };
}

function criarCriterio(dados = {}) {
  return prisma.criterio.create({
    data: { nome: `Critério ${proximoNumero()}`, peso: 1, ...dados },
  });
}

module.exports = {
  prisma,
  SENHA_PADRAO,
  DIA_MS,
  limparBanco,
  criarEvento,
  criarUsuario,
  criarEquipe,
  criarEquipeAprovada,
  criarCriterio,
};
