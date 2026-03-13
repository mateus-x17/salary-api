import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from '../services/AnalyticsService';
import { successResponse } from '../../../shared/http/response';
import { AppError } from '../../../shared/errors/AppError';

/**
 * @file AnalyticsController.ts
 * @description Controlador para o módulo de Analytics via Materialized Views
 */
export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  async getGlobal(request: FastifyRequest, reply: FastifyReply) {
    const data = await this.service.getGlobalSalary();
    return reply.status(200).send(successResponse(data));
  }

  async getByStack(request: FastifyRequest, reply: FastifyReply) {
    const { stackId } = request.query as any;
    if (!stackId) throw new AppError('O parâmetro stackId é obrigatório', 'MISSING_PARAM');

    const data = await this.service.getSalaryByStack(stackId);
    if (!data) throw new AppError('Stack não encontrada', 'NOT_FOUND', 404);

    return reply.status(200).send(successResponse(data));
  }

  async getByCity(request: FastifyRequest, reply: FastifyReply) {
    const { cityId } = request.query as any;
    if (!cityId) throw new AppError('O parâmetro cityId é obrigatório', 'MISSING_PARAM');

    const data = await this.service.getSalaryByCity(cityId);
    if (!data) throw new AppError('Cidade não encontrada', 'NOT_FOUND', 404);

    return reply.status(200).send(successResponse(data));
  }

  async getFiltered(request: FastifyRequest, reply: FastifyReply) {
    const { stackId, cityId, experienceLevel } = request.query as any;
    
    const data = await this.service.getFilteredSalary({ stackId, cityId, experienceLevel });
    return reply.status(200).send(successResponse(data));
  }

  async getRanking(request: FastifyRequest, reply: FastifyReply) {
    const data = await this.service.getStacksRanking();
    return reply.status(200).send(successResponse(data));
  }
}
