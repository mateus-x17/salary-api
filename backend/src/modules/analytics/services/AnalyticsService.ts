import { prisma } from '../../../config/database';

/**
 * @file AnalyticsService.ts
 * @description Serviço de analytics com queries diretas e robustas.
 * Usa SQL cru para maximizar flexibilidade com as Materialized Views.
 *
 * RN-10, RN-11: Média salarial global e filtrada.
 * RN-12: Média por stack.
 * RN-14: Média por cidade.
 * RN-15: Filtros combinados.
 * RN-16: Rankings de stacks e cidades.
 */

// Helper: converte BigInt/Decimal do Postgres para number JS
function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return Number(v);
}

export class AnalyticsService {
  /**
   * RN-10, RN-11: Média salarial global.
   */
  async getGlobalSalary() {
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT average_salary FROM mv_salary_global LIMIT 1;`
    );
    return {
      averageSalary: result.length > 0 ? toNum(result[0].average_salary) : 0,
    };
  }

  /**
   * RN-12: Média salarial por stack (usa a view mv_salary_by_stack).
   */
  async getSalaryByStack(stackId: string) {
    const stack = await prisma.stack.findUnique({ where: { id: stackId } });
    if (!stack) return null;

    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT average_salary, total_records FROM mv_salary_by_stack WHERE stack_id = $1::uuid LIMIT 1;`,
      stackId
    );

