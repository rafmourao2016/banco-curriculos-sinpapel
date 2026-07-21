import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginCandidato(email: string, senha: string) {
    const candidato = await this.prisma.candidato.findUnique({ where: { email } });
    if (!candidato) throw new UnauthorizedException('Credenciais inválidas.');

    const senhaValida = await argon2.verify(candidato.senhaHash, senha);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas.');

    const token = await this.jwt.signAsync({
      sub: candidato.id,
      tipo: 'candidato',
    });

    return { accessToken: token };
  }
}
