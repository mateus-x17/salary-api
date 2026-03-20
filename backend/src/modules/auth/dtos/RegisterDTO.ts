import { AppError } from '../../../shared/errors/AppError';

export class RegisterDTO {
  name!: string;
  email!: string;
  password!: string;
  city!: string;
  experienceLevel!: string;
  salary!: number;
  stacks!: string[];
  role!: string;

  constructor(data: any) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.city = data.city;
    this.experienceLevel = data.experience_level || data.experienceLevel;
    this.salary = data.salary;
    this.stacks = data.stacks || [];
    this.role = data.role || 'USER';
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
    if (!this.city || typeof this.city !== 'string') {
      throw new AppError('Cidade é obrigatória', 'VALIDATION_ERROR');
    }
    if (!this.experienceLevel || !['JUNIOR', 'MID', 'SENIOR', 'LEAD'].includes(this.experienceLevel)) {
      throw new AppError('Nível de experiência inválido', 'VALIDATION_ERROR');
    }
    if (this.salary === undefined || typeof this.salary !== 'number' || this.salary < 0) {
      throw new AppError('Salário inválido', 'VALIDATION_ERROR');
    }
    if (!Array.isArray(this.stacks)) {
      throw new AppError('Stacks devem ser um array', 'VALIDATION_ERROR');
    }
  }
}
