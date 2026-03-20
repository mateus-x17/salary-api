import { AppError } from '../../../shared/errors/AppError';

export class UpdateProfileDTO {
  name?: string;
  email?: string;
  password?: string;
  city?: string;
  experienceLevel?: string;
  salary?: number;
  stacks?: string[];

  constructor(data: any) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.city = data.city;
    this.experienceLevel = data.experienceLevel;
    this.salary = data.salary;
    this.stacks = data.stacks;
  }

  /**
   * Valida os campos da atualização de perfil do usuário comum.
   */
  validate() {
    if (this.experienceLevel !== undefined) {
      const validLevels = ['JUNIOR', 'MID', 'PLENO', 'SENIOR', 'STAFF_PLUS', 'LEAD'];
      if (!validLevels.includes(this.experienceLevel)) {
        throw new AppError('Nível de experiência inválido.', 'VALIDATION_ERROR');
      }
    }
  }
}
