import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../entities/organization.entity';
import { Repository } from 'typeorm';
import { User, Role } from '../entities/user.entity';

import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async seed() {
    const userCount = await this.userRepo.count();
    if (userCount > 0) return;

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Organization 1 (Parent)
    const org1 = await this.orgRepo.save(
      this.orgRepo.create({ name: 'Turbovets HQ' }),
    );

    // 2. Create Organization 2 (Child of Org 1)
    const org2 = await this.orgRepo.save(
      this.orgRepo.create({
        name: 'Turbovets Branch Alpha',
        parent: org1,
      }),
    );

    // SeedService.ts snippet
    // Org 1 Users
    await this.userRepo.save([
      this.userRepo.create({
        email: 'hq_admin@test.com',
        role: Role.ADMIN,
        passwordHash,
        organization: org1,
      }),
    ]);

    // Org 2 Users
    await this.userRepo.save([
      this.userRepo.create({
        email: 'branch_owner@test.com',
        role: Role.OWNER,
        passwordHash,
        organization: org2,
      }),
      this.userRepo.create({
        email: 'branch_admin@test.com',
        role: Role.ADMIN,
        passwordHash,
        organization: org2,
      }),
      this.userRepo.create({
        email: 'branch_viewer@test.com',
        role: Role.VIEWER,
        passwordHash,
        organization: org2,
      }),
    ]);

    console.log('✅ DB Seeded via Service');
  }
}