    return {
      stack: stack.name,
      averageSalary: result.length > 0 ? toNum(result[0].average_salary) : 0,
      totalRecords: result.length > 0 ? toNum(result[0].total_records) : 0,
    };
  }

  /**
   * RN-14: Média salarial por cidade (usa a view mv_salary_by_city).
   */
  async getSalaryByCity(cityId: string) {
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) return null;

    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT average_salary, total_records FROM mv_salary_by_city WHERE city_id = $1::uuid LIMIT 1;`,
      cityId
    );

    return {
      city: city.name,
      averageSalary: result.length > 0 ? toNum(result[0].average_salary) : 0,
      totalRecords: result.length > 0 ? toNum(result[0].total_records) : 0,
    };
  }

  /**
   * RN-15: Filtros combinados.
   * Usa query direta nas tabelas para suportar qualquer combinação de filtros,
   * evitando problemas de cast com a Materialized View mv_salary_filtered.
   */
  async getFilteredSalary(filters: {
    stackId?: string;
    cityId?: string;
    experienceLevel?: string;
  }) {
    // Sem filtros: retorna global
    if (!filters.stackId && !filters.cityId && !filters.experienceLevel) {
      return this.getGlobalSalary().then(r => ({ ...r, totalRecords: 0 }));
    }

    // Query robusta direta nas tabelas (sem a MV filtered, que exige 3 campos)
    let query = `
      SELECT
        AVG(s.salary)::float               AS average_salary,
        COUNT(DISTINCT p.id)::int           AS total_records
      FROM salary_history s
      INNER JOIN (
        SELECT profile_id, MAX(created_at) AS max_date
        FROM salary_history
        GROUP BY profile_id
      ) latest
        ON s.profile_id = latest.profile_id
       AND s.created_at = latest.max_date
      JOIN professional_profiles p ON p.id = s.profile_id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.stackId) {
      params.push(filters.stackId);
      conditions.push(`EXISTS (
        SELECT 1 FROM profile_stacks ps
        WHERE ps.profile_id = p.id AND ps.stack_id = $${params.length}::uuid
      )`);
    }

    if (filters.cityId) {
      params.push(filters.cityId);
      conditions.push(`p.city_id = $${params.length}::uuid`);
    }

    if (filters.experienceLevel) {
      params.push(filters.experienceLevel);
      conditions.push(`p.experience_level = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result: any[] = await prisma.$queryRawUnsafe(query, ...params);

    return {
      averageSalary: result.length > 0 && result[0].average_salary !== null
        ? toNum(result[0].average_salary)
        : 0,
      totalRecords: result.length > 0 && result[0].total_records !== null
        ? toNum(result[0].total_records)
        : 0,
    };
  }

  /**
   * Dados granulares para gráficos filtrados por experienceLevel.
   * Retorna média salarial por stack naquele nível.
   */
  async getSalaryByStackAndLevel(experienceLevel?: string) {
    const params: any[] = [];
    let where = '';
    if (experienceLevel) {
      params.push(experienceLevel);
      where = `WHERE p.experience_level = $1`;
    }

    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        st.name                               AS stack,
        AVG(s.salary)::float                  AS average_salary,
        COUNT(DISTINCT p.id)::int             AS total_records
      FROM salary_history s
      INNER JOIN (
        SELECT profile_id, MAX(created_at) AS max_date
        FROM salary_history GROUP BY profile_id
      ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
      JOIN professional_profiles p ON p.id = s.profile_id
      JOIN profile_stacks ps ON ps.profile_id = p.id
      JOIN stacks st ON st.id = ps.stack_id
      ${where}
      GROUP BY st.name
      ORDER BY average_salary DESC;
    `, ...params);

    return result.map(r => ({
      stack: r.stack,
      averageSalary: toNum(r.average_salary),
      totalRecords: toNum(r.total_records),
    }));
  }

  /**
   * Dados granulares: média salarial por stack filtrado por cidade.
   */
  async getSalaryByStackAndCity(cityId?: string) {
    const params: any[] = [];
    let where = '';
    if (cityId) {
      params.push(cityId);
      where = `WHERE p.city_id = $1::uuid`;
    }

    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        st.name                               AS stack,
        AVG(s.salary)::float                  AS average_salary,
        COUNT(DISTINCT p.id)::int             AS total_records
      FROM salary_history s
      INNER JOIN (
        SELECT profile_id, MAX(created_at) AS max_date
        FROM salary_history GROUP BY profile_id
      ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
      JOIN professional_profiles p ON p.id = s.profile_id
      JOIN profile_stacks ps ON ps.profile_id = p.id
      JOIN stacks st ON st.id = ps.stack_id
      ${where}
      GROUP BY st.name
      ORDER BY average_salary DESC;
    `, ...params);

    return result.map(r => ({
      stack: r.stack,
      averageSalary: toNum(r.average_salary),
      totalRecords: toNum(r.total_records),
    }));
  }

  /**
   * Dados granulares: média salarial por nível de experiência filtrado por stack.
   */
  async getSalaryByLevelAndStack(stackId?: string) {
    const params: any[] = [];
    let where = '';
    if (stackId) {
      params.push(stackId);
      where = `WHERE EXISTS (SELECT 1 FROM profile_stacks ps2 WHERE ps2.profile_id = p.id AND ps2.stack_id = $1::uuid)`;
    }

    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        p.experience_level                    AS experience_level,
        AVG(s.salary)::float                  AS average_salary,
        COUNT(DISTINCT p.id)::int             AS total_records
      FROM salary_history s
      INNER JOIN (
        SELECT profile_id, MAX(created_at) AS max_date
        FROM salary_history GROUP BY profile_id
      ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
      JOIN professional_profiles p ON p.id = s.profile_id
      ${where}
      GROUP BY p.experience_level
      ORDER BY average_salary DESC;
    `, ...params);

    const levelLabel: Record<string, string> = {
      JUNIOR: 'Júnior',
      MID: 'Pleno',
      SENIOR: 'Sênior',
      STAFF_PLUS: 'Staff+',
      LEAD: 'Lead',
    };

    return result.map(r => ({
      experienceLevel: r.experience_level,
      label: levelLabel[r.experience_level] || r.experience_level,
      averageSalary: toNum(r.average_salary),
      totalRecords: toNum(r.total_records),
    }));
  }

  /**
   * RN-16: Ranking de stacks (usa a view mv_salary_by_stack).
   */
  async getStacksRanking() {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT s.name AS stack, mv.average_salary, mv.total_records
      FROM mv_salary_by_stack mv
      JOIN stacks s ON s.id = mv.stack_id
      ORDER BY mv.average_salary DESC;
    `);

    return result.map(row => ({
      stack: row.stack,
      averageSalary: toNum(row.average_salary),
      totalRecords: toNum(row.total_records),
    }));
  }

  /**
   * Cidades acima da média global.
   */
  async getCitiesAboveGlobal() {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT c.name AS city, mv.average_salary, mv.total_records
      FROM mv_salary_by_city mv
      JOIN cities c ON c.id = mv.city_id
      WHERE mv.total_records >= 1
        AND mv.average_salary > (SELECT COALESCE(average_salary, 0) FROM mv_salary_global LIMIT 1)
      ORDER BY mv.average_salary DESC;
    `);
    return result.map(row => ({
      city: row.city,
      averageSalary: toNum(row.average_salary),
      totalRecords: toNum(row.total_records),
    }));
  }

  /**
   * Cidades abaixo da média global.
   */
  async getCitiesBelowGlobal() {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT c.name AS city, mv.average_salary, mv.total_records
      FROM mv_salary_by_city mv
      JOIN cities c ON c.id = mv.city_id
      WHERE mv.total_records >= 1
        AND mv.average_salary < (SELECT COALESCE(average_salary, 0) FROM mv_salary_global LIMIT 1)
      ORDER BY mv.average_salary ASC;
    `);
    return result.map(row => ({
      city: row.city,
      averageSalary: toNum(row.average_salary),
      totalRecords: toNum(row.total_records),
    }));
  }
}
