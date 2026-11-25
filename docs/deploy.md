# Deploy no Render com PostgreSQL

Este guia publica o sistema no [Render](https://render.com) usando um banco PostgreSQL gerenciado. São só instruções: nada aqui foi executado.

## 1. Preparar o projeto para PostgreSQL

Em desenvolvimento usamos SQLite. O Prisma não deixa trocar o banco por variável de ambiente, então o deploy usa um ajuste no schema:

1. Em `prisma/schema.prisma`, troque o provider:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. As migrations da pasta `prisma/migrations` foram geradas para SQLite. Gere uma migration inicial para PostgreSQL apontando para um Postgres local ou de teste (por exemplo, o próprio banco do Render antes de abrir o site):

   ```powershell
   Remove-Item -Recurse -Force prisma\migrations
   $env:DATABASE_URL = "postgresql://usuario:senha@host:5432/banco"
   npx prisma migrate dev --name modelo_inicial
   ```

3. Faça commit dessas mudanças numa branch de deploy (por exemplo `deploy`), para não quebrar o ambiente local em SQLite da branch principal.

> O código da aplicação não muda: não usamos nada exclusivo do SQLite.

## 2. Criar o banco no Render

1. No painel do Render: **New → PostgreSQL**.
2. Nome: `hackathon-bcc-db`. Região: a mesma que você vai usar no Web Service.
3. Depois de criado, copie a **Internal Database URL**.

## 3. Criar o Web Service

1. **New → Web Service** e conecte o repositório do GitHub (branch `deploy`).
2. Configure:

   | Campo         | Valor                                   |
   | ------------- | --------------------------------------- |
   | Runtime       | Node                                    |
   | Build Command | `npm ci && npx prisma migrate deploy`   |
   | Start Command | `npm start`                             |
   | Node version  | 20 ou mais (variável `NODE_VERSION=20`) |

3. Em **Environment**, crie as variáveis:

   | Variável                  | Valor                                                                                                                      |
   | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
   | `NODE_ENV`                | `production`                                                                                                               |
   | `DATABASE_URL`            | a Internal Database URL do passo 2                                                                                         |
   | `SESSION_SECRET`          | um texto aleatório com 64 caracteres (gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
   | `LIMITE_TENTATIVAS_LOGIN` | `10`                                                                                                                       |
   | `CUSTO_BCRYPT`            | `12`                                                                                                                       |

   O `PORT` é definido pelo próprio Render.

4. Clique em **Create Web Service**. O `postinstall` gera o cliente do Prisma e o build aplica as migrations.

## 4. Primeiro acesso

Em produção a caixa de login de demonstração **não aparece** e a página `/estilo` não existe.

Para criar a primeira conta da comissão:

1. Abra o site e crie uma conta em **Criar conta** (ela nasce como participante).
2. No Render, abra o **Shell** do Web Service e promova a conta:

   ```bash
   node -e "const p=require('./src/lib/prisma');p.usuario.update({where:{email:'seu.email@ifpr.edu.br'},data:{papel:'COMISSAO'}}).then(()=>p.\$disconnect())"
   ```

3. Entre de novo. Pela página **Configuração do evento**, ajuste datas, local e prazos. Cadastre critérios, agenda, avisos e jurados pelo painel.

Se quiser os dados de exemplo num ambiente de demonstração (nunca no evento real), rode `npm run db:seed` no Shell. **Ele apaga todos os dados.**

## 5. O que já está preparado para produção

- `trust proxy` ligado e cookie `secure` (o Render serve HTTPS na frente da aplicação).
- Content-Security-Policy com `upgrade-insecure-requests`.
- Sessões no PostgreSQL (sobrevivem a novos deploys).
- Desligamento limpo ao receber `SIGTERM` (fecha o banco antes de sair).
- Arquivos estáticos com cache de 1 dia.
