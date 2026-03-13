import { FastifyInstance } from 'fastify';
import { CitiesController } from '../controllers/CitiesController';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware';

/**
 * @description Rotas do módulo Cities com prefixo /v1/cities
 */
export async function citiesRoutes(app: FastifyInstance) {
  const controller = new CitiesController();

  // GET /v1/cities - Lista as cidades (público)
  app.get('/', controller.list.bind(controller));

  // POST /v1/cities - Cria nova cidade (Requer Auth e ADMIN)
  app.post('/', { preHandler: [authMiddleware] }, controller.create.bind(controller));
}
