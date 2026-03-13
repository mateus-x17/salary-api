import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';

/**
 * @description Rotas do módulo Auth com prefixo /v1/auth
 */
export async function authRoutes(app: FastifyInstance) {
  const authController = new AuthController();

  // POST /v1/auth/register - Cadastro de novo usuário
  app.post('/register', authController.register.bind(authController));

  // POST /v1/auth/login - Autenticação e geração de token JWT
  app.post('/login', authController.login.bind(authController));
}
