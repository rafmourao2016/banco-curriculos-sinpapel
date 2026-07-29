import { ForbiddenException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../common/prisma.service';

const apiKeyCache = new Map<string, { empresaId: string; expiraEm: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AtsService {
  constructor(private readonly prisma: PrismaService) {}

  async autenticar(apiKey?: string) {
    if (!apiKey) throw new ForbiddenException('API key nao informada.');
    const tokenHash = createHash('sha256').update(apiKey).digest('hex');
    const cache = apiKeyCache.get(tokenHash);
    if (cache && cache.expiraEm > Date.now()) return cache.empresaId;

    const tokenPrefix = apiKey.slice(0, 20);
    const chaves = await this.prisma.empresaApiKey.findMany({
      where: { tokenPrefix, ativo: true },
      include: { empresa: true },
      take: 5,
    });

    for (const chave of chaves) {
      if (chave.tokenHash === tokenHash) {
        if (chave.empresa.statusAprovacao !== 'aprovada') {
          throw new ForbiddenException('Empresa ainda nao aprovada.');
        }
        apiKeyCache.set(tokenHash, { empresaId: chave.empresaId, expiraEm: Date.now() + CACHE_TTL_MS });
        return chave.empresaId;
      }
    }

    throw new ForbiddenException('API key invalida.');
  }
}
