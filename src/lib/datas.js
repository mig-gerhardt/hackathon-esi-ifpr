// Funções para exibir e ler datas sempre no horário de Brasília.

const FUSO_HORARIO = 'America/Sao_Paulo';
// O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo.
const DESLOCAMENTO_DO_FUSO = '-03:00';
const FORMATO_ENTRADA_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_HORARIO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatadorDiaMes = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_HORARIO,
  day: '2-digit',
  month: '2-digit',
});

const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_HORARIO,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const formatadorDiaPorExtenso = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_HORARIO,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

// Partes numéricas da data no fuso de Brasília: { year, month, day, hour, minute }.
const formatadorPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_HORARIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partesDaData(data) {
  const partes = {};
  for (const parte of formatadorPartes.formatToParts(data)) {
    partes[parte.type] = parte.value;
  }
  return partes;
}

function formatarData(data) {
  return formatadorData.format(data);
}

function formatarDiaMes(data) {
  return formatadorDiaMes.format(data);
}

function formatarHora(data) {
  return formatadorHora.format(data);
}

function formatarDataHora(data) {
  return `${formatarData(data)} às ${formatarHora(data)}`;
}

function formatarDiaPorExtenso(data) {
  const texto = formatadorDiaPorExtenso.format(data);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "aaaa-mm-dd" no fuso de Brasília. Usado para agrupar itens por dia.
function chaveDoDia(data) {
  const { year, month, day } = partesDaData(data);
  return `${year}-${month}-${day}`;
}

// Converte uma data para o formato do <input type="datetime-local">.
function paraEntradaLocal(data) {
  if (!data) return '';
  const { year, month, day, hour, minute } = partesDaData(data);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Lê o valor de um <input type="datetime-local"> (horário de Brasília).
// Retorna null se o texto não estiver no formato esperado.
function deEntradaLocal(texto) {
  if (typeof texto !== 'string' || !FORMATO_ENTRADA_LOCAL.test(texto)) return null;
  const data = new Date(`${texto}:00${DESLOCAMENTO_DO_FUSO}`);
  return Number.isNaN(data.getTime()) ? null : data;
}

module.exports = {
  FUSO_HORARIO,
  formatarData,
  formatarDiaMes,
  formatarHora,
  formatarDataHora,
  formatarDiaPorExtenso,
  chaveDoDia,
  paraEntradaLocal,
  deEntradaLocal,
};
