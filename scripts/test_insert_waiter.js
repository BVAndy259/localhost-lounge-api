const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$queryRaw`INSERT INTO "waiters" (name, phone_number, active) VALUES (${"ScriptTest"}, ${"+51987654321"}, true) RETURNING *`;
    console.log('Inserted:', res);
  } catch (err) {
    console.error('Error inserting via $queryRaw:', err);
  } finally {
    await prisma.$disconnect();
  }
})();