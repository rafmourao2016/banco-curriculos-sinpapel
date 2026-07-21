import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CandidatosModule } from './candidatos/candidatos.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CandidatosModule,
  ],
})
export class AppModule {}
