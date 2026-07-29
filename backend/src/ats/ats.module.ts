import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';
import { EmpresasService } from '../empresas/empresas.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [AtsController],
  providers: [AtsService, EmpresasService, PrismaService],
})
export class AtsModule {}
