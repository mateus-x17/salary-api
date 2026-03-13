import { FastifyInstance } from 'fastify';
import { SalaryController } from '../controllers/SalaryController';
import { authMiddleware } from '../../../shared/middlewares/auth.middleware';

/**
 * @description Rotas do módulo Salary com prefixo /v1/profile/salary
 */
export async function salaryRoutes(app: FastifyInstance) {
  const controller = new SalaryController();

  // Exige permissões (authMiddleware)
  app.addHook('preHandler', authMiddleware);

  // POST /v1/profile/salary
  app.post('/', controller.addSalary.bind(controller));

  // GET /v1/profile/salary/history
  app.get('/history', controller.getHistory.bind(controller));
}
