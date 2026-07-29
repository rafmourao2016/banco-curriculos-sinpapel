import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CandidatosModule } from './candidatos/candidatos.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { AdminModule } from './admin/admin.module';
import { EmpresasModule } from './empresas/empresas.module';
import { JobsController } from './jobs.controller';
import { PrismaService } from './common/prisma.service';
import { AtsModule } from './ats/ats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CandidatosModule,
    AdminModule,
    EmpresasModule,
    AtsModule,
  ],
  controllers: [HealthController, JobsController],
  providers: [PrismaService],
})
export class AppModule {}
