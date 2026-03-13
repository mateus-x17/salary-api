import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/errors/AppError';

export class StacksService {
  /**
   * Lista todas as stacks disponíveis para seleção.
   */
  async listAll() {
    return prisma.stack.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Ensuring unique stack creation. RN-05 requer que as stacks existam.
   */
  async create(data: { name: string }) {
    const exists = await prisma.stack.findUnique({ where: { name: data.name } });
    
    if (exists) {
      throw new AppError('Esta stack já está cadastrada', 'STACK_ALREADY_EXISTS', 409);
    }

    return prisma.stack.create({ data });
  }
}
