import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Task } from './task.entity';

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'text' })
  role!: Role;

  @ManyToOne(() => Organization, (org) => org.users)
  organization!: Organization;

  @OneToMany(() => Task, (task) => task.createdBy)
  tasks!: Task[];
}
