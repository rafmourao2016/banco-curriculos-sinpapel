import { Module } from '@nestjs/common';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { PrismaService } from '../common/prisma.service';
import { JevService } from '../common/jev.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EmpresasController],
  providers: [EmpresasService, PrismaService, JevService],
  exports: [EmpresasService, JevService],
})
export class EmpresasModule {}
