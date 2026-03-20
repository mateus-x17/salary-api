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
    try {
      const data = await this.service.getFilteredSalary({ stackId, cityId, experienceLevel });
      return reply.status(200).send(successResponse(data));
    } catch (err: any) {
      // Log detalhado para diagnóstico do erro real do Postgres
      console.error('[AnalyticsController.getFiltered] ERRO:', err?.message);
      console.error('[AnalyticsController.getFiltered] STACK:', err?.stack);
      throw err;
    }
  }

  async getRanking(request: FastifyRequest, reply: FastifyReply) {
    const data = await this.service.getStacksRanking();
    return reply.status(200).send(successResponse(data));
  }

  async getCitiesRankings(request: FastifyRequest, reply: FastifyReply) {
    const [above, below] = await Promise.all([
      this.service.getCitiesAboveGlobal(),
      this.service.getCitiesBelowGlobal()
    ]);
    return reply.status(200).send(successResponse({ above, below }));
  }

  /**
   * Dados granulares: média por stack filtrado por nível de experiência
   */
  async getChartByLevel(request: FastifyRequest, reply: FastifyReply) {
    const { experienceLevel } = request.query as any;
    const data = await this.service.getSalaryByStackAndLevel(experienceLevel);
    return reply.status(200).send(successResponse(data));
  }

  /**
   * Dados granulares: média por stack filtrado por cidade
   */
  async getChartByCity(request: FastifyRequest, reply: FastifyReply) {
    const { cityId } = request.query as any;
    const data = await this.service.getSalaryByStackAndCity(cityId);
    return reply.status(200).send(successResponse(data));
  }

  /**
   * Dados granulares: média por nível filtrado por stack
   */
  async getChartByStack(request: FastifyRequest, reply: FastifyReply) {
    const { stackId } = request.query as any;
    const data = await this.service.getSalaryByLevelAndStack(stackId);
    return reply.status(200).send(successResponse(data));
  }
}
