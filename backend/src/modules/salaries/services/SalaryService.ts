import { prisma } from '../../../config/database';
import { AppError } from '../../../shared/errors/AppError';
import { CreateSalaryDTO } from '../dtos/CreateSalaryDTO';
import { emitSalaryUpdate } from '../../../websocket/socket';

export class SalaryService {
  /**
   * Adiciona um novo salário ao histórico do usuário (RN-08)
   */
  async addSalary(userId: string, data: CreateSalaryDTO) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado. Crie um perfil profissional antes de registrar salários.', 'PROFILE_NOT_FOUND', 404);
    }

    // Persistindo novo salário
    const newSalary = await prisma.salaryHistory.create({
      data: {
        profileId: profile.id,
        salary: data.salary,
      },
    });

    // Como as materialized views precisam ser refreshadas toda vez (RN-11 a RN-16)
    // Usaremos Raw Queries para forçar a atualização das views no banco
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_global;`);
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_by_stack;`);
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_by_city;`);
    await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_filtered;`);

    // Busca a média atualizada na Materialized View para enviar no evento WebSocket (RN-18 e RN-19)
    const globalMv: any[] = await prisma.$queryRawUnsafe(`SELECT average_salary FROM mv_salary_global LIMIT 1;`);
    
    let avg = 0;
    if (globalMv.length > 0 && globalMv[0].average_salary) {
      avg = Number(globalMv[0].average_salary);
    }

    emitSalaryUpdate({
      globalAverage: avg,
      updatedAt: new Date().toISOString(),
    });

    return {
      salary: newSalary.salary,
      createdAt: newSalary.createdAt,
    };
  }

  /**
   * Retorna o histórico de salários (RN-08)
   */
  async getHistory(userId: string) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404);
    }

    const history = await prisma.salaryHistory.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        salary: true,
        createdAt: true,
      },
    });

    return history;
  }
}
