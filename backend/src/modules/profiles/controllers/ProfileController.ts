import { FastifyRequest, FastifyReply } from 'fastify';
import { ProfileService } from '../services/ProfileService';
import { CreateProfileDTO } from '../dtos/CreateProfileDTO';
import { UpdateProfileDTO } from '../dtos/UpdateProfileDTO';
import { successResponse } from '../../../shared/http/response';

/**
 * @file ProfileController.ts
 * @description Controlador para o módulo de Perfil Profissional e StacksAssociadas.
 */
export class ProfileController {
  private service: ProfileService;

  constructor() {
    this.service = new ProfileService();
  }

  /**
   * Cria o perfil do usuário (POST /v1/profile)
   */
  async createProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const dto = new CreateProfileDTO(request.body);
    dto.validate();

    const profile = await this.service.createProfile(userId, dto);
    return reply.status(201).send(successResponse(profile));
  }

  /**
   * Obtém o perfil do usuário autenticado (GET /v1/profile)
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    
    const profile = await this.service.getProfile(userId);
    return reply.status(200).send(successResponse(profile));
  }

  /**
   * Atualiza informações do perfil, exceto o salário (PATCH /v1/profile)
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const dto = new UpdateProfileDTO(request.body);
    dto.validate();

    await this.service.updateProfile(userId, dto);
    return reply.status(200).send(successResponse({ message: 'Perfil atualizado com sucesso' }));
  }

  /**
   * Adiciona uma stack ao perfil (POST /v1/profile/stacks)
   */
  async addStack(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const { stackId } = request.body as any;

    await this.service.addStack(userId, stackId);
    return reply.status(201).send(successResponse({ message: 'Stack associada com sucesso' }));
  }

  /**
   * Remove uma stack do perfil (DELETE /v1/profile/stacks/:stackId)
   */
  async removeStack(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const { stackId } = request.params as any;

    await this.service.removeStack(userId, stackId);
    return reply.status(200).send(successResponse({ message: 'Stack removida com sucesso' }));
  }

  /**
   * Lista as stacks do perfil (GET /v1/profile/stacks)
   */
  async listStacks(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    
    const stacks = await this.service.listStacks(userId);
    return reply.status(200).send(successResponse(stacks));
  }
}
