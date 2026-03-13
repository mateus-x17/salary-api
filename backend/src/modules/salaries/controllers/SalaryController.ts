import { FastifyRequest, FastifyReply } from 'fastify';
import { SalaryService } from '../services/SalaryService';
import { CreateSalaryDTO } from '../dtos/CreateSalaryDTO';
import { successResponse } from '../../../shared/http/response';

/**
 * @file SalaryController.ts
 * @description Controlador de Salários, coordena a adição de valores e disparos em tempo real.
 */
export class SalaryController {
  private service: SalaryService;

  constructor() {
    this.service = new SalaryService();
  }

  /**
   * Registra novo salário (POST /v1/profile/salary)
   */
  async addSalary(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const dto = new CreateSalaryDTO(request.body);
    dto.validate();

    const salaryRecord = await this.service.addSalary(userId, dto);
    
    return reply.status(201).send(successResponse(salaryRecord));
  }

  /**
   * Retorna o histórico salarial (GET /v1/profile/salary/history)
   */
  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;

    const history = await this.service.getHistory(userId);
    
    return reply.status(200).send(successResponse(history));
  }
}
