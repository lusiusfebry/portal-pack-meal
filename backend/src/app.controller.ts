import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /health
  @Public()
  @Get('health')
  getHealth() {
    return this.appService?.getHealth?.() ?? { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString(), env: process.env.NODE_ENV || 'development' };
  }
}
