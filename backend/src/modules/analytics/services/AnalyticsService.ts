import { prisma } from '../../../config/database';

export class AnalyticsService {
  /**
   * RN-10, RN-11: Média salarial global.
   */
  async getGlobalSalary() {
    const result: any[] = await prisma.$queryRawUnsafe(`SELECT average_salary FROM mv_salary_global LIMIT 1;`);
    return {
      averageSalary: result.length > 0 ? Number(result[0].average_salary) : 0,
    };
  }

  /**
   * RN-12: Média salarial por stack
   */
  async getSalaryByStack(stackId: string) {
    const stack = await prisma.stack.findUnique({ where: { id: stackId } });
    if (!stack) return null;

    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT average_salary, total_records FROM mv_salary_by_stack WHERE stack_id = $1 LIMIT 1;`,
      stackId
    );

    return {
      stack: stack.name,
      averageSalary: result.length > 0 ? Number(result[0].average_salary) : 0,
      totalRecords: result.length > 0 ? Number(result[0].total_records) : 0,
    };
  }

  /**
   * RN-14: Média salarial por cidade
   */
  async getSalaryByCity(cityId: string) {
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) return null;

    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT average_salary, total_records FROM mv_salary_by_city WHERE city_id = $1 LIMIT 1;`,
      cityId
    );

    return {
      city: city.name,
      averageSalary: result.length > 0 ? Number(result[0].average_salary) : 0,
      totalRecords: result.length > 0 ? Number(result[0].total_records) : 0,
    };
  }

  /**
   * RN-15: Filtros combinados.
   */
  async getFilteredSalary(filters: { stackId?: string; cityId?: string; experienceLevel?: string }) {
    let query = `SELECT AVG(average_salary) as average_salary, SUM(total_records) as total_records FROM mv_salary_filtered WHERE 1=1 `;
    const params: any[] = [];

    if (filters.stackId) {
      params.push(filters.stackId);
      query += ` AND stack_id = $${params.length} `;
    }
    if (filters.cityId) {
      params.push(filters.cityId);
      query += ` AND city_id = $${params.length} `;
    }
    if (filters.experienceLevel) {
      params.push(filters.experienceLevel);
      query += ` AND experience_level = $${params.length} `;
    }

    const result: any[] = await prisma.$queryRawUnsafe(query, ...params);

    return {
      averageSalary: result.length > 0 && result[0].average_salary !== null ? Number(result[0].average_salary) : 0,
      totalRecords: result.length > 0 && result[0].total_records !== null ? Number(result[0].total_records) : 0,
    };
  }

  /**
   * RN-16: Ranking de stacks. Stacks com >= 5 registros.
   */
  async getStacksRanking() {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT s.name as stack, mv.average_salary, mv.total_records 
      FROM mv_salary_by_stack mv
      JOIN stacks s ON s.id = mv.stack_id
      WHERE mv.total_records >= 5
      ORDER BY mv.average_salary DESC;
    `);

    return result.map(row => ({
      stack: row.stack,
      averageSalary: Number(row.average_salary),
      totalRecords: Number(row.total_records),
    }));
  }
}
