//tasks.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CreateTaskDto } from './dto/create-task.dto';
import { Role, User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { TaskResponseDto } from './dto/task-response.dto';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>
  ) {}

  // tasks.service.ts

  async findAllForUser(jwtUser: any): Promise<TaskResponseDto[]> {
    const { organizationId, role } = jwtUser;
    let orgIds = [organizationId];

    // RULE: OWNER can see their Org + Child Orgs (Hierarchy)
    if (role === Role.OWNER) {
      const children = await this.orgRepo.find({
        where: { parent: { id: organizationId } },
      });
      orgIds = [...orgIds, ...children.map((c) => c.id)];
    }

    // Query construction
    const query: any = { organization: { id: In(orgIds) } };

    // If you wanted the OWNER to ONLY see their own tasks, you'd add:
    // if (role === Role.OWNER) query.createdBy = { id: userId };
    // But usually, Owners/Admins see the whole Org.
    // Based on your previous plan, let's keep it Org-wide for Admin/Viewer.

    const tasks = await this.taskRepo.find({
      where: query,
      relations: ['createdBy', 'organization'],
      order: { id: 'DESC' },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      createdBy: { id: task.createdBy.id, email: task.createdBy.email },
    }));
  }

  async deleteTask(taskId: number, jwtUser: any): Promise<void> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['organization', 'createdBy'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // 1. Data Isolation Check (Must be in the same Org or be a Parent Owner)
    // For simplicity, we check if the task's org is in the user's allowed list
    if (task.organization.id !== jwtUser.organizationId) {
      // Optional: Add logic here if Owner can delete tasks in child orgs
      throw new ForbiddenException(
        'You do not have access to this organization’s tasks'
      );
    }

    // 2. Permission Check
    // Admin & Owner can delete anything in their organization.
    // Viewer is already blocked by the Controller.

    await this.taskRepo.remove(task);
    console.log(
      `[AUDIT] Task ${taskId} deleted by ${jwtUser.role} ${jwtUser.userId}`
    );
  }

  async createTask(dto: CreateTaskDto, jwtUser: any): Promise<TaskResponseDto> {
    const user = await this.userRepo.findOne({
      where: { id: jwtUser.userId },
      relations: ['organization'],
    });

    if (!user) throw new Error('User not found');

    const task = await this.taskRepo.save(
      this.taskRepo.create({
        ...dto,
        completed: false,
        createdBy: user,
        organization: user.organization, // Enforce org ownership
      })
    );

    console.log(
      `[AUDIT] Task ${task.id} created by User ${user.id} for Org ${user.organization.id}`
    );

    return { ...task, createdBy: { id: user.id, email: user.email } };
  }

  //update task
  async updateTask(
    taskId: number,
    dto: any,
    jwtUser: any
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['organization', 'createdBy'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Multi-tenancy check: Ensure user belongs to the same org as the task
    if (task.organization.id !== jwtUser.organizationId) {
      throw new ForbiddenException(
        'You do not have access to modify this organization’s tasks'
      );
    }

    // Update fields
    Object.assign(task, dto);
    const updatedTask = await this.taskRepo.save(task);

    // Audit logging
    console.log(`[AUDIT] Task ${taskId} updated by User ${jwtUser.userId}`);

    return {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      completed: updatedTask.completed,
      createdBy: {
        id: updatedTask.createdBy.id,
        email: updatedTask.createdBy.email,
      },
    };
  }
}
