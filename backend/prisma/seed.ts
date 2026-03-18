// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('Iniciando o seed no banco de dados...');

//   // 1. Cria usuário Admin
//   const adminEmail = 'admin@system.com';
//   const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

//   if (!existingAdmin) {
//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash('admin123', salt);

//     await prisma.user.create({
//       data: {
//         name: 'Administrador',
//         email: adminEmail,
//         passwordHash,
//         role: 'ADMIN',
//       },
//     });
//     console.log('Admin criado com sucesso.');
//   } else {
//     console.log('Admin já existe.');
//   }

//   // 2. Cria Stacks iniciais
//   const stacks = ['Node.js', 'TypeScript', 'React', 'Angular', 'Vue', 'Python', 'Go', 'Rust', 'Java', 'C#', 'PHP'];

//   for (const stackName of stacks) {
//     await prisma.stack.upsert({
//       where: { name: stackName },
//       update: {},
//       create: { name: stackName },
//     });
//   }
//   console.log('Stacks de tecnologia criadas.');

//   // 3. Cria Cidades iniciais
//   const cities = [
//     { name: 'São Paulo', state: 'SP', country: 'Brasil' },
//     { name: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
//     { name: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
//     { name: 'Curitiba', state: 'PR', country: 'Brasil' },
//     { name: 'Porto Alegre', state: 'RS', country: 'Brasil' },
//     { name: 'Florianópolis', state: 'SC', country: 'Brasil' },
//     { name: 'Recife', state: 'PE', country: 'Brasil' },
//     { name: 'Fortaleza', state: 'CE', country: 'Brasil' },
//   ];

//   for (const city of cities) {
//     // Busca por nome
//     const exists = await prisma.city.findFirst({ where: { name: city.name } });
//     if (!exists) {
//       await prisma.city.create({ data: city });
//     }
//   }
//   console.log('Cidades iniciais criadas.');

//   // 4. Cria Materialized Views (Tratando como idempotentes ao dropar antes se existir)
//   console.log('Criando Materialized Views para o Analytics...');

//   await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_global;`);
//   await prisma.$executeRawUnsafe(`
//     CREATE MATERIALIZED VIEW mv_salary_global AS
//     SELECT 
//       AVG(s.salary) AS average_salary,
//       NOW() AS updated_at
//     FROM salary_history s
//     INNER JOIN (
//       SELECT profile_id, MAX(created_at) as max_date
//       FROM salary_history
//       GROUP BY profile_id
//     ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date;
//   `);

//   await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_by_stack;`);
//   await prisma.$executeRawUnsafe(`
//     CREATE MATERIALIZED VIEW mv_salary_by_stack AS
//     SELECT 
//       ps.stack_id,
//       AVG(s.salary) AS average_salary,
//       COUNT(DISTINCT s.profile_id) AS total_records,
//       NOW() AS updated_at
//     FROM salary_history s
//     INNER JOIN (
//       SELECT profile_id, MAX(created_at) as max_date
//       FROM salary_history
//       GROUP BY profile_id
//     ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
//     JOIN profile_stacks ps ON ps.profile_id = s.profile_id
//     GROUP BY ps.stack_id;
//   `);

//   await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_by_city;`);
//   await prisma.$executeRawUnsafe(`
//     CREATE MATERIALIZED VIEW mv_salary_by_city AS
//     SELECT 
//       p.city_id,
//       AVG(s.salary) AS average_salary,
//       COUNT(DISTINCT s.profile_id) AS total_records,
//       NOW() AS updated_at
//     FROM salary_history s
//     INNER JOIN (
//       SELECT profile_id, MAX(created_at) as max_date
//       FROM salary_history
//       GROUP BY profile_id
//     ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
//     JOIN professional_profiles p ON p.id = s.profile_id
//     GROUP BY p.city_id;
//   `);

//   await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS mv_salary_filtered;`);
//   await prisma.$executeRawUnsafe(`
//     CREATE MATERIALIZED VIEW mv_salary_filtered AS
//     SELECT 
//       ps.stack_id,
//       p.city_id,
//       p.experience_level,
//       AVG(s.salary) AS average_salary,
//       COUNT(DISTINCT s.profile_id) AS total_records
//     FROM salary_history s
//     INNER JOIN (
//       SELECT profile_id, MAX(created_at) as max_date
//       FROM salary_history
//       GROUP BY profile_id
//     ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
//     JOIN professional_profiles p ON p.id = s.profile_id
//     JOIN profile_stacks ps ON ps.profile_id = p.id
//     GROUP BY ps.stack_id, p.city_id, p.experience_level;
//   `);

