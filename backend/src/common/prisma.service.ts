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
    try {
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS candidaturas_vaga (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vaga_id UUID NOT NULL REFERENCES vagas_necessidade(id) ON DELETE CASCADE,
          candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
          mensagem TEXT NOT NULL,
          data_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_candidatura_vaga_candidato UNIQUE (vaga_id, candidato_id)
        );
      `);
    } catch {
      // continua sem erro caso tabela ja exista
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
