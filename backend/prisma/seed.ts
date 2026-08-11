import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';
import {prisma} from '../src/config/db';


async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@restaurant.com';
  const plainPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Restaurant Owner',
      email,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin account ready:');
  console.log('⚠️  Change this password after first login.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });