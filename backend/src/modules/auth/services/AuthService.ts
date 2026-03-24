import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { RegisterDTO } from '../dtos/RegisterDTO';
import { LoginDTO } from '../dtos/LoginDTO';
import { AppError } from '../../../shared/errors/AppError';

export class AuthService {
  /**
   * Validação de Negócio e Persistência de novo usuário.
   */
  async register(data: RegisterDTO) {
    // RN-01: Email único por usuário. Verifica se já existe um usuário com esse email.
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new AppError('Email já está em uso', 'EMAIL_IN_USE', 409);
    }

    // Persistência com hash seguro (RNF-04)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Identificar ou criar a cidade fornecida
      let cityRecord;
      if (data.cityId) {
        cityRecord = await prisma.city.findUnique({
          where: { id: data.cityId },
        });

        if (!cityRecord) {
          throw new AppError('Cidade não encontrada', 'CITY_NOT_FOUND', 404);
        }
      } else {
        cityRecord = await prisma.city.findFirst({
          where: { name: { equals: data.city, mode: 'insensitive' } },
        });

        if (!cityRecord) {
          cityRecord = await prisma.city.create({
            data: {
              name: data.city!,
              state: 'N/A',
              country: 'Brasil',
            },
          });
        }
      }

    // Identificar ou criar as stacks
    // 🔥 AGORA BUSCA POR IDs
    const stackRecords = await prisma.stack.findMany({
      where: { id: { in: data.stacks } },
    });
    // validação extra (evita ID inválido silencioso)
    if (stackRecords.length !== data.stacks.length) {
      throw new AppError('Uma ou mais stacks são inválidas', 'INVALID_STACKS', 400);
    }

    const user = await prisma.$transaction(async (tx) => {
      // 1. Cria usuário
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: data.role === 'ADMIN' ? 'ADMIN' : 'USER',
        },
      });

      // 2. Cria perfil (RN-04)
      const newProfile = await tx.professionalProfile.create({
        data: {
          userId: newUser.id,
          cityId: cityRecord.id, // TS error fix: cityRecord is guaranteed here
          experienceLevel: data.experienceLevel,
        },
      });

      // 3. Cria histórico salarial inicial (RN-10 e RN-08)
      await tx.salaryHistory.create({
        data: {
          profileId: newProfile.id,
          salary: data.salary,
        },
      });

      // 4. Associa stacks ao perfil (RN-05)
      await tx.profileStack.createMany({
        data: stackRecords.map((st) => ({
          profileId: newProfile.id,
          stackId: st.id,
        })),
      }); // otimização: createMany para reduzir queries

      return {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      };
    });

    // Atualiza Materialized Views de forma concorrente para não bloquear leituras
    try {
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_by_stack;`);
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_global;`);
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_salary_filtered;`);
    } catch (err) {
      console.warn('Erro ao atualizar MVs. Pode ser porque estão vazias ou sem índice unico.', err);
    }

    return user;
  }

  /**
   * Autentica um usuário e retorna um token JWT (RNF-03).
   */
  async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
    }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  ); // correção do tipo de expiresIn

    return { token };
  }
}
