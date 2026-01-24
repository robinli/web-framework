import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const adminEmail = 'admin@example.com';
const adminPassword = 'admin123';
const viewerEmail = 'viewer@example.com';
const viewerPassword = 'viewer123';
const noRoleEmail = 'norole@example.com';
const noRolePassword = 'norole123';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const viewerPasswordHash = await bcrypt.hash(viewerPassword, 10);
    const noRolePasswordHash = await bcrypt.hash(noRolePassword, 10);

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { password_hash: adminPasswordHash, is_active: true },
      create: {
        email: adminEmail,
        password_hash: adminPasswordHash,
        is_active: true,
      },
    });

    const viewerUser = await prisma.user.upsert({
      where: { email: viewerEmail },
      update: { password_hash: viewerPasswordHash, is_active: true },
      create: {
        email: viewerEmail,
        password_hash: viewerPasswordHash,
        is_active: true,
      },
    });

    await prisma.user.upsert({
      where: { email: noRoleEmail },
      update: { password_hash: noRolePasswordHash, is_active: true },
      create: {
        email: noRoleEmail,
        password_hash: noRolePasswordHash,
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('login succeeds with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
  });

  it('login fails with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'wrong' })
      .expect(401);
  });

  it('me returns user data with token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const { accessToken } = loginResponse.body;

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meResponse.body.email).toBe(adminEmail);
    expect(Array.isArray(meResponse.body.roles)).toBe(true);
    expect(Array.isArray(meResponse.body.permissions)).toBe(true);
  });

  it('me fails without token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('protected API allows admin', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const { accessToken } = loginResponse.body;

    await request(app.getHttpServer())
      .get('/api/protected/example')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('protected API allows viewer with user.read', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: viewerEmail, password: viewerPassword })
      .expect(200);

    const { accessToken } = loginResponse.body;

    await request(app.getHttpServer())
      .get('/api/protected/example')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('protected API forbids user without permissions', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: noRoleEmail, password: noRolePassword })
      .expect(200);

    const { accessToken } = loginResponse.body;

    await request(app.getHttpServer())
      .get('/api/protected/example')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('protected API fails without token', async () => {
    await request(app.getHttpServer()).get('/api/protected/example').expect(401);
  });
});
