import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';

/**
 * Atributos que serão injetados no request.user
 */
interface TokenPayload {
  id: string;
  role: string;
  email: string;
}

declare module 'fastify' {
  export interface FastifyRequest {
    user: TokenPayload;
  }
}

/**
 * @description Middleware de interceptação de rotas protegidas (Auth JWT).
 * Decodifica o Bearer Token, verifica validade e injeta os dados em request.user.
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token JWT não fornecido no cabeçalho Authorization', 'TOKEN_MISSING', 401);
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError('Token JWT mal formatado. Padrão esperado: Bearer <token>', 'INVALID_TOKEN_FORMAT', 401);
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    
    // Injeta os dados do usuário autenticado para as próximas rotas/controllers
    request.user = decoded;
  } catch (err) {
    throw new AppError('Token JWT inválido ou expirado', 'INVALID_TOKEN', 401);
  }
}
