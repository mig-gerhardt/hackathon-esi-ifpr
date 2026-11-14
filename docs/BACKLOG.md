# Backlog — Sistema do 1º Hackathon do BCC

Stack: Node.js + Express + EJS + Prisma. Entrega: 28/11/2026.

21 Issues: 11 do Miguel, 7 da Michelly e 3 da dupla. Cada uma diz o objetivo, por que importa e quando está pronta. O "como" fica com quem for fazer.

## 0 · Fundação (até 16/11)

### Modelar o banco de dados (diagrama ER e schema do Prisma)
**Michelly**

**Objetivo:** Definir como as informações do hackathon ficam guardadas: pessoas, equipes, avaliações, agenda e avisos.

**Por quê:** Todas as outras partes do sistema dependem desse modelo. Ele é o acordo entre a dupla.

**Pronto quando:**
- O modelo está documentado no repositório
- A dupla revisou e aprovou
- O banco funciona no projeto

### Montar o esqueleto do projeto
**Miguel**

**Objetivo:** Ter o projeto base rodando, com a organização das pastas e as ferramentas de padronização definidas.

**Por quê:** É a fundação onde as duas partes vão ser construídas. Sem ela, cada um começaria de um jeito.

**Pronto quando:**
- Qualquer um clona o repositório e consegue rodar o site na própria máquina
- A organização do projeto está definida
- O código segue um padrão de formatação verificado automaticamente

### Escrever o CONTEXTO.md e um módulo de exemplo
**Miguel**

**Objetivo:** Registrar as convenções do projeto e deixar um exemplo de referência.

**Por quê:** Cada um trabalha com a própria IA. Esse material garante que o código das duas partes saia coerente.

**Pronto quando:**
- As convenções estão documentadas
- Existe um exemplo funcionando que serve de molde
- A dupla concorda com as regras

### Criar o layout e a identidade visual do site
**Miguel**

**Objetivo:** Criar a aparência comum a todas as páginas do site.

**Por quê:** Dá unidade ao sistema e evita que cada tela tenha um estilo diferente.

**Pronto quando:**
- Todas as páginas compartilham o mesmo layout
- A navegação se adapta a quem está usando
- O visual é coerente com o protótipo

### Configurar a validação de formulários e os dados de exemplo
**Michelly**

**Objetivo:** Garantir que o sistema só aceite dados válidos e ter um banco populado para testes e para a demonstração.

**Por quê:** Dados errados quebram o sistema. Dados de exemplo agilizam o desenvolvimento e a apresentação.

**Pronto quando:**
- Os formulários recusam dados inválidos com mensagens claras
- Há um jeito simples de popular o banco com dados realistas

### Organizar o GitHub do projeto
**Michelly**

**Objetivo:** Deixar o repositório e o quadro organizados para o trabalho em dupla.

**Por quê:** A professora pediu o quadro, e regras claras evitam que mudanças entrem sem revisão.

**Pronto quando:**
- O quadro mostra o andamento real do projeto
- Toda mudança passa por revisão antes de entrar na main

## 1 · Autenticação (até 18/11)

### Implementar cadastro, login e logout
**Miguel**

**Objetivo:** Permitir que as pessoas criem conta e acessem o sistema.

**Por quê:** Inscrições, avaliações e a gestão do evento dependem de saber quem está usando.

**Pronto quando:**
- Uma pessoa consegue criar conta, entrar e sair
- As senhas são guardadas com segurança
- Os erros são informados com clareza

### Implementar o controle de acesso por papel
**Miguel**

**Objetivo:** Garantir que cada pessoa só acesse o que corresponde ao seu papel: organizador, jurado ou participante.

**Por quê:** Um participante não pode dar notas, nem um jurado mexer na organização do evento.

**Pronto quando:**
- Cada área do sistema só abre para quem tem permissão
- Tentativas de acesso indevido são bloqueadas

## 2 · Equipes (até 21/11)

### Implementar a inscrição de equipe
**Miguel**

**Objetivo:** Permitir que os participantes formem e inscrevam suas equipes.

**Por quê:** É a porta de entrada dos participantes no hackathon.

**Pronto quando:**
- Um participante consegue criar uma equipe e reunir os colegas
- As regras de inscrição são respeitadas
- A tela segue o protótipo

### Implementar a gestão de equipes
**Miguel**

**Objetivo:** Permitir acompanhar, ajustar e validar as equipes inscritas.

**Por quê:** A organização precisa controlar quem está participando, e as equipes precisam poder corrigir seus dados.

**Pronto quando:**
- As equipes inscritas podem ser consultadas
- Quem tem permissão consegue ajustar uma equipe
- A organização aprova ou recusa as inscrições

