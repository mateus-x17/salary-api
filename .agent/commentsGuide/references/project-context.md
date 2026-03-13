# Contexto do Projeto: Tech Salary Intelligence API

Este arquivo fornece o contexto técnico do projeto para o qual este skill foi criado.
Use-o como referência sempre que gerar ou revisar código.

---

## Stack Tecnológica

| Tecnologia | Versão recomendada | Para que serve |
|---|---|---|
| Node.js | 20+ | Ambiente de execução JavaScript no servidor |
| TypeScript | 5+ | Adiciona tipagem estática ao JavaScript |
| Fastify | 4+ | Framework HTTP — processa requisições e respostas da API |
| Prisma | 5+ | ORM — facilita consultas ao banco sem escrever SQL manual |
| PostgreSQL | 15+ | Banco de dados relacional onde tudo é persistido |
| Socket.IO | 4+ | Comunicação em tempo real via WebSocket |
| Pino | 8+ | Logger estruturado (registra eventos do servidor) |
| bcrypt | 5+ | Hash seguro de senhas |
| jsonwebtoken | 9+ | Geração e verificação de tokens JWT |

---

## Arquitetura

O projeto segue **MVC adaptado com Feature-based modules**:

```
src/
├── modules/          ← cada domínio tem sua própria pasta
│   ├── auth/
│   ├── users/
│   ├── profiles/
│   ├── stacks/
│   ├── cities/
│   ├── salaries/
│   └── analytics/
└── shared/           ← código reutilizado por todos os módulos
```

Dentro de cada módulo:
```
modulo/
├── controllers/   ← recebe a requisição HTTP
├── services/      ← lógica de negócio
├── repositories/  ← acessa o banco de dados
├── dtos/          ← define o formato dos dados de entrada
└── routes/        ← registra as rotas no Fastify
```

**Fluxo de uma requisição:**
```
Requisição HTTP → Route → Controller → Service → Repository → Banco
                                                     ↓
                                          (após salvar salário)
                                         Atualiza Materialized Views
                                                     ↓
                                         Emite evento WebSocket
```

---

## Padrão de Resposta da API

Toda resposta segue este formato:

```typescript
// Sucesso
{
  success: true,
  data: { /* conteúdo */ },
  error: null
}

// Erro
{
  success: false,
  data: null,
  error: {
    code: 'CODIGO_DO_ERRO',
    message: 'Mensagem legível para o desenvolvedor'
  }
}
```

---

## Banco de Dados — Tabelas Principais

```
users                     → dados de autenticação
professional_profiles     → dados profissionais (1 por usuário)
salary_history            → histórico imutável de salários
stacks                    → lista controlada de tecnologias
cities                    → lista controlada de cidades
profile_stacks            → associação N:N entre perfil e stacks
```

**Materialized Views** (atualizam após cada novo salário):
```
mv_salary_global          → média global de salários
mv_salary_by_stack        → média agrupada por stack
mv_salary_by_city         → média agrupada por cidade
mv_salary_filtered        → média com filtros combinados
```

---

## Regras de Negócio Críticas

Sempre respeite estas regras ao gerar código:

- **RN-08**: Histórico salarial é imutável. NUNCA atualize ou delete um registro de `salary_history`. Sempre crie um novo.
- **RN-09**: O salário atual de um usuário é o registro mais recente de `salary_history`.
- **RN-13**: O salário de um usuário com múltiplas stacks entra na média de TODAS as stacks dele.
- **RN-16**: Só aparecem no ranking stacks com no mínimo 5 registros salariais.
- **RN-02**: Usuário `USER` só pode acessar e modificar seus próprios dados.
- **RN-04**: Cada usuário tem exatamente 1 perfil profissional.

---

## Variáveis de Ambiente Usadas no Código

```env
DATABASE_URL      # string de conexão com o PostgreSQL
JWT_SECRET        # chave secreta para assinar tokens JWT
JWT_EXPIRES_IN    # tempo de expiração do JWT (ex: "7d")
PORT              # porta em que o servidor escuta
```

Sempre acesse via `process.env.NOME_DA_VARIAVEL` e documente nos comentários
qual variável está sendo usada e para quê.

---

## Enums do Projeto

```typescript
// Papéis de usuário
type Role = 'USER' | 'ADMIN';

// Faixas de experiência profissional
type ExperienceLevel = 'JUNIOR' | 'PLENO' | 'SENIOR' | 'STAFF_PLUS';
```

---

## Seed Inicial

O banco começa com os seguintes dados pré-carregados:

**Usuário admin:**
- email: `admin@system.com`
- senha: `admin123` (hasheada com bcrypt)
- role: `ADMIN`

**Stacks:** Node.js, TypeScript, React, Angular, Vue, Python, Go, Rust, Java, C#, PHP

**Cidades:** São Paulo (SP), Rio de Janeiro (RJ), Belo Horizonte (MG), Curitiba (PR),
Porto Alegre (RS), Florianópolis (SC), Recife (PE), Fortaleza (CE)
