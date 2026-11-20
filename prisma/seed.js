// Dados de exemplo para desenvolvimento e demonstração.
// Rode com: npm run db:seed (ou npm run db:reset, que recria o banco e roda o seed).
// As datas são calculadas a partir de hoje, para os prazos sempre fazerem sentido.
const bcrypt = require('bcrypt');
const config = require('../src/config/env');
const prisma = require('../src/lib/prisma');
const { PAPEIS, STATUS_EQUIPE } = require('../src/lib/constantes');
const { deEntradaLocal, chaveDoDia } = require('../src/lib/datas');
const { SENHA_DE_DEMONSTRACAO } = require('../src/lib/demonstracao');
const { normalizarNome } = require('../src/modules/equipes/equipes.service');

const DIAS_ATE_O_EVENTO = 14;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Data (no horário de Brasília) a `dias` de hoje, no horário "HH:mm".
function emDias(dias, horario) {
  const dia = chaveDoDia(new Date(Date.now() + dias * MS_POR_DIA));
  return deEntradaLocal(`${dia}T${horario}`);
}

const PRIMEIRO_DIA = DIAS_ATE_O_EVENTO;
const SEGUNDO_DIA = DIAS_ATE_O_EVENTO + 1;

const comissao = { nome: 'Fernanda Lopes', email: 'comissao.bcc@ifpr.edu.br' };

const jurados = [
  { nome: 'Carlos Mendes', email: 'carlos.mendes@ifpr.edu.br' },
  { nome: 'Juliana Prado', email: 'juliana.prado@ifpr.edu.br' },
];

const participantes = [
  { nome: 'Lucas Almeida', email: 'lucas.almeida@estudantes.ifpr.edu.br' },
  { nome: 'Beatriz Santos', email: 'beatriz.santos@estudantes.ifpr.edu.br' },
  { nome: 'Rafael Oliveira', email: 'rafael.oliveira@estudantes.ifpr.edu.br' },
  { nome: 'Camila Rocha', email: 'camila.rocha@estudantes.ifpr.edu.br' },
  { nome: 'Gabriel Ferreira', email: 'gabriel.ferreira@estudantes.ifpr.edu.br' },
  { nome: 'Larissa Costa', email: 'larissa.costa@estudantes.ifpr.edu.br' },
  { nome: 'Thiago Martins', email: 'thiago.martins@estudantes.ifpr.edu.br' },
  { nome: 'Ana Clara Souza', email: 'anaclara.souza@estudantes.ifpr.edu.br' },
  { nome: 'Pedro Henrique Lima', email: 'pedro.lima@estudantes.ifpr.edu.br' },
  { nome: 'Mariana Ribeiro', email: 'mariana.ribeiro@estudantes.ifpr.edu.br' },
  { nome: 'Vinícius Carvalho', email: 'vinicius.carvalho@estudantes.ifpr.edu.br' },
  { nome: 'Isabela Gomes', email: 'isabela.gomes@estudantes.ifpr.edu.br' },
];

const equipes = [
  {
    nome: 'Byte Verde',
    status: STATUS_EQUIPE.APROVADA,
    membros: [0, 1, 2, 3],
    linkRepositorio: 'https://github.com/byte-verde/coleta-pinhais',
  },
  { nome: 'Código Aberto Pinhais', status: STATUS_EQUIPE.APROVADA, membros: [4, 5, 6] },
  { nome: 'Os Compiladores', status: STATUS_EQUIPE.PENDENTE, membros: [7, 8, 9] },
  {
    nome: 'Null Pointers',
    status: STATUS_EQUIPE.RECUSADA,
    membros: [10],
    motivoRecusa: 'A equipe tem só 1 integrante e o mínimo é 2.',
  },
];

const criterios = [
  {
    nome: 'Inovação',
    peso: 3,
    descricao: 'Originalidade da ideia e da abordagem para o problema.',
  },
  {
    nome: 'Execução técnica',
    peso: 3,
    descricao: 'Qualidade do código, funcionamento e uso adequado das tecnologias.',
  },
  {
    nome: 'Impacto',
    peso: 2,
    descricao: 'Quanto a solução ajuda as pessoas ou a comunidade de Pinhais.',
  },
  {
    nome: 'Apresentação',
    peso: 2,
    descricao: 'Clareza do pitch e da demonstração em até 5 minutos.',
  },
];

