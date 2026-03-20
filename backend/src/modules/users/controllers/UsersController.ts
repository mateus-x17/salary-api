import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../../config/database';
import { successResponse } from '../../../shared/http/response';
import { AppError } from '../../../shared/errors/AppError';

/**
 * @file UsersController.ts
 * @description Listagem administrativa de usuários.
 */
export class UsersController {
  /**
   * Retorna todos os usuários cadastrados. Requer role ADMIN de acordo com RN-03.
   */
  async listAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (request.user.role !== 'ADMIN') {
      throw new AppError('Acesso negado', 'FORBIDDEN', 403);
    }

    // Simplificando usando prisma direto no controller já que é apenas uma listagem administrativa simples
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          include: {
            city: true,
            profileStacks: { include: { stack: true } },
            salaryHistories: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.status(200).send(successResponse(users));
  }

  async count(request: FastifyRequest, reply: FastifyReply) {
    const count = await prisma.user.count();
    return reply.status(200).send(successResponse({ count }));
  }

  /**
   * Atualiza dados completos de um usuário (Admin).
   * RN-08: Histórico salarial é inserido, nunca deletado. Se salário mudar, adiciona novo.
   * RN-04: Atualiza o perfil associado.
   */
  async updateUser(request: FastifyRequest, reply: FastifyReply) {
    if (request.user.role !== 'ADMIN') {
      throw new AppError('Acesso negado', 'FORBIDDEN', 403);
    }

    const { id } = request.params as { id: string };
    const data = request.body as any;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: { include: { salaryHistories: { orderBy: { createdAt: 'desc' }, take: 1 } } } }
    });

    if (!user) throw new AppError('Usuário não encontrado', 'NOT_FOUND', 404);

    // Identificar ou criar a cidade fornecida
    let cityRecord = await prisma.city.findFirst({
      where: { name: { equals: data.city, mode: 'insensitive' } },
    });
    
    if (!cityRecord) {
      cityRecord = await prisma.city.create({
        data: { name: data.city || 'Desconhecida', state: 'N/A', country: 'Brasil' },
      });
    }

    // Identificar ou criar as stacks
    const stackRecords = await Promise.all(
      (data.stacks || []).map(async (stackName: string) => {
        let stackRecord = await prisma.stack.findFirst({
          where: { name: { equals: stackName, mode: 'insensitive' } },
        });
        if (!stackRecord) {
          stackRecord = await prisma.stack.create({ data: { name: stackName } });
        }
        return stackRecord;
      })
    );

    const bcrypt = require('bcrypt'); // Import dinamico para evitar modificar cabecalho
    
    await prisma.$transaction(async (tx) => {
      let updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
      };

      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(data.password, salt);
      }

      await tx.user.update({
        where: { id },
        data: updateData
      });

      if (user.profile) {
        await tx.professionalProfile.update({
          where: { id: user.profile.id },
          data: {
            cityId: cityRecord!.id,
            experienceLevel: data.experienceLevel,
          }
        });

        // Verifica Mudanca de Salario
        const currentSalary = user.profile.salaryHistories[0]?.salary || 0;
        if (Number(data.salary) !== currentSalary) {
          await tx.salaryHistory.create({
            data: {
              profileId: user.profile.id,
              salary: Number(data.salary)
            }
          });
        }

        // Remanejar Stacks: deleta todas as conexoes e recria
        await tx.profileStack.deleteMany({
          where: { profileId: user.profile.id }
        });

        for (const st of stackRecords) {
          await tx.profileStack.create({
            data: { profileId: user.profile.id, stackId: st.id }
          });
        }
      }
    });

    try {
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_by_stack;`);
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_global;`);
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_filtered;`);
    } catch (err) {
      console.warn('Erro ao atualizar MVs no update user.', err);
    }

    return reply.status(200).send(successResponse({ success: true }));
  }
}
