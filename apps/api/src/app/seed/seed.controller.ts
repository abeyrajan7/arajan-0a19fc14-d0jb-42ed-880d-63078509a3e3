import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Public } from '../auth/public.decorator';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}
  @Public()
  @Get()
  async seed() {
    await this.seedService.seed();
    return { message: 'Database seeded successfully' };
  }
}
