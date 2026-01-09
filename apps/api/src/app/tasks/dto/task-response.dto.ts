// apps/api/src/app/tasks/dto/task-response.dto.ts
export class TaskResponseDto {
  id!: number;
  title!: string;
  description?: string;
  completed!: boolean;

  createdBy!: {
    id: number;
    email: string;
  };
}
