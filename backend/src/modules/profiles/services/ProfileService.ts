import { prisma } from '../../../config/database';
import { CreateProfileDTO } from '../dtos/CreateProfileDTO';
import { UpdateProfileDTO } from '../dtos/UpdateProfileDTO';
import { AppError } from '../../../shared/errors/AppError';

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

    // Usando transaction para garantir a consistência das duas operações
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
          take: 1, // Pega apenas o último salário (mais recente)
        },
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
    };
  }

  /**
   * Atualiza os dados básicos do perfil. O salário não é alterado por aqui.
   */
  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const profile = await prisma.professionalProfile.findUnique({ where: { userId } });
    
    if (!profile) {
      throw new AppError('Perfil não encontrado', 'PROFILE_NOT_FOUND', 404);
    }

    if (data.cityId) {
      const cityExists = await prisma.city.findUnique({ where: { id: data.cityId } });
      if (!cityExists) {
        throw new AppError('Cidade não encontrada', 'CITY_NOT_FOUND', 404);
      }
    }

    await prisma.professionalProfile.update({
      where: { userId },
      data: {
        cityId: data.cityId,
        experienceLevel: data.experienceLevel,
      },
    });
  }

  /**
   * Adiciona uma stack ao perfil do usuário (RN-05).
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
  }

  /**
   * Remove uma stack associada ao perfil.
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