const agenda = [
  {
    titulo: 'Credenciamento',
    dia: PRIMEIRO_DIA,
    inicio: '13:00',
    fim: '14:00',
    local: 'Hall do bloco A',
    descricao: 'Retirada de crachás. Leve documento com foto.',
  },
  {
    titulo: 'Abertura',
    dia: PRIMEIRO_DIA,
    inicio: '14:00',
    fim: '14:30',
    local: 'Auditório',
    descricao: 'Boas-vindas, regras e apresentação dos desafios.',
  },
  {
    titulo: 'Início do desenvolvimento',
    dia: PRIMEIRO_DIA,
    inicio: '14:30',
    fim: '16:00',
    local: 'Laboratórios 1 a 4',
    descricao: '',
  },
  {
    titulo: 'Mentoria técnica',
    dia: PRIMEIRO_DIA,
    inicio: '16:00',
    fim: '18:00',
    local: 'Laboratório 2',
    descricao: 'Professores do curso tiram dúvidas de arquitetura e código.',
  },
  {
    titulo: 'Jantar',
    dia: PRIMEIRO_DIA,
    inicio: '19:00',
    fim: '20:00',
    local: 'Refeitório',
    descricao: '',
  },
  {
    titulo: 'Mentoria de pitch',
    dia: PRIMEIRO_DIA,
    inicio: '21:00',
    fim: '22:30',
    local: 'Sala 12',
    descricao: 'Como apresentar o projeto em 5 minutos.',
  },
  {
    titulo: 'Lanche da madrugada',
    dia: SEGUNDO_DIA,
    inicio: '00:00',
    fim: '00:30',
    local: 'Refeitório',
    descricao: '',
  },
  {
    titulo: 'Café da manhã',
    dia: SEGUNDO_DIA,
    inicio: '07:30',
    fim: '08:30',
    local: 'Refeitório',
    descricao: '',
  },
  {
    titulo: 'Entrega dos projetos',
    dia: SEGUNDO_DIA,
    inicio: '09:30',
    fim: '10:00',
    local: 'Online',
    descricao: 'Link do repositório enviado pelo site até as 10h.',
  },
  {
    titulo: 'Apresentações',
    dia: SEGUNDO_DIA,
    inicio: '10:15',
    fim: '12:30',
    local: 'Auditório',
    descricao: 'Cada equipe tem 5 minutos de pitch e 3 de perguntas.',
  },
  {
    titulo: 'Almoço',
    dia: SEGUNDO_DIA,
    inicio: '12:30',
    fim: '13:30',
    local: 'Refeitório',
    descricao: '',
  },
  {
    titulo: 'Premiação e encerramento',
    dia: SEGUNDO_DIA,
    inicio: '13:30',
    fim: '14:00',
    local: 'Auditório',
    descricao: '',
  },
];

const avisos = [
  {
    titulo: 'A abertura mudou para o auditório, às 14h',
    texto:
      'Por causa da reforma no bloco B, a abertura será no auditório principal, às 14h. O credenciamento continua no hall do bloco A.',
    urgente: true,
    fixado: false,
    diasAtras: 0,
  },
  {
    titulo: 'Leve documento com foto para o credenciamento',
    texto: 'Sem documento não conseguimos entregar o crachá. Vale RG, CNH ou carteirinha do IFPR.',
    urgente: false,
    fixado: true,
    diasAtras: 3,
  },
  {
    titulo: 'Mentorias abertas a todas as equipes',
    texto:
      'As mentorias técnica e de pitch não precisam de inscrição. Basta ir à sala no horário da agenda.',
    urgente: false,
    fixado: false,
    diasAtras: 1,
  },
];

// Notas lançadas: [jurado, equipe, notas por critério na ordem acima].
// Notas ausentes (null) deixam a avaliação parcial.
const notas = [
  [0, 0, [9, 8.5, 9, 8]],
  [1, 0, [8.5, 9, null, null]],
  [0, 1, [7.5, 8, 7, null]],
];

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

