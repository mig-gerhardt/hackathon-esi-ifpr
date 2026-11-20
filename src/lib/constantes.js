const PAPEIS = Object.freeze({
  PARTICIPANTE: 'PARTICIPANTE',
  JURADO: 'JURADO',
  COMISSAO: 'COMISSAO',
});

const NOMES_DOS_PAPEIS = Object.freeze({
  PARTICIPANTE: 'Participante',
  JURADO: 'Jurado',
  COMISSAO: 'Comissão',
});

const STATUS_EQUIPE = Object.freeze({
  PENDENTE: 'PENDENTE',
  APROVADA: 'APROVADA',
  RECUSADA: 'RECUSADA',
});

const NOMES_DOS_STATUS_EQUIPE = Object.freeze({
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
});

// Situação da avaliação de uma equipe do ponto de vista de um jurado.
const SITUACAO_AVALIACAO = Object.freeze({
  PENDENTE: 'PENDENTE',
  PARCIAL: 'PARCIAL',
  AVALIADA: 'AVALIADA',
});

const NOMES_DAS_SITUACOES_AVALIACAO = Object.freeze({
  PENDENTE: 'Pendente',
  PARCIAL: 'Parcial',
  AVALIADA: 'Avaliada',
});

const NOTA_MINIMA = 0;
const NOTA_MAXIMA = 10;
const PESO_MINIMO = 1;
const PESO_MAXIMO = 5;
const CASAS_DECIMAIS_RANKING = 2;
const QUANTIDADE_AVISOS_NA_INICIO = 3;
const TAMANHO_MINIMO_SENHA = 8;

module.exports = {
  PAPEIS,
  NOMES_DOS_PAPEIS,
  STATUS_EQUIPE,
  NOMES_DOS_STATUS_EQUIPE,
  SITUACAO_AVALIACAO,
  NOMES_DAS_SITUACOES_AVALIACAO,
  NOTA_MINIMA,
  NOTA_MAXIMA,
  PESO_MINIMO,
  PESO_MAXIMO,
  CASAS_DECIMAIS_RANKING,
  QUANTIDADE_AVISOS_NA_INICIO,
  TAMANHO_MINIMO_SENHA,
};
