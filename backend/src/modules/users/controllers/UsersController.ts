import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../../config/database';
import { successResponse } from '../../../shared/http/response';
import { AppError } from '../../../shared/errors/AppError';

/**
 * @file UsersController.ts
 * @description Listagem administrativa de usuários.
 */
export class UsersController {
  /**
   * Retorna todos os usuários cadastrados. Requer role ADMIN de acordo com RN-03.
   */
  async listAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (request.user.role !== 'ADMIN') {
      throw new AppError('Acesso negado', 'FORBIDDEN', 403);
    }

    // Simplificando usando prisma direto no controller já que é apenas uma listagem administrativa simples
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.status(200).send(successResponse(users));
  }

  async count(request: FastifyRequest, reply: FastifyReply) {
    // if (request.user.role !== 'ADMIN') {
    //   throw new AppError('Acesso negado', 'FORBIDDEN', 403);
    // }

    const count = await prisma.user.count();
    return reply.status(200).send(successResponse({ count }));
  }
}
