import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';
import { RegisterDTO } from '../dtos/RegisterDTO';
import { LoginDTO } from '../dtos/LoginDTO';
import { successResponse } from '../../../shared/http/response';

/**
 * @file AuthController.ts
 * @description Controlador para o módulo de autenticação.
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Recebe payload do body para registro, valida DTO e delega criação ao Service.
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    const dto = new RegisterDTO(request.body);
    dto.validate();

    const user = await this.authService.register(dto);
    
    // Conforme contrato da API, status 201 e retorno padronizado
    return reply.status(201).send(successResponse(user));
  }

  /**
   * Recebe payload do body para login, valida DTO e delega autenticação ao Service.
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    const dto = new LoginDTO(request.body);
    dto.validate();

    const result = await this.authService.login(dto);

    // Conforme contrato da API, status 200 e retorno padronizado com token
    return reply.status(200).send(successResponse(result));
  }
}
