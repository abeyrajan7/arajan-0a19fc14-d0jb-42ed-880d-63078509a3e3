import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Role } from './app/entities/user.entity';
import { Organization } from './app/entities/organization.entity';
import * as bcrypt from 'bcrypt';
import { Task } from './app/entities/task.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',
  entities: [User, Organization, Task],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const orgRepo = AppDataSource.getRepository(Organization);
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Organization 1 (Parent)
  const org1 = await orgRepo.save(orgRepo.create({ name: 'Turbovets HQ' }));

  // 2. Create Organization 2 (Child of Org 1)
  // This satisfies the "2-level hierarchy" requirement [cite: 24]
  const org2 = await orgRepo.save(
    orgRepo.create({
      name: 'Turbovets Branch Alpha',
      parent: org1,
    })
  );

  // 3. Seed Users for Org 1
  await userRepo.save([
    userRepo.create({
      email: 'hq_owner@test.com',
      role: Role.OWNER,
      passwordHash,
      organization: org1,
    }),
    userRepo.create({
      email: 'hq_admin@test.com',
      role: Role.ADMIN,
      passwordHash,
      organization: org1,
    }),
  ]);

  // 4. Seed Users for Org 2
  await userRepo.save([
    userRepo.create({
      email: 'branch_admin@test.com',
      role: Role.ADMIN,
      passwordHash,
      organization: org2,
    }),
    userRepo.create({
      email: 'branch_viewer@test.com',
      role: Role.VIEWER,
      passwordHash,
      organization: org2,
    }),
  ]);

  console.log('✅ Database seeded with 2-level hierarchy');
  process.exit(0);
}

seed();
