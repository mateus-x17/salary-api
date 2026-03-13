# Guia de Comentários por Tipo de Arquivo

Este arquivo define os padrões de comentário para cada camada da arquitetura
da Tech Salary Intelligence API.

---

## Controller

O controller recebe a requisição e devolve a resposta. Os comentários devem
explicar: o que está sendo extraído da requisição, o que está sendo chamado
e o que está sendo devolvido.

```typescript
/**
 * @file profile.controller.ts
 * @description Recebe as requisições HTTP do módulo de perfil profissional
 * e delega a lógica para o ProfileService.
 */

export class ProfileController {

  /**
   * Cria o perfil profissional do usuário autenticado.
   * Chamado pelo endpoint: POST /v1/profile
   */
  async create(request: FastifyRequest, reply: FastifyReply) {

    // Extraímos o ID do usuário do token JWT, que foi validado pelo middleware de autenticação
    const userId = request.user.sub;

    // Extraímos os dados do corpo da requisição (o que o usuário enviou no POST)
    const { cityId, experienceLevel, salary } = request.body as CreateProfileDTO;

    // Delegamos a criação ao service, que contém a lógica de negócio
    const profile = await this.profileService.create(userId, { cityId, experienceLevel, salary });

    // Respondemos com status 201 (Created) e o perfil recém-criado
    return reply.status(201).send({
      success: true,
      data: profile,
      error: null,
    });
  }
}
```

---

## Service

O service contém as regras de negócio. Os comentários devem explicar cada
decisão de negócio tomada, não apenas o que o código faz tecnicamente.

```typescript
export class SalaryService {

  /**
   * Registra um novo salário para o usuário autenticado.
   *
   * Esta operação é o coração do sistema: além de salvar o salário,
   * ela atualiza as métricas analíticas e notifica clientes conectados
   * em tempo real.
   */
  async registerSalary(userId: string, salary: number) {

    // --- Validação de negócio ---

    // Verificamos se o usuário tem um perfil profissional cadastrado.
    // Não faz sentido registrar salário sem perfil (regra RN-10).
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new AppError('Perfil profissional não encontrado. Crie seu perfil antes de registrar salário.', 404);
    }

    // --- Persistência ---

    // Criamos um novo registro no histórico. Nunca sobrescrevemos o anterior.
    // Isso garante que podemos ver a evolução salarial ao longo do tempo (regra RN-08).
    const salaryRecord = await this.salaryRepository.create({
      profileId: profile.id,
      salary,
    });

    // --- Atualização das métricas ---

    // Após salvar, precisamos recalcular as médias salariais.
    // Usamos Materialized Views no PostgreSQL para isso — são como "tabelas de resumo"
    // que o banco atualiza sob demanda, tornando as consultas analíticas muito rápidas.
    await this.analyticsRepository.refreshViews();

    // --- Evento em tempo real ---

    // Emitimos um evento WebSocket para notificar todos os clientes conectados
    // que as médias salariais foram atualizadas.
    await this.socketGateway.emit('salary:update', {
      globalAverage: await this.analyticsRepository.getGlobalAverage(),
      updatedAt: new Date(),
    });

    return salaryRecord;
  }
}
```

---

## Repository

O repository acessa o banco. Os comentários devem explicar a query e
o que ela retorna, especialmente quando usar queries SQL brutas ou
cláusulas complexas do Prisma.

```typescript
export class SalaryRepository {

  /**
   * Cria um novo registro de histórico salarial.
   *
   * @param data - profileId e salary
   * @returns O registro criado, com id e createdAt gerados pelo banco
   */
  async create(data: { profileId: string; salary: number }) {

    // prisma.salaryHistory.create insere uma nova linha na tabela salary_history
    // e retorna o registro completo com os campos gerados pelo banco (id, createdAt)
    return this.prisma.salaryHistory.create({
      data: {
        profileId: data.profileId,
        salary: data.salary,
        // createdAt é preenchido automaticamente pelo banco com o horário atual
      },
    });
  }

  /**
   * Busca o salário mais recente de um perfil.
   *
   * Usamos "orderBy createdAt desc" + "take 1" para pegar sempre
   * o registro mais novo — que representa o salário atual do usuário.
   */
  async findCurrentByProfileId(profileId: string) {

    return this.prisma.salaryHistory.findFirst({
      where: { profileId },
      // Ordena do mais recente para o mais antigo
      orderBy: { createdAt: 'desc' },
      // Pega apenas o primeiro resultado (o mais recente)
      take: 1,
    });
  }
}
```

