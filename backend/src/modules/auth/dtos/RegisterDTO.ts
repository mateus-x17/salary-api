import { AppError } from '../../../shared/errors/AppError';

export class RegisterDTO {
  name!: string;
  email!: string;
  password!: string;

  city?: string;
  cityId?: string;

  experienceLevel!: 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF_PLUS' |'LEAD'; // padrão de experiência unificado

  salary!: number;

  // agora sempre IDs
  stacks!: string[];

  role!: 'USER' | 'ADMIN';

  constructor(data: any) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;

    this.city = data.city;
    this.cityId = data.cityId;

    // 🔥 NORMALIZAÇÃO INTELIGENTE
    const exp = data.experience_level || data.experienceLevel;
    this.experienceLevel = typeof exp === 'string' ? exp.toUpperCase() : exp;

    // 🔥 GARANTE NUMBER
    this.salary = typeof data.salary === 'string'
      ? Number(data.salary)
      : data.salary;

    this.stacks = data.stacks || [];
    this.role = data.role === 'ADMIN' ? 'ADMIN' : 'USER';
  }

  validate() {
    if (!this.name?.trim()) {
      throw new AppError('Nome é obrigatório', 'VALIDATION_ERROR');
    }

    if (!this.email || !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw new AppError('Email inválido', 'VALIDATION_ERROR');
    }

    if (!this.password || this.password.length < 6) {
      throw new AppError('Senha deve ter no mínimo 6 caracteres', 'VALIDATION_ERROR');
    }

    // AGORA ACEITA city OU cityId - pois a cidade pode ser criada no cadastro de perfil ou o usuário pode escolher uma existente (usando o id)
    if (!this.city && !this.cityId) {
      throw new AppError('Cidade ou cityId é obrigatório', 'VALIDATION_ERROR');
    }

    // validação do nível de experiência unificado
    if (!['JUNIOR', 'MID', 'SENIOR', 'STAFF_PLUS', 'LEAD'].includes(this.experienceLevel)) {
      throw new AppError('Nível de experiência inválido', 'VALIDATION_ERROR');
    } 

    if (typeof this.salary !== 'number' || isNaN(this.salary) || this.salary < 0) {
      throw new AppError('Salário inválido', 'VALIDATION_ERROR');
    }

    if (!Array.isArray(this.stacks) || this.stacks.length === 0) {
      throw new AppError('Stacks devem ser um array de IDs', 'VALIDATION_ERROR');
    }
  }
}