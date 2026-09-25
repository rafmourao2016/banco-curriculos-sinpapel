import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(`ALTER TABLE vagas_necessidade ADD COLUMN IF NOT EXISTS imagem_url TEXT;`);
    } catch {
      // continua sem erro caso tabela ainda nao exista
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
