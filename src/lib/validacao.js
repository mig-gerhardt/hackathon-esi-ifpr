// Peças reutilizáveis para os schemas zod dos módulos.
const { z } = require('zod');
const { deEntradaLocal } = require('./datas');
const { ErroNaoEncontrado } = require('./erros');

// Mensagens padrão em português para os casos que não personalizamos.
z.config(z.locales.pt());

function textoObrigatorio(rotulo, tamanhoMaximo) {
  return z
    .string({ error: `Informe ${rotulo}.` })
    .trim()
    .min(1, `Informe ${rotulo}.`)
    .max(tamanhoMaximo, `Use no máximo ${tamanhoMaximo} caracteres.`);
}

function textoOpcional(tamanhoMaximo) {
  return z
    .string()
    .trim()
    .max(tamanhoMaximo, `Use no máximo ${tamanhoMaximo} caracteres.`)
    .optional()
    .default('');
}

const campoEmail = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .min(1, 'Informe o e-mail.')
  .pipe(z.email('Informe um e-mail válido.'));

// Checkbox de formulário HTML: só é enviado quando marcado (valor "on").
const campoBooleano = z
  .enum(['on', 'true', 'false'])
  .optional()
  .transform((valor) => valor === 'on' || valor === 'true');

// Valor de <input type="datetime-local">, interpretado no horário de Brasília.
function campoDataHora(rotulo) {
  return z.string({ error: `Informe ${rotulo}.` }).transform((texto, contexto) => {
    const data = deEntradaLocal(texto);
    if (!data) {
      contexto.addIssue({ code: 'custom', message: `Informe ${rotulo} com dia e horário.` });
      return z.NEVER;
    }
    return data;
  });
}

function campoInteiro(rotulo, minimo, maximo) {
  return z.coerce
    .number({ error: `Informe ${rotulo}.` })
    .int(`Informe um número inteiro.`)
    .min(minimo, `O mínimo é ${minimo}.`)
    .max(maximo, `O máximo é ${maximo}.`);
}

function ehUrlHttps(texto) {
  try {
    const url = new URL(texto);
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}

const campoUrlHttps = z
  .string({ error: 'Informe o link.' })
  .trim()
  .min(1, 'Informe o link.')
  .max(300, 'Use no máximo 300 caracteres.')
  .refine(ehUrlHttps, 'Informe um link válido começando com https://');

const esquemaId = z.coerce.number().int().positive();

// Lê um id vindo da URL. Um id inválido é tratado como página inexistente.
function lerId(valor) {
  const resultado = esquemaId.safeParse(valor);
  if (!resultado.success) throw new ErroNaoEncontrado();
  return resultado.data;
}

module.exports = {
  textoObrigatorio,
  textoOpcional,
  campoEmail,
  campoBooleano,
  campoDataHora,
  campoInteiro,
  campoUrlHttps,
  ehUrlHttps,
  lerId,
};
