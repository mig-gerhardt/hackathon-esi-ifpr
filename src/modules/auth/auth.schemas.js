const { z } = require('zod');
const { textoObrigatorio, campoEmail } = require('../../lib/validacao');
const { TAMANHO_MINIMO_SENHA } = require('../../lib/constantes');

const TAMANHO_MAXIMO_SENHA = 72; // limite do bcrypt

const campoSenhaNova = z
  .string({ error: 'Crie uma senha.' })
  .min(TAMANHO_MINIMO_SENHA, `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`)
  .max(TAMANHO_MAXIMO_SENHA, `A senha pode ter no máximo ${TAMANHO_MAXIMO_SENHA} caracteres.`);

const esquemaLogin = z.object({
  email: campoEmail,
  senha: z
    .string({ error: 'Informe a senha.' })
    .min(1, 'Informe a senha.')
    .max(TAMANHO_MAXIMO_SENHA, 'E-mail ou senha incorretos.'),
});

const esquemaCadastro = z
  .object({
    nome: textoObrigatorio('seu nome', 100),
    email: campoEmail,
    senha: campoSenhaNova,
    confirmacaoSenha: z.string({ error: 'Repita a senha.' }),
  })
  .refine((dados) => dados.senha === dados.confirmacaoSenha, {
    path: ['confirmacaoSenha'],
    message: 'As senhas não são iguais.',
  });

module.exports = { esquemaLogin, esquemaCadastro, campoSenhaNova };
