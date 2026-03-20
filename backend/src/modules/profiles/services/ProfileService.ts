import { prisma } from '../../../config/database';
import { CreateProfileDTO } from '../dtos/CreateProfileDTO';
import { UpdateProfileDTO } from '../dtos/UpdateProfileDTO';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Atualiza todas as Materialized Views de analytics.
 * Deve ser chamado sempre que dados que alimentam as views mudarem
 * (ex: adição ou remoção de stacks do perfil).
 *
 * CONCURRENTLY permite que a view seja lida durante o refresh,
 * mas exige que a view tenha um índice único. Se não tiver, remova
 * o CONCURRENTLY e aceite o lock breve durante o refresh.
 */
async function refreshAnalyticsViews() {
  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_by_stack;`);
  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_global;`);
  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_filtered;`);
}

export class ProfileService {
  /**
   * RN-04: Cada usuário possui apenas 1 perfil.
   * RN-10: Ao criar perfil, um registro de salário inicial é criado no histórico.
   */
  async createProfile(userId: string, data: CreateProfileDTO) {
    const existingProfile = await prisma.professionalProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new AppError('O usuário já possui um perfil profissional.', 'PROFILE_ALREADY_EXISTS', 409);
    }

    const cityExists = await prisma.city.findUnique({ where: { id: data.cityId } });
    if (!cityExists) {
      throw new AppError('Cidade não encontrada', 'CITY_NOT_FOUND', 404);
    }

    const profile = await prisma.$transaction(async (tx) => {
      const newProfile = await tx.professionalProfile.create({
        data: {
          userId,
          cityId: data.cityId,
          experienceLevel: data.experienceLevel,
        },
        include: { city: true },
      });

      const initialSalary = await tx.salaryHistory.create({
        data: {
          profileId: newProfile.id,
          salary: data.salary,
        },
      });

      return {
        id: newProfile.id,
        city: newProfile.city.name,
        experienceLevel: newProfile.experienceLevel,
        stacks: [],
        currentSalary: initialSalary.salary,
      };
    });

    return profile;
  }

  /**
   * Busca o perfil do usuário atual com a cidade, stacks e último salário (RN-09).
   */
  async getProfile(userId: string) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        city: true,
        profileStacks: {
          include: { stack: true },
        },
        salaryHistories: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        user: true, // <-- adiciona o join com User
      },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404);
    }

    return {
      userId: profile.userId,
      city: profile.city.name,
      experienceLevel: profile.experienceLevel,
      stacks: profile.profileStacks.map((ps) => ps.stack.name),
      currentSalary: profile.salaryHistories[0]?.salary || 0,
      email: profile.user.email,   // <-- adicione
      nome: profile.user.name,     // <-- adicione (ajuste para o campo real do seu schema)
    };
  }

  /**
   * Atualiza os dados básicos do perfil. O salário não é alterado por aqui.
   */
  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const profile = await prisma.professionalProfile.findUnique({ 
      where: { userId },
      include: {
        user: true,
        salaryHistories: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404);
    }

    let cityRecord = undefined;
    if (data.city) {
      cityRecord = await prisma.city.findFirst({
        where: { name: { equals: data.city, mode: 'insensitive' } },
      });
      if (!cityRecord) {
        cityRecord = await prisma.city.create({
          data: { name: data.city || 'Desconhecida', state: 'N/A', country: 'Brasil' },
        });
      }
    }

    let stackRecords: any[] = [];
    if (data.stacks) {
      stackRecords = await Promise.all(
        data.stacks.map(async (stackName: string) => {
          let stackRecord = await prisma.stack.findFirst({
            where: { name: { equals: stackName, mode: 'insensitive' } },
          });
          if (!stackRecord) {
            stackRecord = await prisma.stack.create({ data: { name: stackName } });
          }
          return stackRecord;
        })
      );
    }

    const bcrypt = require('bcrypt'); // Import dinâmico

    await prisma.$transaction(async (tx) => {
      let updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.email) updateData.email = data.email;
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(data.password, salt);
      }

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: updateData
        });
      }

      let profileUpdateData: any = {};
      if (cityRecord) profileUpdateData.cityId = cityRecord.id;
      if (data.experienceLevel) profileUpdateData.experienceLevel = data.experienceLevel;

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.professionalProfile.update({
          where: { id: profile.id },
          data: profileUpdateData
        });
      }

      if (data.salary !== undefined) {
        const currentSalary = profile.salaryHistories[0]?.salary || 0;
        if (Number(data.salary) !== currentSalary) {
          await tx.salaryHistory.create({
            data: {
              profileId: profile.id,
              salary: Number(data.salary)
            }
          });
        }
      }

      if (data.stacks) {
        await tx.profileStack.deleteMany({
          where: { profileId: profile.id }
        });

        for (const st of stackRecords) {
          await tx.profileStack.create({
            data: { profileId: profile.id, stackId: st.id }
          });
        }
      }
    });

    try {
      await refreshAnalyticsViews();
    } catch (err) {
      console.warn('Erro ao atualizar MVs', err);
    }
  }

  /**
   * Adiciona uma stack ao perfil do usuário (RN-05).
   * Após a operação, atualiza as Materialized Views de analytics.
   */
  async addStack(userId: string, stackId: string) {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId } });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404);
    }

    const stack = await prisma.stack.findUnique({ where: { id: stackId } });
    if (!stack) {
      throw new AppError('Stack não encontrada', 'STACK_NOT_FOUND', 404);
    }

    const alreadyHasStack = await prisma.profileStack.findUnique({
      where: {
        profileId_stackId: {
          profileId: profile.id,
          stackId,
        },
      },
    });

    if (alreadyHasStack) {
      throw new AppError('Stack já associada ao perfil', 'STACK_ALREADY_ASSOCIATED', 409);
    }

    await prisma.profileStack.create({
      data: {
        profileId: profile.id,
        stackId,
      },
    });

    // Atualiza as Materialized Views para refletir a nova associação
    await refreshAnalyticsViews();
  }

  /**
   * Remove uma stack associada ao perfil.
   * Após a operação, atualiza as Materialized Views de analytics.
   */
  async removeStack(userId: string, stackId: string) {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId } });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404);
    }

    await prisma.profileStack.delete({
      where: {
        profileId_stackId: {
          profileId: profile.id,
          stackId,
        },
      },
    }).catch(() => {
      throw new AppError('Associação de stack não encontrada', 'ASSOCIATION_NOT_FOUND', 404);
    });

    // Atualiza as Materialized Views para refletir a remoção
    await refreshAnalyticsViews();
  }

  /**
   * Lista as stacks do perfil
   */
  async listStacks(userId: string) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId },
      include: {
        profileStacks: {
          include: { stack: true },
        },
      },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404);
    }

    return profile.profileStacks.map((ps) => ({
      id: ps.stack.id,
      name: ps.stack.name,
    }));
  }
}