async function criarUsuarios(senhaHash) {
  const criar = (pessoa, papel) => prisma.usuario.create({ data: { ...pessoa, papel, senhaHash } });
  await criar(comissao, PAPEIS.COMISSAO);
  const contasDosJurados = [];
  for (const jurado of jurados) contasDosJurados.push(await criar(jurado, PAPEIS.JURADO));
  const contasDosParticipantes = [];
  for (const pessoa of participantes) {
    contasDosParticipantes.push(await criar(pessoa, PAPEIS.PARTICIPANTE));
  }
  return { contasDosJurados, contasDosParticipantes };
}

async function criarEquipes(contasDosParticipantes) {
  const criadas = [];
  for (const equipe of equipes) {
    const membros = equipe.membros.map((indice) => contasDosParticipantes[indice]);
    criadas.push(
      await prisma.equipe.create({
        data: {
          nome: equipe.nome,
          nomeNormalizado: normalizarNome(equipe.nome),
          status: equipe.status,
          motivoRecusa: equipe.motivoRecusa ?? null,
          liderId: membros[0].id,
          membros: { connect: membros.map((membro) => ({ id: membro.id })) },
          projeto: equipe.linkRepositorio
            ? { create: { linkRepositorio: equipe.linkRepositorio } }
            : undefined,
        },
      }),
    );
  }
  return criadas;
}

async function criarNotas(contasDosJurados, equipesCriadas, criteriosCriados) {
  for (const [indiceJurado, indiceEquipe, valores] of notas) {
    for (const [indiceCriterio, valor] of valores.entries()) {
      if (valor === null) continue;
      await prisma.nota.create({
        data: {
          valor,
          juradoId: contasDosJurados[indiceJurado].id,
          equipeId: equipesCriadas[indiceEquipe].id,
          criterioId: criteriosCriados[indiceCriterio].id,
        },
      });
    }
  }
  await prisma.comentarioAvaliacao.create({
    data: {
      juradoId: contasDosJurados[0].id,
      equipeId: equipesCriadas[0].id,
      texto:
        'Ideia muito bem resolvida. Vale mostrar o mapa de pontos de coleta logo no início do pitch.',
    },
  });
}

async function main() {
  await limparBanco();

  await prisma.configuracaoEvento.create({
    data: {
      id: 1,
      nome: '1º Hackathon do curso de Ciência da Computação',
      edicao: 1,
      dataHora: emDias(PRIMEIRO_DIA, '14:00'),
      local: 'IFPR Campus Pinhais',
      descricao:
        'Durante 24 horas, equipes de estudantes do curso criam soluções de software para problemas reais da cidade de Pinhais e do campus.',
      prazoInscricao: emDias(PRIMEIRO_DIA - 3, '23:59'),
      prazoEntrega: emDias(SEGUNDO_DIA, '10:00'),
      minIntegrantes: 2,
      maxIntegrantes: 5,
      avaliacaoAberta: true,
      resultadoPublicado: false,
    },
  });

  const senhaHash = await bcrypt.hash(SENHA_DE_DEMONSTRACAO, config.custoBcrypt);
  const { contasDosJurados, contasDosParticipantes } = await criarUsuarios(senhaHash);
  const equipesCriadas = await criarEquipes(contasDosParticipantes);

  const criteriosCriados = [];
  for (const criterio of criterios) {
    criteriosCriados.push(await prisma.criterio.create({ data: criterio }));
  }

  for (const { dia, inicio, fim, ...item } of agenda) {
    await prisma.itemAgenda.create({
      data: { ...item, inicio: emDias(dia, inicio), fim: emDias(dia, fim) },
    });
  }

  for (const { diasAtras, ...aviso } of avisos) {
    await prisma.aviso.create({
      data: { ...aviso, publicadoEm: new Date(Date.now() - diasAtras * MS_POR_DIA) },
    });
  }

  await criarNotas(contasDosJurados, equipesCriadas, criteriosCriados);

  console.info('Seed concluído. Senha de todas as contas de demonstração:', SENHA_DE_DEMONSTRACAO);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
