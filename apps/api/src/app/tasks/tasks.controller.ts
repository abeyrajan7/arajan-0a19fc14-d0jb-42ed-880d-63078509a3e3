import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Body,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';
import { Role } from '../entities/user.entity';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
  async getTasks(@Req() req: any) {
    return {
      message: 'Tasks fetched successfully',
      tasks: await this.tasksService.findAllForUser(req.user),
    };
  }

  @Get('audit-log')
  @Roles(Role.OWNER, Role.ADMIN)
  getAuditLog() {
    return {
      message:
        'Audit log accessible. Check server terminal for real-time logs.',
    };
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN) // Viewers cannot create
  async createTask(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN) // Viewers cannot delete
  async deleteTask(@Param('id') id: number, @Req() req: any) {
    await this.tasksService.deleteTask(id, req.user);
    return { message: 'Task deleted successfully' };
  }
  @Put('reorder')
  @Roles(Role.ADMIN)
  async reorder(@Body() ids: number[], @Req() req: any) {
    return this.tasksService.reorderTasks(ids, req.user);
  }
  @Put(':id')
  @Roles(Role.OWNER, Role.ADMIN) // Viewers cannot edit
  async updateTask(@Param('id') id: number, @Body() dto: any, @Req() req: any) {
    return this.tasksService.updateTask(id, dto, req.user);
  }
}
