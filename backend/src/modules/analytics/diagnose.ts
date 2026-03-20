import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQueries() {
  console.log('=== DIAGNÓSTICO ANALYTICS FILTER ===\n');

  // Teste 1: Verifica se as tabelas existem
  try {
    const tables: any[] = await prisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    console.log('✅ Tabelas encontradas:');
    tables.forEach(t => console.log('  -', t.table_name));
  } catch (e: any) {
    console.error('❌ Erro listando tabelas:', e.message);
  }

  // Teste 2: Conta registros em salary_history
  try {
    const count: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM salary_history;`);
    console.log('\n✅ salary_history count:', count[0].count);
  } catch (e: any) {
    console.error('❌ Erro em salary_history:', e.message);
  }

  // Teste 3: Query do filtro por stack SEM CAST
  try {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        AVG(s.salary) AS average_salary,
        COUNT(DISTINCT p.id) AS total_records
      FROM salary_history s
      INNER JOIN (
        SELECT profile_id, MAX(created_at) AS max_date
        FROM salary_history GROUP BY profile_id
      ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
      JOIN professional_profiles p ON p.id = s.profile_id
      WHERE EXISTS (
        SELECT 1 FROM profile_stacks ps WHERE ps.profile_id = p.id AND ps.stack_id = $1
      )
    `, 'f09f4bc3-1fd9-4b15-b0fb-3ee11043be87');
    console.log('\n✅ Query por stack (sem cast):', JSON.stringify(result));
  } catch (e: any) {
    console.error('\n❌ Erro na query por stack (sem cast):', e.message);
  }

  // Teste 4: Query com CAST ::float
  try {
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT
        AVG(s.salary)::float AS average_salary,
        COUNT(DISTINCT p.id)::int AS total_records
      FROM salary_history s
      INNER JOIN (
        SELECT profile_id, MAX(created_at) AS max_date
        FROM salary_history GROUP BY profile_id
      ) latest ON s.profile_id = latest.profile_id AND s.created_at = latest.max_date
      JOIN professional_profiles p ON p.id = s.profile_id
      WHERE EXISTS (
        SELECT 1 FROM profile_stacks ps WHERE ps.profile_id = p.id AND ps.stack_id = $1::uuid
      )
    `, 'f09f4bc3-1fd9-4b15-b0fb-3ee11043be87');
    console.log('\n✅ Query por stack (com ::uuid cast):', JSON.stringify(result));
  } catch (e: any) {
    console.error('\n❌ Erro na query por stack (com ::uuid):', e.message);
  }

  // Teste 5: Listar stacks disponíveis
  try {
    const stacks: any[] = await prisma.$queryRawUnsafe(`SELECT id, name FROM stacks LIMIT 5;`);
    console.log('\n✅ Stacks disponíveis (primeiras 5):');
    stacks.forEach(s => console.log(`  id=${s.id} name=${s.name}`));
  } catch (e: any) {
    console.error('❌ Erro listando stacks:', e.message);
  }

  await prisma.$disconnect();
}

testQueries().catch(console.error);
