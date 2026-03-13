import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { errorMiddleware } from './shared/middlewares/error.middleware';
import { authRoutes } from './modules/auth/routes/auth.routes';
import { citiesRoutes } from './modules/cities/routes/cities.routes';
import { stacksRoutes } from './modules/stacks/routes/stacks.routes';
import { usersAdminRoutes } from './modules/users/routes/users.routes';
import { profileRoutes } from './modules/profiles/routes/profile.routes';
import { salaryRoutes } from './modules/salaries/routes/salary.routes';
import { analyticsRoutes } from './modules/analytics/routes/analytics.routes';

export const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
  },
});

// --- CORS (permite o frontend acessar a API) ---
app.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

app.register(swagger, {
  openapi: {
    info: {
      title: 'Tech Salary Intelligence API',
      description: 'API analítica de salários para profissionais de tecnologia',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

app.register(swaggerUi, {
  routePrefix: '/docs',
});

app.setErrorHandler(errorMiddleware);

// --- Rotas da API ---
app.register(authRoutes, { prefix: '/v1/auth' });
app.register(citiesRoutes, { prefix: '/v1/cities' });
app.register(stacksRoutes, { prefix: '/v1/stacks' });
app.register(usersAdminRoutes, { prefix: '/v1/admin/users' });
app.register(profileRoutes, { prefix: '/v1/profile' });
app.register(salaryRoutes, { prefix: '/v1/profile/salary' });
app.register(analyticsRoutes, { prefix: '/v1/analytics' });

app.get('/health', async () => {
  return { status: 'ok' };
});
