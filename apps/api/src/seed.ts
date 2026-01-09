import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Role } from './app/entities/user.entity';
import { Organization } from './app/entities/organization.entity';
import { Task } from './app/entities/task.entity';
import * as bcrypt from 'bcrypt';

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

  /* ------------------ ORGS ------------------ */

  const hqOrg = await orgRepo.save(orgRepo.create({ name: 'Turbovets HQ' }));

  const branchOrg = await orgRepo.save(
    orgRepo.create({
      name: 'Turbovets Branch Alpha',
      parent: hqOrg,
    }),
  );

  /* ------------------ USERS ------------------ */

  await userRepo.save([
    // SUPER ADMIN (GLOBAL)
    userRepo.create({
      email: 'superadmin@test.com',
      role: Role.ADMIN, // treat as super via code logic
      passwordHash,
      organization: hqOrg, // placeholder
    }),

    // HQ ADMIN
    userRepo.create({
      email: 'hq_admin@test.com',
      role: Role.ADMIN,
      passwordHash,
      organization: hqOrg,
    }),

    // BRANCH ADMIN
    userRepo.create({
      email: 'branch_admin@test.com',
      role: Role.ADMIN,
      passwordHash,
      organization: branchOrg,
    }),

    // BRANCH VIEWER
    userRepo.create({
      email: 'branch_viewer@test.com',
      role: Role.VIEWER,
      passwordHash,
      organization: branchOrg,
    }),
  ]);

  console.log('✅ Database seeded with clean RBAC + org hierarchy');
  process.exit(0);
}

seed();
