import { AppError } from '../../../shared/errors/AppError';

export class CreateProfileDTO {
  cityId!: string;
  experienceLevel!: string;
  salary!: number;

  constructor(data: any) {
    this.cityId = data.cityId;
    this.experienceLevel = data.experienceLevel;
    this.salary = data.salary;
  }

  /**
   * Validações básicas e do enum de experiência.
   */
  validate() {
    if (!this.cityId || typeof this.cityId !== 'string') {
      throw new AppError('O campo cityId é obrigatório', 'VALIDATION_ERROR');
    }

    const validLevels = ['JUNIOR', 'PLENO', 'SENIOR', 'STAFF_PLUS'];
    if (!this.experienceLevel || !validLevels.includes(this.experienceLevel)) {
      throw new AppError('Nível de experiência inválido. (JUNIOR, PLENO, SENIOR, STAFF_PLUS)', 'VALIDATION_ERROR');
    }

    // Salary é um número inteiro (mensal bruto)
    if (this.salary === undefined || typeof this.salary !== 'number' || this.salary < 0) {
      throw new AppError('O campo salary deve ser um número positivo', 'VALIDATION_ERROR');
    }
  }
}
