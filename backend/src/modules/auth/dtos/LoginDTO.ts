import { AppError } from '../../../shared/errors/AppError';

export class LoginDTO {
  email!: string;
  password!: string;

  constructor(data: any) {
    this.email = data.email;
    this.password = data.password;
  }

  /**
   * Valida os campos obrigatórios do login.
   * Lança AppError caso um campo falhe.
   */
  validate() {
    if (!this.email || typeof this.email !== 'string' || !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw new AppError('Email inválido', 'VALIDATION_ERROR');
    }
    if (!this.password || typeof this.password !== 'string') {
      throw new AppError('Senha é obrigatória', 'VALIDATION_ERROR');
    }
  }
}
