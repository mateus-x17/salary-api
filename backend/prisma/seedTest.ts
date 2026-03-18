//seed para testar materialized views
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  console.log('Testando materialized view mv_salary_global...');
  const result = await prisma.$queryRawUnsafe(`
    SELECT * FROM mv_salary_global;
  `);

  console.log(result);

  console.log('Testando materialized view mv_salary_by_stack...');
  const result2 = await prisma.$queryRawUnsafe(`
    SELECT * FROM mv_salary_by_stack;
  `);

  console.log(result2);

  console.log('Testando materialized view mv_salary_by_city...');
  const result3 = await prisma.$queryRawUnsafe(`
    SELECT * FROM mv_salary_by_city;
  `);

  console.log(result3);

  console.log('Testando materialized view mv_salary_filtered...');
  const result4 = await prisma.$queryRawUnsafe(`
    SELECT * FROM mv_salary_filtered;
  `);

  console.log(result4);
};

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
