# Descrição dos casos de uso

## UC01 — Criar equipe

| Campo | Descrição |
|---|---|
| **Ator principal** | Equipe / participante |
| **Objetivo** | Registrar uma nova equipe no evento |
| **Pré-condições** | Inscrições abertas; participante com acesso ao sistema |
| **Pós-condições** | Equipe cadastrada, com um representante definido |
| **Fluxo principal** | 1. O participante acessa a tela de cadastro de equipe.<br>2. Informa o nome da equipe e os integrantes.<br>3. Define o capitão/representante.<br>4. Confirma o cadastro.<br>5. O sistema valida os dados e registra a equipe. |
| **Fluxo alternativo** | 2a. Nome de equipe já existente: o sistema pede outro nome.<br>4a. Campo obrigatório vazio: o sistema destaca o campo e não salva. |

---

## UC02 — Submeter o projeto

| Campo | Descrição |
|---|---|
| **Ator principal** | Equipe / participante |
| **Objetivo** | Enviar o projeto desenvolvido durante o hackathon |
| **Pré-condições** | Equipe cadastrada; período de submissão aberto |
| **Pós-condições** | Projeto registrado e disponível para avaliação |
| **Fluxo principal** | 1. O representante acessa a tela de submissão.<br>2. Informa título, descrição e link do repositório no GitHub.<br>3. Confirma o envio.<br>4. O sistema valida o link e registra a submissão com data e hora. |
| **Fluxo alternativo** | 2a. Link inválido: o sistema exibe erro e solicita correção.<br>1a. Prazo encerrado: o sistema bloqueia o envio e informa o motivo. |

---

## UC03 — Lançar notas

| Campo | Descrição |
|---|---|
| **Ator principal** | Jurados |
| **Objetivo** | Registrar a avaliação de cada projeto por critério |
| **Pré-condições** | Jurado atribuído ao evento; projetos submetidos |
| **Pós-condições** | Notas salvas e consideradas no ranking |
| **Fluxo principal** | 1. O jurado faz login.<br>2. Seleciona um projeto para avaliar (**Avaliar projetos**).<br>3. Preenche a nota de cada critério.<br>4. Confirma o lançamento.<br>5. O sistema salva as notas e atualiza o resultado parcial. |
| **Fluxo alternativo** | 3a. Nota fora do intervalo permitido: o sistema rejeita e pede correção.<br>4a. Jurado já avaliou o projeto: o sistema permite editar enquanto a avaliação estiver aberta. |

---

## UC04 — Configurar o evento

| Campo | Descrição |
|---|---|
| **Ator principal** | Comissão Organizadora |
| **Objetivo** | Definir dados, cronograma e critérios de avaliação do evento |
| **Pré-condições** | Usuário autenticado como organizador |
| **Pós-condições** | Evento configurado e cronograma visível ao público |
| **Fluxo principal** | 1. O organizador acessa a tela de configuração.<br>2. Informa nome, datas e cronograma.<br>3. Define os critérios de avaliação.<br>4. Salva as configurações. |
| **Fluxo alternativo** | 2a. Datas inconsistentes (fim antes do início): o sistema bloqueia e informa o erro. |

---

[⬅ Voltar ao índice](README.md)
