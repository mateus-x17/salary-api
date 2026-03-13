import { FastifyInstance } from 'fastify';
import { ProfileController } from '../controllers/ProfileController';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware';

/**
 * @description Rotas do módulo Profile com prefixo /v1/profile
 */
export async function profileRoutes(app: FastifyInstance) {
  const controller = new ProfileController();

  // Todas as rotas de Profile exigem autenticação
  app.addHook('preHandler', authMiddleware);

  // GET /v1/profile
  app.get('/', controller.getProfile.bind(controller));
  
  // POST /v1/profile
  app.post('/', controller.createProfile.bind(controller));
  
  // PATCH /v1/profile
  app.patch('/', controller.updateProfile.bind(controller));

  // --- Rotas de Profile Stacks ---

  // GET /v1/profile/stacks
  app.get('/stacks', controller.listStacks.bind(controller));

  // POST /v1/profile/stacks
  app.post('/stacks', controller.addStack.bind(controller));

  // DELETE /v1/profile/stacks/:stackId
  app.delete('/stacks/:stackId', controller.removeStack.bind(controller));
}
