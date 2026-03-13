import { FastifyInstance } from 'fastify';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware';

/**
 * @description Rotas do módulo Analytics com prefixo /v1/analytics
 */
export async function analyticsRoutes(app: FastifyInstance) {
  const controller = new AnalyticsController();

  // Requer autenticação de acordo com a doc
  app.addHook('preHandler', authMiddleware);

  app.get('/salary/global', controller.getGlobal.bind(controller));
  app.get('/salary/stack', controller.getByStack.bind(controller));
  app.get('/salary/city', controller.getByCity.bind(controller));
  app.get('/salary/filter', controller.getFiltered.bind(controller));
  
  app.get('/ranking/stacks', controller.getRanking.bind(controller));
}
