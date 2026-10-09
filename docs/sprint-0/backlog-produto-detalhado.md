# Backlog do Produto Detalhado

**Projeto:** Sistema de Apoio ao 1º Hackathon do Curso

**Disciplina:** Engenharia de Software I - Profa. Lauriana Paludo - IFPR Campus Pinhais

**Equipe:** Miguel Gerhardt Soares e Silva e Michelly Morena de Castro Loyola

**Etapa:** Sprint 0

---

## Requisitos Não-Funcionais

| Código | Requisito |
|---|---|
| RNF01 | O sistema tem que funcionar bem no celular, já que no dia do evento a maioria vai acessar por ele. |
| RNF02 | Inscrever a equipe, submeter o projeto e lançar nota devem ser feitos em uma tela só, sem precisar de explicação. |
| RNF03 | Participante, jurado e comissão só acessam o que é do seu perfil. |
| RNF04 | A agenda e o ranking devem abrir em até 3 segundos, mesmo com uns 200 acessos ao mesmo tempo. |
| RNF05 | Coletar só os dados pessoais que o evento realmente precisa, respeitando a LGPD. |

---

## Épico 1: Cadastro e inscrição de equipes

### RF01 - Inscrever equipe - **Must**

```
Como participante, quero inscrever minha equipe com o nome e os integrantes, para que possamos participar do Hackathon.
```

**Critérios de aceite:**
- *Dado* que o participante está logado e as inscrições estão abertas, *quando* ele preenche o nome da equipe e os integrantes e confirma, *então* a equipe fica salva como "Aguardando aprovação".
- *Dado* que o nome escolhido já foi usado por outra equipe, *quando* ele tenta inscrever, *então* o sistema não deixa e pede outro nome.
- *Dado* que algum dos integrantes já está em outra equipe, *quando* ele confirma, *então* a inscrição é barrada e o sistema mostra quem está repetido.

### RF02 - Aprovar inscrições - **Must**

```
Como membro da comissão, quero aprovar ou recusar as inscrições, para que só participem equipes que cumprem as regras do evento.
```

**Critérios de aceite:**
- *Dado* que há inscrições aguardando aprovação, *quando* a comissão aprova uma, *então* a equipe passa para "Aprovada" e já pode submeter projeto.
- *Dado* que a comissão vai recusar uma inscrição, *quando* confirma a recusa, *então* precisa escrever o motivo, que aparece para a equipe.

---

## Épico 2: Agenda do evento e comunicação de mudanças

### RF03 - Consultar agenda - **Must**

```
Como participante ou visitante, quero ver a agenda com horários e salas, para saber onde e quando acontece cada atividade.
```

**Critérios de aceite:**
- *Dado* que a comissão já cadastrou as atividades, *quando* alguém abre a agenda, mesmo sem login, *então* aparecem as atividades em ordem de horário, com a sala de cada uma.

### RF04 - Gerenciar agenda - **Must**

```
Como membro da comissão, quero cadastrar, editar e remover atividades da agenda, para que a programação publicada não fique desatualizada.
```

**Critérios de aceite:**
- *Dado* que o membro da comissão está logado, *quando* ele cadastra uma atividade com título, data, horário e sala, *então* ela já aparece na agenda pública.

### RF05 - Receber avisos por e-mail - **Could**

```
Como participante, quero receber os avisos da comissão por e-mail, para não perder nenhuma mudança de horário ou sala.
```

**Critérios de aceite:**
- *Dado* que o participante está em uma equipe aprovada, *quando* a comissão publica um aviso, *então* ele recebe o aviso no e-mail cadastrado.

---

## Épico 3: Submissão de projetos das equipes

### RF06 - Submeter projeto - **Must**

```
Como participante, quero enviar o link do repositório do projeto da minha equipe, para que os jurados possam avaliar.
```

**Critérios de aceite:**
- *Dado* que a equipe está aprovada e ainda está no prazo, *quando* o participante envia um link válido, *então* a submissão fica registrada com data e hora e todos da equipe conseguem ver.
- *Dado* que o prazo já acabou, *quando* alguém tenta submeter, *então* o envio é bloqueado.

### RF07 - Acompanhar submissões - **Should**

```
Como membro da comissão, quero ver quem já submeteu e quem ainda não, para cobrar as equipes atrasadas antes do fim do prazo.
```

**Critérios de aceite:**
- *Dado* que existem equipes aprovadas, *quando* a comissão abre a lista de submissões, *então* cada equipe aparece como "Submetido" (com data e hora) ou "Pendente".

---

## Épico 4: Avaliação dos jurados

### RF08 - Cadastrar critérios de avaliação - **Must**

```
Como membro da comissão, quero cadastrar os critérios de avaliação e o peso de cada um, para que todos os jurados avaliem do mesmo jeito.
```

**Critérios de aceite:**
- *Dado* que a avaliação ainda não começou, *quando* a comissão cadastra um critério com nome, descrição e peso, *então* ele passa a aparecer no formulário dos jurados.

