import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed no banco de dados...');

  // 1. Cria usuário Admin
  const adminEmail = 'admin@system.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log('Admin criado com sucesso.');
  } else {
    console.log('Admin já existe.');
  }

  // 2. Cria Stacks iniciais
  const stacks = ['Node.js', 'TypeScript', 'React', 'Angular', 'Vue', 'Python', 'Go', 'Rust', 'Java', 'C#', 'PHP'];

  for (const stackName of stacks) {
    await prisma.stack.upsert({
      where: { name: stackName },
      update: {},
      create: { name: stackName },
    });
  }
  console.log('Stacks de tecnologia criadas.');

  // 3. Cria Cidades iniciais
  const cities = [
    { name: 'São Paulo', state: 'SP', country: 'Brasil' },
    { name: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
    { name: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
    { name: 'Curitiba', state: 'PR', country: 'Brasil' },
    { name: 'Porto Alegre', state: 'RS', country: 'Brasil' },
    { name: 'Florianópolis', state: 'SC', country: 'Brasil' },
    { name: 'Recife', state: 'PE', country: 'Brasil' },
    { name: 'Fortaleza', state: 'CE', country: 'Brasil' },
  ];

  for (const city of cities) {
    // Busca por nome
    const exists = await prisma.city.findFirst({ where: { name: city.name } });
    if (!exists) {
      await prisma.city.create({ data: city });
    }
  }
  console.log('Cidades iniciais criadas.');

  // 4. Cria Materialized Views (Tratando como idempotentes ao dropar antes se existir)
  console.log('Criando Materialized Views para o Analytics...');

  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_global;`);
  await prisma.$executeRawUnsafe(`
    CREATE MATERIALIZED VIEW mv_salary_global AS
    SELECT 
      AVG(s.salary) AS average_salary,
      NOW() AS updated_at
    FROM salary_history s
    INNER JOIN (
      SELECT profile_id, MAX(created_at) as max_date
      FROM salary_history
      GROUP BY profile_id
    ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date;
  `);

  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_by_stack;`);
  await prisma.$executeRawUnsafe(`
    CREATE MATERIALIZED VIEW mv_salary_by_stack AS
    SELECT 
      ps.stack_id,
      AVG(s.salary) AS average_salary,
      COUNT(DISTINCT s.profile_id) AS total_records,
      NOW() AS updated_at
    FROM salary_history s
    INNER JOIN (
      SELECT profile_id, MAX(created_at) as max_date
      FROM salary_history
      GROUP BY profile_id
    ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
    JOIN profile_stacks ps ON ps.profile_id = s.profile_id
    GROUP BY ps.stack_id;
  `);

  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_by_city;`);
  await prisma.$executeRawUnsafe(`
    CREATE MATERIALIZED VIEW mv_salary_by_city AS
    SELECT 
      p.city_id,
      AVG(s.salary) AS average_salary,
      COUNT(DISTINCT s.profile_id) AS total_records,
      NOW() AS updated_at
    FROM salary_history s
    INNER JOIN (
      SELECT profile_id, MAX(created_at) as max_date
      FROM salary_history
      GROUP BY profile_id
    ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
    JOIN professional_profiles p ON p.id = s.profile_id
    GROUP BY p.city_id;
  `);

  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_filtered;`);
  await prisma.$executeRawUnsafe(`
    CREATE MATERIALIZED VIEW mv_salary_filtered AS
    SELECT 
      ps.stack_id,
      p.city_id,
      p.experience_level,
      AVG(s.salary) AS average_salary,
      COUNT(DISTINCT s.profile_id) AS total_records
    FROM salary_history s
    INNER JOIN (
      SELECT profile_id, MAX(created_at) as max_date
      FROM salary_history
      GROUP BY profile_id
    ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
    JOIN professional_profiles p ON p.id = s.profile_id
    JOIN profile_stacks ps ON ps.profile_id = p.id
    GROUP BY ps.stack_id, p.city_id, p.experience_level;
  `);

  console.log('Materialized Views criadas com sucesso!');
  console.log('Seed completo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
