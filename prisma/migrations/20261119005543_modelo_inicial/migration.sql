-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'PARTICIPANTE',
    "equipeId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Usuario_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Equipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "nomeNormalizado" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivoRecusa" TEXT,
    "liderId" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Equipe_liderId_fkey" FOREIGN KEY ("liderId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "equipeId" INTEGER NOT NULL,
    "linkRepositorio" TEXT NOT NULL,
    "enviadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Projeto_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfiguracaoEvento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nome" TEXT NOT NULL,
    "edicao" INTEGER NOT NULL,
    "dataHora" DATETIME NOT NULL,
    "local" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazoInscricao" DATETIME NOT NULL,
    "prazoEntrega" DATETIME NOT NULL,
    "minIntegrantes" INTEGER NOT NULL DEFAULT 2,
    "maxIntegrantes" INTEGER NOT NULL DEFAULT 5,
    "avaliacaoAberta" BOOLEAN NOT NULL DEFAULT false,
    "resultadoPublicado" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ItemAgenda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "inicio" DATETIME NOT NULL,
    "fim" DATETIME NOT NULL,
    "local" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fixado" BOOLEAN NOT NULL DEFAULT false,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "publicadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Criterio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "peso" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Nota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "valor" REAL NOT NULL,
    "juradoId" INTEGER NOT NULL,
    "equipeId" INTEGER NOT NULL,
    "criterioId" INTEGER NOT NULL,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Nota_juradoId_fkey" FOREIGN KEY ("juradoId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Nota_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Nota_criterioId_fkey" FOREIGN KEY ("criterioId") REFERENCES "Criterio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComentarioAvaliacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "texto" TEXT NOT NULL,
    "juradoId" INTEGER NOT NULL,
    "equipeId" INTEGER NOT NULL,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "ComentarioAvaliacao_juradoId_fkey" FOREIGN KEY ("juradoId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComentarioAvaliacao_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_equipeId_idx" ON "Usuario"("equipeId");

-- CreateIndex
CREATE INDEX "Usuario_papel_idx" ON "Usuario"("papel");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_nomeNormalizado_key" ON "Equipe"("nomeNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_liderId_key" ON "Equipe"("liderId");

-- CreateIndex
CREATE INDEX "Equipe_status_idx" ON "Equipe"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_equipeId_key" ON "Projeto"("equipeId");

-- CreateIndex
CREATE INDEX "ItemAgenda_inicio_idx" ON "ItemAgenda"("inicio");

-- CreateIndex
CREATE INDEX "Aviso_publicadoEm_idx" ON "Aviso"("publicadoEm");

-- CreateIndex
CREATE INDEX "Nota_equipeId_idx" ON "Nota"("equipeId");

-- CreateIndex
CREATE INDEX "Nota_criterioId_idx" ON "Nota"("criterioId");

-- CreateIndex
CREATE UNIQUE INDEX "Nota_juradoId_equipeId_criterioId_key" ON "Nota"("juradoId", "equipeId", "criterioId");

-- CreateIndex
CREATE UNIQUE INDEX "ComentarioAvaliacao_juradoId_equipeId_key" ON "ComentarioAvaliacao"("juradoId", "equipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");
