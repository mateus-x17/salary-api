import { FastifyInstance } from 'fastify';
import { UsersController } from '../controllers/UsersController';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware';

/**
 * @description Rotas do módulo Admin/Users com prefixo /v1/admin/users
 */
export async function usersAdminRoutes(app: FastifyInstance) {
  const controller = new UsersController();

  // GET /v1/admin/users
  app.get('/', { preHandler: [authMiddleware] }, controller.listAdmin.bind(controller));
}
