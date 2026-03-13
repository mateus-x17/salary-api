import { AppError } from '../../../shared/errors/AppError';

export class RegisterDTO {
  name!: string;
  email!: string;
  password!: string;

  constructor(data: any) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
  }

  /**
   * Valida os campos obrigatórios do registro.
   * Lança AppError caso um campo falhe.
   */
  validate() {
    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      throw new AppError('Nome é obrigatório', 'VALIDATION_ERROR');
    }
    if (!this.email || typeof this.email !== 'string' || !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw new AppError('Email inválido', 'VALIDATION_ERROR');
    }
    if (!this.password || typeof this.password !== 'string' || this.password.length < 6) {
      throw new AppError('A senha deve conter no mínimo 6 caracteres', 'VALIDATION_ERROR');
    }
  }
}
