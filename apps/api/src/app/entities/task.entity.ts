import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum TaskStatus {
  OPRN = 'OPEN',
  IN_PROCESS = 'IN_PROCESS',
  DONE = 'DONE',
}
@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 })
  priority!: number;

  @Column({ default: false })
  completed!: boolean;

  @ManyToOne(() => User, (user) => user.tasks)
  createdBy!: User;

  @ManyToOne(() => Organization, (org) => org.tasks)
  organization!: Organization;
}
