# Tech Salary Intelligence API — Software Design Specification

> Documento gerado a partir do processo de Software Design Guiado.
> Contém todas as especificações necessárias para implementação da API.

---

## Sumário

1. [Visão do Sistema](#1-visão-do-sistema)
2. [Requisitos Funcionais](#2-requisitos-funcionais)
3. [Requisitos Não Funcionais](#3-requisitos-não-funcionais)
4. [Regras de Negócio](#4-regras-de-negócio)
5. [Modelagem do Domínio](#5-modelagem-do-domínio)
6. [Fluxos do Usuário](#6-fluxos-do-usuário)
7. [Arquitetura de Software](#7-arquitetura-de-software)
8. [Contrato da API](#8-contrato-da-api)
9. [Modelagem Física do Banco de Dados](#9-modelagem-física-do-banco-de-dados)
10. [Estrutura do Projeto](#10-estrutura-do-projeto)

---

## 1. Visão do Sistema

### 1.1 Propósito

A **Tech Salary Intelligence API** é um sistema backend que coleta, armazena e analisa dados salariais de profissionais de tecnologia.

**Objetivos:**
- Registro estruturado de profissionais de tecnologia
- Armazenamento histórico de salários
- Análise estatística de remuneração
- Consulta analítica por stack, cidade e experiência
- Atualização em tempo real das métricas salariais

**Contexto de uso:** educacional e portfólio, demonstrando implementação de APIs REST robustas, modelagem de dados analíticos, arquitetura escalável e comunicação em tempo real.

### 1.2 Tipo de Sistema

**API Backend Analítica** com:
- CRUD de dados estruturados
- Processamento analítico e agregações estatísticas
- Comunicação WebSocket
- Autenticação com JWT

**Não inclui:** interface gráfica, dashboards visuais ou frontend.

### 1.3 Atores do Sistema

| Ator | Descrição |
|------|-----------|
| **Administrador** | Usuário com permissões elevadas. Gerencia dados do sistema, visualiza analytics completos, lista usuários. Criado via seed inicial. |
| **Usuário Registrado (Profissional)** | Profissional de tecnologia que cria conta e registra seus próprios dados salariais. Não pode editar dados de outros usuários. |
| **Aplicações Consumidoras** | Sistemas externos que consomem a API via REST ou WebSocket (futuro). |

### 1.4 Escopo

**O sistema inclui:**
- Gestão de usuários: cadastro, autenticação, atualização de perfil
- Gestão de dados profissionais: stack(s), cidade, salário, histórico salarial
- Analytics: médias global, por stack, por cidade, combinadas, ranking
- Eventos em tempo real via WebSocket ao atualizar salário

**O sistema NÃO inclui:**
- Coleta automática de dados da internet / scraping
- Dashboards visuais
- Autenticação social
- Sistema de permissões complexas

### 1.5 Volume de Dados

- Até **100.000 usuários registrados**
- Estimativa de **~500k registros salariais** (100k usuários × 5 atualizações médias)
- Leitura analítica frequente, escrita moderada, agregações SQL intensivas
- Arquitetura deve permitir evolução futura para maior escala

---

## 2. Requisitos Funcionais

### Autenticação e Usuários

| ID | Descrição |
|----|-----------|
| **RF-01** | O sistema deve permitir cadastro de novos usuários com: nome, email, senha |
| **RF-02** | O sistema deve permitir login via email e senha, retornando token JWT |
| **RF-03** | Usuários autenticados podem visualizar e atualizar seus próprios dados de perfil |
| **RF-04** | O sistema deve ter dois tipos de usuário: `ADMIN` e `USER`. ADMIN tem acesso total; USER acessa apenas seus próprios dados |

### Gestão de Dados Profissionais

| ID | Descrição |
|----|-----------|
| **RF-05** | Usuários autenticados podem registrar: stack(s) utilizada(s), cidade, salário atual, faixa de experiência |
| **RF-06** | Usuários podem atualizar: stack, cidade, experiência, salário. Atualização de salário não sobrescreve dados antigos |
| **RF-07** | Toda atualização de salário cria um novo registro no histórico salarial |
| **RF-19** | Um usuário pode ter várias stacks tecnológicas associadas ao perfil (relação many-to-many com lista controlada) |

### Gestão Administrativa

| ID | Descrição |
|----|-----------|
| **RF-08** | Administradores podem listar usuários cadastrados |
| **RF-09** | Administradores podem acessar dados agregados e analytics completos |

### Analytics Salariais

| ID | Descrição |
|----|-----------|
| **RF-10** | O sistema calcula a média salarial global considerando o salário mais recente de cada usuário |
| **RF-11** | O sistema calcula média salarial agrupada por stack tecnológica |
| **RF-12** | O sistema calcula média salarial agrupada por cidade |
| **RF-13** | O sistema permite filtros combinados: stack + cidade, stack + experiência, cidade + experiência, stack + cidade + experiência |
| **RF-14** | O sistema gera ranking de stacks por média salarial |
| **RF-15** | O sistema lista profissionais com salário acima da média global |

### Tempo Real

| ID | Descrição |
|----|-----------|
| **RF-16** | Sempre que um salário for atualizado, o sistema emite evento WebSocket `salary:update` com: média global, médias por stack, médias por cidade |

### Dados Padronizados

| ID | Descrição |
|----|-----------|
| **RF-17** | Stacks selecionadas a partir de tabela controlada administrada pelo sistema |
| **RF-18** | Cidades selecionadas a partir de tabela controlada |

---

## 3. Requisitos Não Funcionais

| ID | Categoria | Descrição |
|----|-----------|-----------|
| **RNF-01** | Performance | Consultas analíticas devem responder em menos de 500ms para bases de até 100k usuários |
| **RNF-02** | Escalabilidade | Arquitetura deve permitir crescimento futuro sem refatoração estrutural significativa |
| **RNF-03** | Segurança | Autenticação baseada em JWT |
| **RNF-04** | Segurança | Senhas armazenadas com hash seguro (bcrypt) |
| **RNF-05** | Integridade | Consistência garantida entre: usuário, stack, histórico salarial |
| **RNF-06** | Observabilidade | Logging estruturado com **Pino** |
| **RNF-07** | Documentação | Documentação automática da API com **Swagger** |
| **RNF-08** | Banco de Dados | Persistência em **PostgreSQL** via **Prisma ORM** |
| **RNF-09** | Arquitetura | API construída em **Fastify** com **TypeScript** |

---

## 4. Regras de Negócio

### 4.1 Usuários

| ID | Regra |
|----|-------|
| **RN-01** | Email único por usuário. Não é permitido registrar dois usuários com o mesmo email |
| **RN-02** | Usuário `USER` pode: visualizar/atualizar seus dados, registrar salário. Não pode alterar dados de outros usuários, acessar listagens administrativas ou alterar listas controladas |
| **RN-03** | Usuário `ADMIN` pode: visualizar dados globais, consultar analytics completos, listar usuários |

### 4.2 Perfil Profissional

| ID | Regra |
|----|-------|
| **RN-04** | Cada usuário possui exatamente um perfil profissional ativo (cidade, faixa de experiência, stacks) |
| **RN-05** | Um usuário pode ter várias stacks. Stacks devem existir na lista controlada; não é permitido inserir stacks livres |
| **RN-06** | Quando stacks são atualizadas, a associação antiga é removida e a nova lista passa a compor os analytics |

### 4.3 Salário

| ID | Regra |
|----|-------|
| **RN-07** | O sistema armazena **salário mensal bruto**. Todos os cálculos analíticos usam esse valor |
| **RN-08** | A cada atualização de salário, um novo registro de histórico é criado. O histórico nunca pode ser sobrescrito ou deletado |
| **RN-09** | O salário atual de um usuário é sempre o registro mais recente do histórico salarial |
| **RN-10** | Ao criar o perfil profissional, um registro inicial de salário é criado automaticamente no histórico |

### 4.4 Faixas de Experiência

| Enum | Descrição |
|------|-----------|
| `JUNIOR` | 0–2 anos |
| `PLENO` | 3–5 anos |
| `SENIOR` | 6–10 anos |
| `STAFF_PLUS` | 10+ anos |

### 4.5 Analytics

| ID | Regra |
|----|-------|
| **RN-11** | Média global: considera apenas o salário atual (mais recente) de cada usuário com salário registrado |
| **RN-12** | Média por stack: considera usuários que possuem aquela stack, usando salário atual |
| **RN-13** | Usuário com múltiplas stacks: seu salário atual participa da média de **cada** stack associada |
| **RN-14** | Média por cidade: considera salário atual dos usuários que trabalham naquela cidade |
| **RN-15** | Filtros combinados permitidos: stack+cidade, stack+experiência, cidade+experiência, stack+cidade+experiência |
| **RN-16** | Ranking de stacks: ordenado por maior média. Stacks precisam de **mínimo 5 registros** para aparecer no ranking |
| **RN-17** | Profissional acima da média: `salário atual > média global` |

### 4.6 Eventos em Tempo Real

| ID | Regra |
|----|-------|
| **RN-18** | Sempre que houver cadastro ou atualização de salário, o sistema recalcula as métricas principais |
| **RN-19** | Após recalcular, emite evento WebSocket `salary:update` com: média global, médias por stack, médias por cidade |

### 4.7 Integridade

| ID | Regra |
|----|-------|
| **RN-20** | Não é permitido: histórico salarial sem usuário, associação de stack inexistente, perfil profissional sem usuário |

---

## 5. Modelagem do Domínio

### 5.1 Entidades

```
User
ProfessionalProfile
Stack
City
SalaryHistory
UserStack (tabela de associação)
```

### 5.2 Relacionamentos

```
User
 └── 1:1  → ProfessionalProfile
              ├── N:1 → City
              ├── 1:N → SalaryHistory
              └── N:N → Stack  (via UserStack)
```

### 5.3 Descrição das Entidades

#### User
Representa um usuário autenticado do sistema (admin ou profissional contribuinte).

| Atributo | Tipo |
|----------|------|
| id | UUID |
| name | string |
| email | string (único) |
| passwordHash | string |
| role | `ADMIN` \| `USER` |
| createdAt | timestamp |

#### ProfessionalProfile
Perfil profissional do usuário, separado de dados de autenticação.

| Atributo | Tipo |
|----------|------|
| id | UUID |
| userId | UUID (FK → User) |
| cityId | UUID (FK → City) |
| experienceLevel | enum |
| createdAt | timestamp |

#### Stack
Tecnologia existente na lista controlada.

| Atributo | Tipo |
|----------|------|
| id | UUID |
| name | string (único) |
| createdAt | timestamp |

#### City
Cidade da empresa onde o profissional trabalha.

| Atributo | Tipo |
|----------|------|
| id | UUID |
| name | string |
| state | string |
| country | string |
| createdAt | timestamp |

#### SalaryHistory
Histórico imutável de salários do profissional.

| Atributo | Tipo |
|----------|------|
| id | UUID |
| profileId | UUID (FK → ProfessionalProfile) |
| salary | integer (mensal bruto) |
| createdAt | timestamp |

#### UserStack (associação)

| Atributo | Tipo |
|----------|------|
| profileId | UUID (FK → ProfessionalProfile) |
| stackId | UUID (FK → Stack) |

### 5.4 Agregados

**Agregado User:**
```
User
 └─ ProfessionalProfile
      ├─ SalaryHistory
      └─ UserStack → Stack
```

Todas as alterações de salário e stacks passam obrigatoriamente pelo perfil do usuário.

**Entidades administrativas** (controladas pelo sistema, não alteráveis por USER):
- `Stack`
- `City`

---

## 6. Fluxos do Usuário

### 6.1 Cadastro de Usuário
```
1. Usuário envia: name, email, password
2. Sistema valida email único
3. Sistema aplica hash na senha
4. Sistema cria registro User com role: USER
5. Sistema retorna confirmação
```

### 6.2 Login
```
1. Usuário envia: email, password
2. Sistema busca usuário pelo email
3. Sistema valida senha
4. Sistema gera token JWT
5. Sistema retorna token
```

### 6.3 Criação do Perfil Profissional
```
1. Usuário envia: cityId, experienceLevel, salary
2. Sistema cria ProfessionalProfile
3. Sistema cria SalaryHistory inicial com o valor de salary informado
```

### 6.4 Adicionar Stack ao Perfil
```
1. Usuário seleciona stackId existente
2. Sistema valida existência da stack
3. Sistema cria relação em profile_stacks
4. Stack passa a compor os analytics do usuário
```

### 6.5 Remover Stack
```
1. Usuário solicita remoção de stackId
2. Sistema remove associação em profile_stacks
3. Stack deixa de influenciar os analytics do usuário
```

### 6.6 Atualizar Salário
```
1. Usuário envia novo salary
2. Sistema valida valor
3. Sistema cria novo SalaryHistory
4. Sistema recalcula métricas (materialized views)
5. Sistema emite evento WebSocket: salary:update
```

### 6.7 Consulta de Analytics (Admin)
```
1. Admin solicita analytics com filtros opcionais (stackId, cityId, experienceLevel)
2. Sistema consulta materialized views
3. Sistema retorna métricas calculadas
```

### 6.8 Evento em Tempo Real
```
1. Sistema detecta novo SalaryHistory inserido
2. Sistema recalcula médias principais
3. Sistema publica evento WebSocket: salary:update
4. Clientes conectados recebem atualização
```

---

## 7. Arquitetura de Software

### 7.1 Estilo Arquitetural

**MVC adaptado + Camadas**, organizado por **feature-based modules**.

| Camada | Responsabilidade |
|--------|-----------------|
| **Routes** | Definição das rotas HTTP, plugins Fastify |
| **Controller** | Recebe requisição, valida DTOs, chama Service, retorna resposta. Não contém lógica de negócio |
| **Service** | Lógica de negócio, regras de domínio, orquestração de operações |
| **Repository** | Acesso ao banco via Prisma, queries, sem lógica de negócio |
| **Database/Infra** | Conexão com PostgreSQL, configuração do Prisma |

### 7.2 Fluxo de Execução

```
Request HTTP
    ↓
Route
    ↓
Controller
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

**Após persistência de salário:**
```
Service
  ↓
Refresh Materialized Views
  ↓
Emite evento WebSocket (salary:update)
```

### 7.3 Módulos

```
modules/
 ├── auth
 ├── users
 ├── profiles
 ├── stacks
 ├── cities
 ├── salaries
 └── analytics
```

### 7.4 Estrutura Interna de Módulo

Cada módulo segue a estrutura:
```
<module>/
 ├── controllers/
 ├── services/
 ├── repositories/
 ├── dtos/
 └── routes/
```

### 7.5 Camadas Compartilhadas (shared)

```
shared/
 ├── database/        → conexão Prisma
 ├── errors/          → AppError, classes de erro
 ├── http/            → response helper, status codes
 ├── middlewares/     → auth.middleware, error.middleware
 └── utils/
```

### 7.6 Middlewares Globais

| Middleware | Função |
|-----------|--------|
| **Auth JWT** | Valida token em rotas protegidas |
| **Logger (Pino)** | Logging estruturado de todas as requisições |
| **Error Handler** | Padroniza erros, evita vazamento de stack trace |

### 7.7 Comunicação entre Módulos

Módulos **não** acessam diretamente o banco de outros módulos.
Comunicação ocorre sempre via **Services**.

```
SalaryService → AnalyticsService → StackRepository
```

### 7.8 WebSocket

Tecnologia: **Socket.IO**

```
src/websocket/socket.ts
```

Evento emitido: `salary:update`

---

## 8. Contrato da API

### 8.1 Padrões Globais

- **Prefixo de versão:** `/v1/`
- **Content-Type:** `application/json`
- **Autenticação:** Bearer Token (JWT) no header `Authorization`

### 8.2 Estrutura Padrão de Resposta

**Sucesso:**
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

**Erro:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

### 8.3 Códigos HTTP

| Código | Uso |
|--------|-----|
| `200` | Sucesso |
| `201` | Recurso criado |
| `400` | Erro de validação |
| `401` | Não autenticado |
| `403` | Acesso proibido |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: email duplicado) |
| `500` | Erro interno |

---

### 8.4 Módulo Auth

#### POST /v1/auth/register
Cadastra novo usuário.

**Request:**
```json
{
  "name": "Mateus",
  "email": "mateus@email.com",
  "password": "123456"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "mateus@email.com",
    "role": "USER"
  },
  "error": null
}
```

**Erros possíveis:** `409` email já cadastrado, `400` dados inválidos

---

#### POST /v1/auth/login
Autentica usuário e retorna JWT.

**Request:**
```json
{
  "email": "mateus@email.com",
  "password": "123456"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token"
  },
  "error": null
}
```

**Erros possíveis:** `401` credenciais inválidas

---

### 8.5 Módulo Profile

> Todos os endpoints requerem autenticação (Bearer Token).

#### POST /v1/profile
Cria perfil profissional do usuário autenticado. Também cria o primeiro registro de SalaryHistory.

**Request:**
```json
{
  "cityId": "uuid",
  "experienceLevel": "PLENO",
  "salary": 8000
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "city": "Belo Horizonte",
    "experienceLevel": "PLENO",
    "stacks": [],
    "currentSalary": 8000
  },
  "error": null
}
```

**Erros possíveis:** `409` perfil já existe, `404` cidade não encontrada

---

#### GET /v1/profile
Retorna perfil do usuário autenticado.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "city": "Belo Horizonte",
    "experienceLevel": "PLENO",
    "stacks": ["Node.js", "TypeScript"],
    "currentSalary": 8000
  },
  "error": null
}
```

---

#### PATCH /v1/profile
Atualiza cidade e/ou experiência. **Salário não é atualizado aqui.**

**Request (todos os campos opcionais):**
```json
{
  "cityId": "uuid",
  "experienceLevel": "SENIOR"
}
```

**Response `200`:** perfil atualizado

---

### 8.6 Módulo Profile — Stacks

> Requerem autenticação.

#### POST /v1/profile/stacks
Adiciona uma stack ao perfil.

**Request:**
```json
{
  "stackId": "uuid"
}
```

**Response `201`:** stack adicionada

**Erros possíveis:** `404` stack não existe, `409` stack já associada

---

#### DELETE /v1/profile/stacks/:stackId
Remove uma stack do perfil.

**Response `200`:** stack removida

---

#### GET /v1/profile/stacks
Lista as stacks do perfil do usuário autenticado.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Node.js" },
    { "id": "uuid", "name": "TypeScript" }
  ],
  "error": null
}
```

---

### 8.7 Módulo Salary

> Requerem autenticação.

#### POST /v1/profile/salary
Registra novo salário. Cria SalaryHistory e dispara evento WebSocket.

**Request:**
```json
{
  "salary": 9500
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "salary": 9500,
    "createdAt": "2026-03-12T15:00:00"
  },
  "error": null
}
```

**Efeitos colaterais:**
- Cria novo registro em `salary_history`
- Atualiza materialized views de analytics
- Emite evento WebSocket `salary:update`

---

#### GET /v1/profile/salary/history
Retorna histórico salarial do usuário autenticado.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "salary": 7000, "createdAt": "2024-01-10" },
    { "salary": 8000, "createdAt": "2024-06-02" },
    { "salary": 9500, "createdAt": "2025-01-01" }
  ],
  "error": null
}
```

---

### 8.8 Módulo Analytics

> Requerem autenticação. Endpoints principais acessíveis por qualquer usuário autenticado; listagens globais restritas a ADMIN.

#### GET /v1/analytics/salary/global
Média salarial global.

**Response `200`:**
```json
{
  "success": true,
  "data": { "averageSalary": 8500 },
  "error": null
}
```

---

#### GET /v1/analytics/salary/stack
Média salarial por stack.

**Query params:** `?stackId=uuid`

**Response `200`:**
```json
{
  "success": true,
  "data": { "stack": "Node.js", "averageSalary": 9500, "totalRecords": 120 },
  "error": null
}
```

---

#### GET /v1/analytics/salary/city
Média salarial por cidade.

**Query params:** `?cityId=uuid`

---

#### GET /v1/analytics/salary/filter
Média salarial com filtros combinados.

**Query params (todos opcionais):**
```
stackId=uuid
cityId=uuid
experienceLevel=SENIOR
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "averageSalary": 11000, "totalRecords": 34 },
  "error": null
}
```

---

#### GET /v1/analytics/ranking/stacks
Ranking de stacks por média salarial. Apenas stacks com ≥ 5 registros aparecem.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "stack": "Go", "averageSalary": 12000, "totalRecords": 45 },
    { "stack": "Node.js", "averageSalary": 9500, "totalRecords": 234 }
  ],
  "error": null
}
```

---

### 8.9 Módulo Admin

> Requerem autenticação com role ADMIN.

#### GET /v1/admin/users
Lista todos os usuários cadastrados.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Mateus", "email": "mateus@email.com", "role": "USER", "createdAt": "..." }
  ],
  "error": null
}
```

---

### 8.10 Módulo Stacks (Recursos Controlados)

#### GET /v1/stacks
Lista todas as stacks disponíveis.

#### POST /v1/stacks
Cria nova stack. **Requer ADMIN.**

**Request:**
```json
{ "name": "Rust" }
```

---

### 8.11 Módulo Cities (Recursos Controlados)

#### GET /v1/cities
Lista todas as cidades disponíveis.

#### POST /v1/cities
Cria nova cidade. **Requer ADMIN.**

**Request:**
```json
{
  "name": "Belo Horizonte",
  "state": "MG",
  "country": "Brasil"
}
```

---

### 8.12 WebSocket

**Tecnologia:** Socket.IO

**Evento:** `salary:update`

**Payload:**
```json
{
  "globalAverage": 8500,
  "updatedAt": "2026-03-12T15:00:00"
}
```

**Quando é emitido:** a cada novo registro em `salary_history`

---

## 9. Modelagem Física do Banco de Dados

**Banco:** PostgreSQL
**ORM:** Prisma
**IDs:** UUID em todas as tabelas

### 9.1 Tabela `users`

```sql
users
-----
id           UUID        PRIMARY KEY
name         TEXT        NOT NULL
email        TEXT        NOT NULL UNIQUE
password_hash TEXT       NOT NULL
role         TEXT        NOT NULL DEFAULT 'USER'  -- 'ADMIN' | 'USER'
created_at   TIMESTAMP   NOT NULL DEFAULT NOW()

INDEX: UNIQUE(email)
```

### 9.2 Tabela `cities`

```sql
cities
------
id         UUID       PRIMARY KEY
name       TEXT       NOT NULL
state      TEXT       NOT NULL
country    TEXT       NOT NULL
created_at TIMESTAMP  NOT NULL DEFAULT NOW()

INDEX: INDEX(name)
```

### 9.3 Tabela `stacks`

```sql
stacks
------
id         UUID       PRIMARY KEY
name       TEXT       NOT NULL UNIQUE
created_at TIMESTAMP  NOT NULL DEFAULT NOW()
```

### 9.4 Tabela `professional_profiles`

```sql
professional_profiles
---------------------
id               UUID       PRIMARY KEY
user_id          UUID       NOT NULL UNIQUE    -- FK → users.id
city_id          UUID       NOT NULL           -- FK → cities.id
experience_level TEXT       NOT NULL           -- 'JUNIOR' | 'PLENO' | 'SENIOR' | 'STAFF_PLUS'
created_at       TIMESTAMP  NOT NULL DEFAULT NOW()

FOREIGN KEY (user_id)  REFERENCES users(id)
FOREIGN KEY (city_id)  REFERENCES cities(id)
```

### 9.5 Tabela `profile_stacks`

```sql
profile_stacks
--------------
profile_id UUID NOT NULL    -- FK → professional_profiles.id
stack_id   UUID NOT NULL    -- FK → stacks.id

PRIMARY KEY (profile_id, stack_id)

FOREIGN KEY (profile_id) REFERENCES professional_profiles(id)
FOREIGN KEY (stack_id)   REFERENCES stacks(id)

INDEX: INDEX(profile_id)
INDEX: INDEX(stack_id)
```

### 9.6 Tabela `salary_history`

```sql
salary_history
--------------
id         UUID       PRIMARY KEY
profile_id UUID       NOT NULL    -- FK → professional_profiles.id
salary     INTEGER    NOT NULL    -- salário mensal bruto em R$
created_at TIMESTAMP  NOT NULL DEFAULT NOW()

FOREIGN KEY (profile_id) REFERENCES professional_profiles(id)

INDEX: INDEX(profile_id)
INDEX: INDEX(created_at)
```

### 9.7 Materialized View — Média Global

```sql
mv_salary_global
----------------
average_salary  NUMERIC
updated_at      TIMESTAMP
```

### 9.8 Materialized View — Média por Stack

```sql
mv_salary_by_stack
------------------
stack_id       UUID
average_salary NUMERIC
total_records  INTEGER
updated_at     TIMESTAMP
```

### 9.9 Materialized View — Média por Cidade

```sql
mv_salary_by_city
-----------------
city_id        UUID
average_salary NUMERIC
total_records  INTEGER
updated_at     TIMESTAMP
```

### 9.10 Materialized View — Média Combinada (Filtros)

```sql
mv_salary_filtered
------------------
stack_id         UUID
city_id          UUID
experience_level TEXT
average_salary   NUMERIC
total_records    INTEGER
```

### 9.11 Estratégia de Atualização das Views

```
INSERT salary_history
         ↓
   job / trigger
         ↓
REFRESH MATERIALIZED VIEW mv_salary_global
REFRESH MATERIALIZED VIEW mv_salary_by_stack
REFRESH MATERIALIZED VIEW mv_salary_by_city
REFRESH MATERIALIZED VIEW mv_salary_filtered
         ↓
   Emitir salary:update via Socket.IO
```

### 9.12 Diagrama de Relacionamentos

```
users
  │ 1:1
  └── professional_profiles
         │ N:1
         ├── cities
         │ 1:N
         ├── salary_history
         │ N:N (via profile_stacks)
         └── stacks

Analytics:
  mv_salary_global
  mv_salary_by_stack
  mv_salary_by_city
  mv_salary_filtered
```

---

## 10. Estrutura do Projeto

### 10.1 Stack Tecnológica

| Tecnologia | Uso |
|-----------|-----|
| Node.js | Runtime |
| TypeScript | Linguagem |
| Fastify | Framework HTTP |
| Prisma | ORM |
| PostgreSQL | Banco de dados |
| Socket.IO | WebSocket / tempo real |
| Pino | Logger |
| Swagger | Documentação da API |
| bcrypt | Hash de senhas |
| JWT | Autenticação |

### 10.2 Estrutura Completa de Pastas

```
src/
│
├── app.ts                          # Instância Fastify, middlewares, registro de rotas
├── server.ts                       # Bootstrap do servidor
│
├── config/
│   ├── env.ts                      # Variáveis de ambiente
│   └── database.ts                 # Instância Prisma Client
│
├── shared/
│   ├── errors/
│   │   └── AppError.ts             # Classe base de erros da aplicação
│   │
│   ├── http/
│   │   ├── response.ts             # Helper para montar resposta padrão
│   │   └── statusCodes.ts          # Enum de status HTTP
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # Validação JWT
│   │   └── error.middleware.ts     # Handler global de erros
│   │
│   └── utils/
│
├── modules/
│   │
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── AuthController.ts
│   │   ├── services/
│   │   │   └── AuthService.ts
│   │   ├── dtos/
│   │   │   ├── RegisterDTO.ts
│   │   │   └── LoginDTO.ts
│   │   └── routes/
│   │       └── auth.routes.ts
│   │
│   ├── users/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dtos/
│   │   └── routes/
│   │
│   ├── profiles/
│   │   ├── controllers/
│   │   │   └── ProfileController.ts
│   │   ├── services/
│   │   │   └── ProfileService.ts
│   │   ├── repositories/
│   │   │   └── ProfileRepository.ts
│   │   ├── dtos/
│   │   │   ├── CreateProfileDTO.ts
│   │   │   └── UpdateProfileDTO.ts
│   │   └── routes/
│   │       └── profile.routes.ts
│   │
│   ├── stacks/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dtos/
│   │   └── routes/
│   │
│   ├── cities/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dtos/
│   │   └── routes/
│   │
│   ├── salaries/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dtos/
│   │   └── routes/
│   │
│   └── analytics/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       └── routes/
│
└── websocket/
    └── socket.ts                   # Configuração Socket.IO, emissão salary:update
```

### 10.3 Prisma

```
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

### 10.4 Seed Inicial

O seed deve criar:

**1 usuário admin:**
```
email:    admin@system.com
password: admin123  (hashed com bcrypt)
role:     ADMIN
```

**Stacks iniciais:**
```
Node.js, TypeScript, React, Angular, Vue,
Python, Go, Rust, Java, C#, PHP
```

**Cidades iniciais:**
```
São Paulo (SP, Brasil)
Rio de Janeiro (RJ, Brasil)
Belo Horizonte (MG, Brasil)
Curitiba (PR, Brasil)
Porto Alegre (RS, Brasil)
Florianópolis (SC, Brasil)
Recife (PE, Brasil)
Fortaleza (CE, Brasil)
```

### 10.5 Variáveis de Ambiente (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/tech_salary_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=3000
```

### 10.6 Scripts (package.json)

| Script | Comando |
|--------|---------|
| `dev` | Inicia servidor em modo desenvolvimento |
| `build` | Compila TypeScript |
| `start` | Inicia servidor compilado |
| `prisma:migrate` | Roda migrations |
| `prisma:generate` | Gera Prisma Client |
| `seed` | Executa seed do banco |

### 10.7 Validação de Dados

Validação feita via **DTOs manuais** (sem biblioteca externa como Zod).

Cada DTO é uma classe/interface TypeScript com método `validate()` que lança `AppError` em caso de dados inválidos.

---

## Resumo Final

| Categoria | Decisão |
|-----------|---------|
| Runtime | Node.js |
| Linguagem | TypeScript |
| Framework | Fastify |
| ORM | Prisma |
| Banco | PostgreSQL |
| WebSocket | Socket.IO |
| Autenticação | JWT + bcrypt |
| Logs | Pino |
| Documentação | Swagger |
| IDs | UUID |
| Validação | DTOs manuais |
| Analytics | Materialized Views (cache) |
| Organização | Feature-based modules |
| Arquitetura | MVC + Controller/Service/Repository |
| Versionamento | /v1/ |
| Resposta padrão | `{ success, data, error }` |
| Seed | Admin + cidades + stacks |
| Histórico salarial | Imutável, append-only |
| Stacks | Lista controlada, many-to-many |
| Cidades | Tabela controlada |
| Experiência | Enum: JUNIOR, PLENO, SENIOR, STAFF_PLUS |
| Salário | Mensal bruto (INTEGER) |
