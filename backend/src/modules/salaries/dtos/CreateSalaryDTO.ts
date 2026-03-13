import { AppError } from '../../../shared/errors/AppError';

export class CreateSalaryDTO {
  salary!: number;

  constructor(data: any) {
    this.salary = data.salary;
  }

  validate() {
    if (this.salary === undefined || typeof this.salary !== 'number' || this.salary < 0) {
      throw new AppError('O campo salary (salário mensal bruto) é obrigatório e deve ser um número positivo', 'VALIDATION_ERROR');
    }
  }
}
