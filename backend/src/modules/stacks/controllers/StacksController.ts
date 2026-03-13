import { FastifyRequest, FastifyReply } from 'fastify';
import { StacksService } from '../services/StacksService';
import { successResponse } from '../../../shared/http/response';
import { AppError } from '../../../shared/errors/AppError';

/**
 * @file StacksController.ts
 * @description Controlador para listagem e criação de stacks controladas pelo sistema.
 */
export class StacksController {
  private service: StacksService;

  constructor() {
    this.service = new StacksService();
  }

  /**
   * Retorna a lista de todas as stacks
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const stacks = await this.service.listAll();
    return reply.status(200).send(successResponse(stacks));
  }

  /**
   * Adiciona uma nova stack à base (Requer perfil ADMIN)
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    if (request.user.role !== 'ADMIN') {
      throw new AppError('Acesso negado. Apenas administradores podem criar stacks', 'FORBIDDEN', 403);
    }

    const { name } = request.body as any;

    if (!name || typeof name !== 'string') {
      throw new AppError('O campo name (nome da stack) é obrigatório', 'VALIDATION_ERROR', 400);
    }

    const stack = await this.service.create({ name });
    return reply.status(201).send(successResponse(stack));
  }
}