### RF09 - Lançar notas - **Must**

```
Como jurado, quero dar uma nota para cada critério das equipes que vou avaliar, para que a avaliação fique padronizada.
```

**Critérios de aceite:**
- *Dado* que o jurado está logado e a avaliação está aberta, *quando* ele preenche todos os critérios de uma equipe e salva, *então* as notas são registradas e a equipe aparece como "Avaliada" na lista dele.
- *Dado* que faltou nota em algum critério, *quando* ele tenta salvar, *então* o sistema não deixa e marca o que está faltando.

### RF10 - Ver equipes atribuídas - **Should**

```
Como jurado, quero ver a lista das equipes que devo avaliar, com o link de cada projeto, para saber o que ainda falta.
```

**Critérios de aceite:**
- *Dado* que a comissão atribuiu equipes ao jurado, *quando* ele entra no painel, *então* vê só as suas equipes, com o link do projeto e se já avaliou ou não.

### RF11 - Registrar feedback textual - **Could**

```
Como jurado, quero deixar um comentário para cada equipe, para que eles saibam o que foi bom e o que pode melhorar no projeto.
```

**Critérios de aceite:**
- *Dado* que o jurado está avaliando uma equipe, *quando* escreve um comentário e salva, *então* o comentário fica guardado e só aparece para a equipe depois que o resultado sair.

---

## Épico 5: Apuração e cálculo de resultados

### RF12 - Calcular nota final automaticamente - **Must**

```
Como membro da comissão, quero que o sistema calcule a nota final de cada equipe sozinho, para não ter que fazer a conta na mão e correr o risco de errar.
```

**Critérios de aceite:**
- *Dado* que todos os jurados de uma equipe já lançaram as notas, *quando* a comissão abre a apuração, *então* aparece a nota final, que é a média das notas dos jurados (cada uma já ponderada pelos pesos dos critérios).

### RF13 - Encerrar avaliação e publicar resultado - **Must**

```
Como membro da comissão, quero encerrar a avaliação e publicar o resultado, para que ele só seja divulgado depois de conferido.
```

**Critérios de aceite:**
- *Dado* que todas as equipes já têm nota final, *quando* a comissão clica em "Publicar resultado", *então* as notas não podem mais ser alteradas e o ranking fica visível para todos.

---

## Épico 6: Painel público de resultados

### RF14 - Ver ranking público - **Must**

```
Como visitante, quero ver o ranking final das equipes, para acompanhar o resultado do Hackathon.
```

**Critérios de aceite:**
- *Dado* que o resultado foi publicado, *quando* alguém abre a página de resultados, *então* as equipes aparecem da maior para a menor nota.

### RF15 - Ver notas e feedback da própria equipe - **Should**

```
Como participante, quero ver as notas por critério e os comentários que minha equipe recebeu, para entender como fomos avaliados.
```

**Critérios de aceite:**
- *Dado* que o resultado saiu, *quando* o participante abre a página da equipe, *então* vê as notas por critério e os comentários, sem saber qual jurado deu cada nota.

---

## Épico 7: Painel administrativo da comissão

### RF16 - Visão geral do evento - **Should**

```
Como membro da comissão, quero um painel com o número de equipes inscritas, submissões e avaliações pendentes, para acompanhar tudo em um lugar só.
```

**Critérios de aceite:**
- *Dado* que o membro da comissão está logado, *quando* abre o painel, *então* vê os números atualizados de inscrições, submissões e avaliações que cada jurado ainda deve.

### RF17 - Cadastrar jurados - **Must**

```
Como membro da comissão, quero cadastrar os jurados e definir quais equipes cada um avalia, para que cada jurado veja só as suas avaliações.
```

**Critérios de aceite:**
- *Dado* que o membro da comissão está logado, *quando* cadastra um jurado com nome e e-mail, *então* a conta do jurado é criada e ele recebe as instruções de acesso por e-mail.
- *Dado* que o jurado já foi cadastrado, *quando* a comissão atribui equipes a ele, *então* essas equipes aparecem no painel do jurado.

---

## Épico 8: Autenticação e controle de acesso

### RF18 - Criar conta e fazer login - **Must**

```
Como participante, quero criar uma conta e entrar com e-mail e senha, para acessar as funções da minha equipe.
```

**Critérios de aceite:**
- *Dado* que a pessoa ainda não tem conta, *quando* se cadastra com nome, e-mail e senha, *então* a conta é criada e ela já entra logada.
- *Dado* que o e-mail ou a senha estão errados, *quando* tenta entrar, *então* o acesso é negado com uma mensagem que não diz qual dos dois está errado.

### RF19 - Recuperar senha - **Could**

```
Como usuário cadastrado, quero recuperar minha senha pelo e-mail, para não ficar sem acesso no dia do evento.
```

**Critérios de aceite:**
- *Dado* que o usuário esqueceu a senha, *quando* informa o e-mail na tela de recuperação, *então* recebe um link para criar uma senha nova, que vale por tempo limitado.
