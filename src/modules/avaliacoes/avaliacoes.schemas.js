const { z } = require('zod');
const { textoOpcional } = require('../../lib/validacao');
const { NOTA_MINIMA, NOTA_MAXIMA } = require('../../lib/constantes');

const PRECISAO = 1e-9;

// Aceita no máximo uma casa decimal: 8 e 8.5 valem; 8.25 não.
function temNoMaximoUmaCasaDecimal(valor) {
  return Math.abs(Math.round(valor * 10) - valor * 10) < PRECISAO;
}

// Nota de um critério. Vazia = sem nota. Aceita vírgula ou ponto ("8,5" ou "8.5").
const campoNota = z
  .string()
  .trim()
  .transform((texto, contexto) => {
    if (texto === '') return undefined;
    const valor = Number(texto.replace(',', '.'));
    if (!Number.isFinite(valor) || valor < NOTA_MINIMA || valor > NOTA_MAXIMA) {
      contexto.addIssue({
        code: 'custom',
        message: `Dê uma nota de ${NOTA_MINIMA} a ${NOTA_MAXIMA}.`,
      });
      return z.NEVER;
    }
    if (!temNoMaximoUmaCasaDecimal(valor)) {
      contexto.addIssue({ code: 'custom', message: 'Use no máximo uma casa decimal (ex.: 8,5).' });
      return z.NEVER;
    }
    return valor;
  });

// Cada campo do formulário se chama notas[criterio-<id>]. O prefixo evita que
// o leitor de formulários do Express transforme as notas em array (o que ele
// faz quando a chave é só um número). Depois de validar, as chaves viram só o id.
const PREFIXO_CAMPO_NOTA = 'criterio-';
const chaveDoCampoNota = new RegExp(`^${PREFIXO_CAMPO_NOTA}\\d+$`);

function notasPorIdDoCriterio(notas) {
  return Object.fromEntries(
    Object.entries(notas).map(([chave, valor]) => [chave.slice(PREFIXO_CAMPO_NOTA.length), valor]),
  );
}

const esquemaAvaliacao = z.object({
  notas: z
    .record(z.string().regex(chaveDoCampoNota), campoNota)
    .optional()
    .default({})
    .transform(notasPorIdDoCriterio),
  comentario: textoOpcional(1000),
});

module.exports = { esquemaAvaliacao, campoNota, temNoMaximoUmaCasaDecimal, PREFIXO_CAMPO_NOTA };
