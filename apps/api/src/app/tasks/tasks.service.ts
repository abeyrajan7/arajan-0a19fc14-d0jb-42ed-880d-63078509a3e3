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
    private readonly orgRepo: Repository<Organization>,
  ) {}

  // tasks.service.ts
  async findAllForUser(jwtUser: any): Promise<TaskResponseDto[]> {
    const { organizationId, role, userId } = jwtUser;
    let query: any = {};

    // FIX 1: HQ Admin (Org 1 Admin) can see EVERYTHING (his + branch admin + branch owner)
    if (role === Role.ADMIN && organizationId === 1) {
      query = {}; // Global view
    }
    // FIX 2: Branch Admin (Org 2+) can see all tasks in their organization
    else if (role === Role.ADMIN || role === Role.VIEWER) {
      query = { organization: { id: organizationId } };
    }
    // FIX 3: Owner should only see their OWN tasks (not the admin's tasks)
    else if (role === Role.OWNER) {
      query = { createdBy: { id: userId } };
    }

    const tasks = await this.taskRepo.find({
      where: query,
      relations: ['createdBy', 'organization'],
      order: { priority: 'ASC' },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      organizationId: task.organization?.id,
      createdBy: { id: task.createdBy.id, email: task.createdBy.email },
    }));
  }

  async deleteTask(taskId: number, jwtUser: any): Promise<void> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['organization', 'createdBy'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Check if user is Super Admin (Org 1 Admin)
    const isSuperAdmin =
      jwtUser.role === Role.ADMIN && jwtUser.organizationId === 1;
    // Check if user is Branch Admin of the SAME Org
    const isBranchAdmin =
      jwtUser.role === Role.ADMIN &&
      task.organization.id === jwtUser.organizationId;
    // Check if user is the original creator
    const isOwner = task.createdBy.id === jwtUser.userId;

    // RULE: Allow if Super Admin OR (Branch Admin of same Org) OR (Owner of task)
    if (!isSuperAdmin && !isBranchAdmin && !isOwner) {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    await this.taskRepo.remove(task);
  }

  // Apply the same logic to the updateTask method

  async createTask(dto: CreateTaskDto, jwtUser: any): Promise<TaskResponseDto> {
    const user = await this.userRepo.findOne({
      where: { id: jwtUser.userId },
      relations: ['organization'],
    });

    if (!user) throw new Error('User not found');
    const maxPriorityTask = await this.taskRepo.findOne({
      where: { organization: { id: user.organization.id } },
      order: { priority: 'DESC' },
    });
    const nextPriority = maxPriorityTask ? maxPriorityTask.priority + 1 : 1;
    const task = await this.taskRepo.save(
      this.taskRepo.create({
        ...dto,
        priority: nextPriority,
        completed: false,
        createdBy: user,
        organization: user.organization, // Enforce org ownership
      }),
    );

    console.log(
      `[AUDIT] Task ${task.id} created by User ${user.id} for Org ${user.organization.id}`,
    );

    return {
      ...task,
      organizationId: user.organization?.id,
      createdBy: { id: user.id, email: user.email },
    };
  }

  //reorder method
  async reorderTasks(taskIds: number[], jwtUser: any): Promise<void> {
    // Only HQ Admin (Org 1) can reorder globally
    if (jwtUser.role !== Role.ADMIN || jwtUser.organizationId !== 1) {
      throw new ForbiddenException('Only HQ Admin can reorder tasks');
    }

    // Update priorities based on the array index
    const updates = taskIds.map((id, index) =>
      this.taskRepo.update(id, { priority: index }),
    );
    await Promise.all(updates);
  }

  //update task
  async updateTask(
    taskId: number,
    dto: any,
    jwtUser: any,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['organization', 'createdBy'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // 1. Is user HQ Admin (Org 1 Admin)?
    const isSuperAdmin =
      jwtUser.role === Role.ADMIN && jwtUser.organizationId === 1;

    // 2. Is user Branch Admin of the SAME Org as the task?
    const isBranchAdmin =
      jwtUser.role === Role.ADMIN &&
      task.organization.id === jwtUser.organizationId;

    // 3. Is user the original creator?
    const isOwner = task.createdBy.id === jwtUser.userId;

    // RULE: Allow if Super Admin OR (Branch Admin of same Org) OR (Owner/Creator)
    if (!isSuperAdmin && !isBranchAdmin && !isOwner) {
      throw new ForbiddenException(
        'You do not have permission to modify this task',
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
      organizationId: updatedTask.organization?.id,
      createdBy: {
        id: updatedTask.createdBy.id,
        email: updatedTask.createdBy.email,
      },
    };
  }
}
