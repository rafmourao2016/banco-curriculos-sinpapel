import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';
import { EmpresasModule } from '../empresas/empresas.module';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [EmpresasModule],
  controllers: [AtsController],
  providers: [AtsService, PrismaService],
})
export class AtsModule {}
