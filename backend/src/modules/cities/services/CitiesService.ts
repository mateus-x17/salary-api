import { prisma } from '../../../config/database';

export class CitiesService {
  /**
   * Lista todas as cidades cadastradas.
   */
  async listAll() {
    return prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Cria uma nova cidade.
   */
  async create(data: { name: string; state: string; country: string }) {
    return prisma.city.create({ data });
  }
}
