import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      app: 'Banco de Curriculos SINPAPEL API',
      status: 'ok',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
    };
  }
}
