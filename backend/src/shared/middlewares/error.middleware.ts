import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/AppError';
import { errorResponse } from '../http/response';

/**
 * @description Middleware global de tratamento de erros do Fastify.
 * Intercepta todas as exceções.
 */
export function errorMiddleware(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(
      errorResponse(error.code, error.message)
    );
  }

  // Tratamento de erros de validação do Fastify/Zod ou similares (se usasse)
  if (error.validation) {
    return reply.status(400).send(
      errorResponse('VALIDATION_ERROR', error.message)
    );
  }

  // Falha não tratada
  request.log.error(error);

  return reply.status(500).send(
    errorResponse('INTERNAL_SERVER_ERROR', 'Internal server error')
  );
}
