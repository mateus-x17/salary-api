---
name: Tech Salary Intelligence API - Padrão de Comentários
description: Define como os comentários devem ser feitos no código do projeto, além de fornecer contexto arquitetural e de regras de negócio a serem seguidas.
---

# Tech Salary Intelligence API - Guia de Comentários

Sempre que você criar, modificar ou analisar o código deste projeto, siga as orientações descritas nesta skill, que consolidam os padrões estabelecidos nos arquivos `commenting-guide.md` e `project-context.md`.

## 1. Arquitetura e Contexto

O projeto utiliza **Node.js, TypeScript, Fastify, Prisma, PostgreSQL** e **Socket.IO**, em uma arquitetura **MVC com módulos baseados em funcionalidades** (`src/modules/*` e `src/shared/*`).
O fluxo padrão de requisição é: `Requisição HTTP -> Route -> Controller -> Service -> Repository -> Banco`.

### Regras de Negócio Críticas (Não violar e justificar em comentários)
*   **RN-08:** O histórico salarial (`salary_history`) é imutável. Nunca atualize ou delete; crie novos registros.
*   **RN-09:** O salário atual de um usuário é o registro mais recente inserido no histórico de salários.
*   **RN-13:** O salário de um usuário com diversas stacks conta para a média de **todas** as suas stacks.
*   **RN-16:** No ranking, exibem-se apenas stacks com, no mínimo, 5 registros salariais.
*   **RN-02:** Um usuário (`USER`) acessa/modifica estritamente seus próprios dados.
*   **RN-04:** Cada usuário possui exatamente 1 perfil profissional.

---

## 2. Padrões de Comentário por Tipo de Arquivo

O código deve contar a história do negócio. Utilize português do Brasil para todos os comentários do código, detalhando o comportamento a seguir:

### Controller
Deve explicar **o que entra, o que é acionado e o que sai**.
*   **JSDoc na Classe:** Utilize `@file` e `@description` para indicar qual módulo está sendo tratado.
*   **Dentro de funções:** Comente o que está sendo extraído da requisição (`request.user`, `request.body`), qual `Service` é chamado delegando a lógica, e por que a resposta é montada de certa forma (ex: status Http).

### Service
Guarda as regras de negócio. Explique **o porquê das coisas**, não só o quê.
*   **Documente cada bloco:** Separe por blocos lógicos como `Validação de Negócio`, `Persistência`, `Atualização de Métricas` e `Eventos em tempo real`.
*   **Justifique restrições:** Se lançar erro, explique qual regra forçou aquilo (ex: "Não faz sentido registrar sem perfil").
*   Mencione explicitamente atualizações de Materialized Views ou disparos via Websocket.

### Repository
Sua finalidade é o banco de dados.
*   Explique **o que a query faz e retorna**, principalmente em consultas SQL brutas.
*   Explique métodos focados do Prisma, como o porquê de usar `orderBy: { createdAt: 'desc' }` com `take: 1` para simular uma extração de salário atual (RN-09).

### DTO (Data Transfer Object)
Define o contrato dos dados da API.
*   Comente restrições diretamente nos atributos da classe (tais como tipo esperado, se deve ser positivo, se precisa existir em tabela X).
*   Documente os métodos de `.validate()`, ressaltando em que momento e qual exceção é gerada se um dado obrigatório falhar.

### Middleware
Interceptadores de rotas (ex: autenticação).
*   Descreva passo a passo o que ocorre: verificação do cabeçalho de `Authorization`, desmembramento do Token de tipo "Bearer", a verificação pelo segredo em `JWT_SECRET`, e a injeção dos dados em `request.user` se obtiver sucesso.

### Routes
Os arquivos de registro no Fastify.
*   Comente o arquivo inteiro com prefixo base da rota.
*   Liste sobre cada uma (`app.get(...)`, `app.post(...)`): O método de requisição HTTP + caminho da URL, se exige o AuthMiddleware e em poucas palavras a sua função no negócio.

---

## 3. Formato Padrão de Resposta

O projeto adota o seguinte padrao que também deve ser documentado ou seguido no código do controller ou validadores:

```typescript
// Sucesso
{ success: true, data: { ... }, error: null }

// Falha
{ success: false, data: null, error: { code: 'CODIGO', message: 'Legível' } }
```
