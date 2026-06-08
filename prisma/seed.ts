import prisma from '../src/shared/config/prisma';
import { env } from '../src/shared/config/env';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Iniciando semilla...');

  const adminEmail = env.ADMIN_EMAIL;
  const adminPassword = env.ADMIN_PASSWORD;
  const adminName = env.ADMIN_NAME;

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('Usuario Admin creado correctamente');
  } else {
    console.log('Usuario Admin ya existente, omitiendo semilla...');
  }
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
