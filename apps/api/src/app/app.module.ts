import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { SeedService } from './seed/seed.service';
import { SeedController } from './seed/seed.controller';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { TasksModule } from './tasks/tasks.module';
import { join } from 'node:path';
import { Task } from './entities/task.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(
        process.cwd(),
        process.env['DATABASE_PATH'] || 'database.sqlite',
      ),
      entities: [User, Organization, Task],
      synchronize: true,
    }),

    TypeOrmModule.forFeature([User, Organization]),
    AuthModule,
    TasksModule,
  ],
  controllers: [AppController, SeedController],
  providers: [
    AppService,
    SeedService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
