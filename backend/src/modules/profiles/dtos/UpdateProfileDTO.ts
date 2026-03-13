import { AppError } from '../../../shared/errors/AppError';

export class UpdateProfileDTO {
  cityId?: string;
  experienceLevel?: string;

  constructor(data: any) {
    this.cityId = data.cityId;
    this.experienceLevel = data.experienceLevel;
  }

  /**
   * Valida apenas se os campos existirem. Salário não é atualizado por aqui.
   */
  validate() {
    if (this.cityId !== undefined && typeof this.cityId !== 'string') {
      throw new AppError('O campo cityId precisar ser válido', 'VALIDATION_ERROR');
    }

    if (this.experienceLevel !== undefined) {
      const validLevels = ['JUNIOR', 'PLENO', 'SENIOR', 'STAFF_PLUS'];
      if (!validLevels.includes(this.experienceLevel)) {
        throw new AppError('Nível de experiência inválido.', 'VALIDATION_ERROR');
      }
    }
  }
}
