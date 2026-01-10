export class TaskResponseDto {
  id!: number;
  title!: string;
  description?: string;
  completed!: boolean;
  organizationId!: number;
  createdBy!: {
    id: number;
    email: string;
  };
}
