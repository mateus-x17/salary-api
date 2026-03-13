import { FastifyInstance } from 'fastify';
import { StacksController } from '../controllers/StacksController';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware';

/**
 * @description Rotas do módulo Stacks com prefixo /v1/stacks
 */
export async function stacksRoutes(app: FastifyInstance) {
  const controller = new StacksController();

  // GET /v1/stacks - Lista as stacks (Público)
  app.get('/', controller.list.bind(controller));

  // POST /v1/stacks - Cria nova stack (Requer Auth e ADMIN)
  app.post('/', { preHandler: [authMiddleware] }, controller.create.bind(controller));
}
