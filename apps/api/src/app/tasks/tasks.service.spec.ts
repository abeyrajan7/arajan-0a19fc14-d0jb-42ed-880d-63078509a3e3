import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { User, Role } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { ForbiddenException } from '@nestjs/common';

describe('TasksService RBAC Logic', () => {
  let service: TasksService;
  let repo: any;

  // This sets up a "fake" database for our tests
  const mockRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Organization), useValue: {} },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repo = module.get(getRepositoryToken(Task));
  });

  it('should allow HQ Admin (Org 1) to edit a task in Org 2', async () => {
    const taskInOrg2 = {
      id: 10,
      organization: { id: 2 },
      createdBy: { id: 99 },
    };
    const hqAdmin = { userId: 1, role: Role.ADMIN, organizationId: 1 };

    repo.findOne.mockResolvedValue(taskInOrg2);
    repo.save.mockResolvedValue({ ...taskInOrg2, title: 'Updated' });

    const result = await service.updateTask(10, { title: 'Updated' }, hqAdmin);
    expect(result).toBeDefined();
  });

  it('should THROW ForbiddenException if a Branch Admin edits an Org 1 task', async () => {
    const hqTask = { id: 1, organization: { id: 1 }, createdBy: { id: 1 } };
    const branchAdmin = { userId: 5, role: Role.ADMIN, organizationId: 2 };

    repo.findOne.mockResolvedValue(hqTask);

    await expect(
      service.updateTask(1, { title: 'Hack' }, branchAdmin),
    ).rejects.toThrow(ForbiddenException);
  });
});
