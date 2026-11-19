const fs = require('node:fs');
const path = require('node:path');
const { z } = require('zod');

const RAIZ_DO_PROJETO = path.resolve(__dirname, '..', '..');

// Nos testes (o Jest define NODE_ENV=test) lemos o .env.test; no resto, o .env.
// Variáveis já definidas no sistema (como no Render) têm prioridade sobre o arquivo.
function carregarArquivoDeAmbiente() {
  const nomeDoArquivo = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
  const caminho = path.join(RAIZ_DO_PROJETO, nomeDoArquivo);
  if (fs.existsSync(caminho)) {
    process.loadEnvFile(caminho);
  }
}

const esquemaAmbiente = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET precisa ter pelo menos 32 caracteres'),
  LIMITE_TENTATIVAS_LOGIN: z.coerce.number().int().positive().default(10),
  CUSTO_BCRYPT: z.coerce.number().int().min(4).max(15).default(12),
});

function lerConfiguracao() {
  carregarArquivoDeAmbiente();
  const resultado = esquemaAmbiente.safeParse(process.env);
  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((problema) => `${problema.path.join('.')}: ${problema.message}`)
      .join('; ');
    throw new Error(`Configuração de ambiente inválida. ${problemas}`);
  }
  const ambiente = resultado.data;
  return {
    ambiente: ambiente.NODE_ENV,
    ehProducao: ambiente.NODE_ENV === 'production',
    ehTeste: ambiente.NODE_ENV === 'test',
    porta: ambiente.PORT,
    segredoSessao: ambiente.SESSION_SECRET,
    limiteTentativasLogin: ambiente.LIMITE_TENTATIVAS_LOGIN,
    custoBcrypt: ambiente.CUSTO_BCRYPT,
  };
}

module.exports = lerConfiguracao();
