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

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'USER', // Por padrão cria como USER
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

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
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return { token };
  }
}