---

## DTO (Data Transfer Object)

DTOs são objetos que definem o formato dos dados que chegam ou saem da API.
Comente cada campo explicando o que ele representa e suas restrições.

```typescript
/**
 * @file CreateProfileDTO.ts
 * @description Define os dados esperados ao criar um perfil profissional.
 *
 * DTO = Data Transfer Object: é um "contrato" que descreve
 * exatamente quais campos a requisição deve conter.
 */
export class CreateProfileDTO {

  // ID da cidade onde o profissional trabalha (deve existir na tabela cities)
  cityId: string;

  // Faixa de experiência — deve ser um dos valores do enum ExperienceLevel:
  // 'JUNIOR' | 'PLENO' | 'SENIOR' | 'STAFF_PLUS'
  experienceLevel: string;

  // Salário mensal bruto em reais (número inteiro, sem centavos)
  salary: number;

  /**
   * Valida se os dados recebidos são válidos antes de prosseguir.
   * Lança AppError com status 400 se algum campo estiver faltando ou inválido.
   */
  validate() {
    // Verificamos se todos os campos obrigatórios foram enviados
    if (!this.cityId) throw new AppError('cityId é obrigatório', 400);
    if (!this.experienceLevel) throw new AppError('experienceLevel é obrigatório', 400);
    if (!this.salary || this.salary <= 0) throw new AppError('salary deve ser um número positivo', 400);

    // Verificamos se o experienceLevel é um valor válido do enum
    const validLevels = ['JUNIOR', 'PLENO', 'SENIOR', 'STAFF_PLUS'];
    if (!validLevels.includes(this.experienceLevel)) {
      throw new AppError(`experienceLevel deve ser um de: ${validLevels.join(', ')}`, 400);
    }
  }
}
```

---

## Middleware

Middlewares interceptam requisições antes de chegarem ao controller.
Comente o que está sendo verificado e o que acontece em cada caso.

```typescript
/**
 * @file auth.middleware.ts
 * @description Intercepta todas as rotas protegidas e verifica se o usuário
 * está autenticado com um token JWT válido.
 *
 * Como funciona:
 *  1. Lê o header "Authorization" da requisição
 *  2. Extrai o token JWT do header
 *  3. Verifica se o token é válido (não expirou, assinatura correta)
 *  4. Injeta os dados do usuário na requisição para uso nos controllers
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {

  // Lemos o cabeçalho Authorization da requisição
  // Formato esperado: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = request.headers.authorization;

  // Se não há cabeçalho, o usuário não está autenticado
  if (!authHeader) {
    return reply.status(401).send({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Token não fornecido' },
    });
  }

  // O header vem como "Bearer TOKEN" — separamos para pegar apenas o token
  // split(' ') divide a string por espaço: ['Bearer', 'TOKEN']
  // [1] pega o segundo elemento (o token em si)
  const token = authHeader.split(' ')[1];

  // jwt.verify lança uma exceção se o token for inválido ou expirado
  const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

  // Injetamos os dados do token na requisição para os controllers acessarem
  // Agora qualquer controller pode usar request.user.sub para saber quem é o usuário
  request.user = payload;
}
```

---

## Routes

Arquivos de rotas registram os endpoints no Fastify. Comente cada rota
indicando: método HTTP, caminho, autenticação exigida e o que faz.

```typescript
/**
 * @file profile.routes.ts
 * @description Registra todas as rotas do módulo de perfil profissional.
 *
 * Prefixo: /v1/profile
 * Todas as rotas exigem autenticação (token JWT válido).
 */
export async function profileRoutes(app: FastifyInstance) {

  // Aplicamos o middleware de autenticação em todas as rotas deste arquivo
  app.addHook('preHandler', authMiddleware);

  // POST /v1/profile — Cria o perfil profissional do usuário logado
  // Body esperado: { cityId, experienceLevel, salary }
  app.post('/', profileController.create.bind(profileController));

  // GET /v1/profile — Retorna o perfil do usuário logado
  app.get('/', profileController.findOwn.bind(profileController));

  // PATCH /v1/profile — Atualiza cidade e/ou experiência (não atualiza salário aqui)
  app.patch('/', profileController.update.bind(profileController));

  // POST /v1/profile/stacks — Adiciona uma stack ao perfil
  app.post('/stacks', profileController.addStack.bind(profileController));

  // DELETE /v1/profile/stacks/:stackId — Remove uma stack do perfil
  app.delete('/stacks/:stackId', profileController.removeStack.bind(profileController));
}
```