//   console.log('Materialized Views criadas com sucesso!');
//   console.log('Seed completo.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });






////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//seed mais completo
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function getRandomItems<T>(array: T[], min: number, max: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return shuffled.slice(0, count);
}

async function main() {
  console.log('🌱 Iniciando seed...');

  const DEFAULT_PASSWORD = '123456';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  // ======================
  // 1. USERS
  // ======================
  const usersData = [
    { name: 'Administrador', email: 'admin@system.com', role: 'ADMIN' },
    { name: 'João Silva', email: 'joao@test.com', role: 'USER' },
    { name: 'Maria Souza', email: 'maria@test.com', role: 'USER' },
    { name: 'Carlos Lima', email: 'carlos@test.com', role: 'USER' },
  ];

  const users = [];

  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash,
      },
    });

    users.push(user);
  }

  console.log('👤 Users criados');

  // ======================
  // 2. STACKS (todas)
  // ======================
  const stacksNames = [
    'Node.js',
    'TypeScript',
    'React',
    'Angular',
    'Vue',
    'Python',
    'Go',
    'Rust',
    'Java',
    'C#',
    'PHP',
  ];

  const stacks = [];

  for (const name of stacksNames) {
    const stack = await prisma.stack.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    stacks.push(stack);
  }

  console.log('🧩 Todas as stacks criadas');

  // ======================
  // 3. CITIES (todas)
  // ======================
  const citiesData = [
    { name: 'São Paulo', state: 'SP', country: 'Brasil' },
    { name: 'Rio de Janeiro', state: 'RJ', country: 'Brasil' },
    { name: 'Belo Horizonte', state: 'MG', country: 'Brasil' },
    { name: 'Curitiba', state: 'PR', country: 'Brasil' },
    { name: 'Porto Alegre', state: 'RS', country: 'Brasil' },
    { name: 'Florianópolis', state: 'SC', country: 'Brasil' },
    { name: 'Recife', state: 'PE', country: 'Brasil' },
    { name: 'Fortaleza', state: 'CE', country: 'Brasil' },
  ];

  const cities = [];

  for (const cityData of citiesData) {
    let city = await prisma.city.findFirst({
      where: { name: cityData.name },
    });

    if (!city) {
      city = await prisma.city.create({ data: cityData });
    }

    cities.push(city);
  }

  console.log('🌍 Todas as cidades criadas');

  // ======================
  // 4. PROFILES
  // ======================
  const experienceLevels = ['JUNIOR', 'MID', 'SENIOR'];
  const profiles = [];

  for (let i = 1; i < users.length; i++) {
    const user = users[i];

    const randomCity = cities[Math.floor(Math.random() * cities.length)];

    const profile = await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        cityId: randomCity.id,
        experienceLevel: experienceLevels[i - 1],
      },
    });

    profiles.push(profile);
  }

  console.log('💼 Profiles criados');

  // ======================
  // 5. PROFILE STACKS (distribuição realista)
  // ======================
  for (const profile of profiles) {
    const selectedStacks = getRandomItems(stacks, 2, 3);

    for (const stack of selectedStacks) {
      await prisma.profileStack.create({
        data: {
          profileId: profile.id,
          stackId: stack.id,
        },
      });
    }
  }

  console.log('🔗 Stacks distribuídas de forma realista');

  // ======================
  // 6. SALARY HISTORY
  // ======================
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];

    const baseSalary = 2000 + i * 2500;

    for (let j = 0; j < 3; j++) {
      await prisma.salaryHistory.create({
        data: {
          profileId: profile.id,
          salary: baseSalary + j * 1200,
          createdAt: new Date(
            Date.now() - (3 - j) * 30 * 24 * 60 * 60 * 1000
          ),
        },
      });
    }
  }

  console.log('💰 Salary history criado');

  // ======================
  // 7. REFRESH MATERIALIZED VIEWS
  // ======================
  console.log('🔄 Atualizando materialized views...');

  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_global;`);
  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_by_stack;`);
  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_by_city;`);
  await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW mv_salary_filtered;`);

  console.log('📊 Views atualizadas');

  console.log('✅ Seed finalizado!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
