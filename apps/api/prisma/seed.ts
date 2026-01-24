import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@example.com';
  const viewerEmail = 'viewer@example.com';
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const viewerPasswordHash = await bcrypt.hash('viewer123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password_hash: adminPasswordHash,
      is_active: true,
    },
    create: {
      email: adminEmail,
      password_hash: adminPasswordHash,
      is_active: true,
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: viewerEmail },
    update: {
      password_hash: viewerPasswordHash,
      is_active: true,
    },
    create: {
      email: viewerEmail,
      password_hash: viewerPasswordHash,
      is_active: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: { name: 'Administrator' },
    create: { code: 'admin', name: 'Administrator' },
  });

  const viewerRole = await prisma.role.upsert({
    where: { code: 'viewer' },
    update: { name: 'Viewer' },
    create: { code: 'viewer', name: 'Viewer' },
  });

  const permissions = [
    { key: 'user.read', description: 'Read user data' },
    { key: 'menu.read', description: 'Read menu data' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  const allPermissions = await prisma.permission.findMany({
    select: { id: true, key: true },
  });

  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      role_id: adminRole.id,
      permission_id: permission.id,
    })),
    skipDuplicates: true,
  });

  const viewerPermission = allPermissions.find(
    (permission) => permission.key === 'user.read',
  );
  if (viewerPermission) {
    await prisma.rolePermission.createMany({
      data: [
        {
          role_id: viewerRole.id,
          permission_id: viewerPermission.id,
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.userRole.createMany({
    data: [
      { user_id: adminUser.id, role_id: adminRole.id },
      { user_id: viewerUser.id, role_id: viewerRole.id },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