## 3 · Agenda e avisos (até 21/11)

### Implementar a agenda do evento
**Michelly**

**Objetivo:** Mostrar a programação do hackathon e permitir que a organização a mantenha atualizada.

**Por quê:** Os participantes precisam saber o que acontece e quando.

**Pronto quando:**
- A organização gerencia os eventos da agenda
- Qualquer pessoa consulta a programação
- Fica claro o que está acontecendo agora
- A tela segue o protótipo

### Implementar o mural de avisos
**Michelly**

**Objetivo:** Permitir que a organização se comunique com os participantes.

**Por quê:** Durante o evento surgem mudanças e informações urgentes.

**Pronto quando:**
- A organização publica e gerencia avisos
- Os avisos ficam visíveis junto da agenda
- Avisos importantes se destacam

## 4 · Avaliação (até 25/11)

### Implementar critérios, jurados e período de avaliação
**Michelly**

**Objetivo:** Preparar tudo o que é necessário para a avaliação acontecer.

**Por quê:** Os jurados só podem avaliar depois que os critérios, os jurados e o período estiverem definidos.

**Pronto quando:**
- A organização define os critérios e seus pesos
- A organização define quem são os jurados
- A organização controla quando a avaliação está aberta

### Implementar o painel do jurado e as notas
**Miguel**

**Objetivo:** Permitir que os jurados avaliem as equipes.

**Por quê:** A avaliação é o que define o resultado do hackathon.

**Pronto quando:**
- O jurado vê quais equipes já avaliou e quais faltam
- O jurado dá notas por critério
- As regras de avaliação são respeitadas
- A tela segue o protótipo

## 5 · Ranking e organizador (até 25/11)

### Implementar o ranking final
**Michelly**

**Objetivo:** Calcular e divulgar a classificação final das equipes.

**Por quê:** É o resultado do hackathon e precisa ser justo e confiável.

**Pronto quando:**
- A classificação é calculada corretamente a partir das notas e dos pesos
- Casos especiais, como empates, estão resolvidos
- O resultado só fica público na hora certa

### Implementar o painel do organizador
**Miguel**

**Objetivo:** Dar à organização uma visão geral do evento e acesso rápido a tudo que ela gerencia.

**Por quê:** Quem organiza precisa acompanhar tudo de um lugar só.

**Pronto quando:**
- O organizador vê um resumo da situação do evento
- Dali ele chega a todas as áreas de gestão
- Ele consegue gerenciar os papéis dos usuários

## 6 · Qualidade e entrega (até 28/11)

### Revisar a segurança e a autorização
**Dupla**

**Objetivo:** Confirmar que o sistema protege os dados e as permissões.

**Por quê:** Uma falha de acesso compromete a confiança no resultado do hackathon.

**Pronto quando:**
- Todas as áreas restritas foram verificadas
- Nenhum dado sensível fica exposto

### Fazer a revisão visual
**Miguel**

**Objetivo:** Garantir que o sistema seja agradável e acessível em qualquer tela.

**Por quê:** Muita gente vai usar o sistema pelo celular durante o evento.

**Pronto quando:**
- As telas batem com o protótipo
- O site funciona bem no celular
- O site pode ser usado por pessoas com diferentes necessidades

### Configurar a automação e o deploy
**Miguel**

**Objetivo:** Verificar a qualidade do código automaticamente e publicar o site na internet.

**Por quê:** Evita que erros entrem sem ninguém perceber e permite apresentar o sistema funcionando online.

**Pronto quando:**
- A qualidade é verificada automaticamente a cada mudança
- O fluxo completo do evento é testado
- O site está acessível online

### Escrever a documentação
**Dupla**

**Objetivo:** Explicar o que é o sistema, como usar e como foi construído.

**Por quê:** É o que a professora e outras pessoas vão ler primeiro.

**Pronto quando:**
- Qualquer pessoa entende e consegue rodar o projeto só lendo a documentação
- As principais decisões técnicas estão justificadas

### Caçar bugs e ensaiar a apresentação
**Dupla**

**Objetivo:** Garantir que o sistema funcione na entrega e que a apresentação corra bem.

**Por quê:** É o momento em que o trabalho é avaliado.

**Pronto quando:**
- Os erros graves foram corrigidos
- A demonstração foi ensaiada
- Os dois sabem explicar o sistema

## Ideias pra depois

Ficam fora do quadro. Se sobrar tempo, criem a Issue na hora.

- Buscar e filtrar equipes
- Página "Meu perfil"
- Contagem regressiva para o fim do hackathon
- Avisos urgentes por e-mail
- Exportar os resultados em CSV
- Equipes verem as próprias notas depois do resultado
