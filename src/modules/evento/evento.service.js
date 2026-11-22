const prisma = require('../../lib/prisma');
const { ErroValidacao } = require('../../lib/erros');

const ID_CONFIGURACAO = 1;

// Valores usados só se o banco ainda não tiver a configuração (antes do seed).
// A comissão ajusta tudo na página "Configuração do evento".
const CONFIGURACAO_INICIAL = {
  nome: '1º Hackathon do curso de Ciência da Computação',
  edicao: 1,
  local: 'IFPR Campus Pinhais',
  descricao: 'Equipes de estudantes desenvolvem, em 24 horas, soluções para problemas reais.',
  minIntegrantes: 2,
  maxIntegrantes: 5,
};

async function obterEvento() {
  const evento = await prisma.configuracaoEvento.findUnique({ where: { id: ID_CONFIGURACAO } });
  if (evento) return evento;
  const agora = new Date();
  return prisma.configuracaoEvento.upsert({
    where: { id: ID_CONFIGURACAO },
    update: {},
    create: {
      id: ID_CONFIGURACAO,
      ...CONFIGURACAO_INICIAL,
      dataHora: agora,
      prazoInscricao: agora,
      prazoEntrega: agora,
    },
  });
}

function validarRegrasDoEvento(dados) {
  const erros = {};
  if (dados.maxIntegrantes < dados.minIntegrantes) {
    erros.maxIntegrantes = 'O máximo precisa ser maior ou igual ao mínimo.';
  }
  if (dados.prazoEntrega < dados.prazoInscricao) {
    erros.prazoEntrega = 'O prazo de entrega precisa ser depois do prazo de inscrição.';
  }
  if (Object.keys(erros).length > 0) throw new ErroValidacao(erros);
}

async function atualizarEvento(dados) {
  validarRegrasDoEvento(dados);
  await obterEvento();
  return prisma.configuracaoEvento.update({ where: { id: ID_CONFIGURACAO }, data: dados });
}

async function definirAvaliacaoAberta(aberta) {
  await obterEvento();
  return prisma.configuracaoEvento.update({
    where: { id: ID_CONFIGURACAO },
    data: { avaliacaoAberta: aberta },
  });
}

async function definirResultadoPublicado(publicado) {
  await obterEvento();
  return prisma.configuracaoEvento.update({
    where: { id: ID_CONFIGURACAO },
    data: { resultadoPublicado: publicado },
  });
}

function inscricoesAbertas(evento, agora = new Date()) {
  return agora <= evento.prazoInscricao;
}

function entregasAbertas(evento, agora = new Date()) {
  return agora <= evento.prazoEntrega;
}

module.exports = {
  obterEvento,
  atualizarEvento,
  definirAvaliacaoAberta,
  definirResultadoPublicado,
  inscricoesAbertas,
  entregasAbertas,
};
