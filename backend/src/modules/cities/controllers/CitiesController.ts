import { FastifyRequest, FastifyReply } from 'fastify';
import { CitiesService } from '../services/CitiesService';
import { successResponse } from '../../../shared/http/response';
import { AppError } from '../../../shared/errors/AppError';

/**
 * @file CitiesController.ts
 * @description Controlador do módulo de Cidades.
 */
export class CitiesController {
  private service: CitiesService;

  constructor() {
    this.service = new CitiesService();
  }

  /**
   * Lista todas as cidades. Não requer autenticação.
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const cities = await this.service.listAll();
    return reply.status(200).send(successResponse(cities));
  }

  /**
   * Cria uma nova cidade. Requer role ADMIN.
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    if (request.user.role !== 'ADMIN') {
      throw new AppError('Acesso negado. Apenas administradores podem criar cidades', 'FORBIDDEN', 403);
    }

    const { name, state, country } = request.body as any;
    
    if (!name || !state || !country) {
      throw new AppError('Os campos name, state e country são obrigatórios', 'VALIDATION_ERROR', 400);
    }

    const city = await this.service.create({ name, state, country });
    return reply.status(201).send(successResponse(city));
  }
}
