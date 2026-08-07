import { ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../common/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async solicitarRecuperacao(email: string, tipo: 'candidato' | 'empresa') {
    const usuario = tipo === 'candidato'
      ? await this.prisma.candidato.findUnique({ where: { email }, select: { email: true } })
      : await this.prisma.empresa.findUnique({ where: { email }, select: { email: true } });

    if (!usuario) return { mensagem: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' };

    await this.prisma.recuperacaoSenha.deleteMany({ where: { email, tipo } });
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.recuperacaoSenha.create({ data: { email, tipo, tokenHash, expiraEm } });

    const appUrl = process.env.APP_URL ?? 'https://sinpapel.vercel.app';
    const link = `${appUrl}/recuperar-senha?token=${encodeURIComponent(token)}&tipo=${tipo}`;
    try {
      await this.emailService.send({
        to: email,
        subject: 'Recuperação de senha - SINPAPEL',
        html: `<p>Recebemos uma solicitação para redefinir sua senha no SINPAPEL.</p><p><a href="${link}">Criar nova senha</a></p><p>Este link expira em 1 hora e pode ser usado uma única vez.</p>`,
      });
    } catch {
      throw new InternalServerErrorException('Não foi possível enviar o e-mail de recuperação.');
    }
    return { mensagem: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' };
  }

  async redefinirSenha(token: string, tipo: 'candidato' | 'empresa', senha: string) {
    const tokenHash = createHash('sha256').update(token ?? '').digest('hex');
    const recuperacao = await this.prisma.recuperacaoSenha.findUnique({ where: { tokenHash } });
    if (!recuperacao || recuperacao.tipo !== tipo || recuperacao.usadoEm || recuperacao.expiraEm <= new Date()) {
      throw new UnauthorizedException('Link de recuperação inválido ou expirado.');
    }

    const senhaHash = await argon2.hash(senha);
    if (tipo === 'candidato') {
      await this.prisma.candidato.update({ where: { email: recuperacao.email }, data: { senhaHash } });
    } else {
      await this.prisma.empresa.update({ where: { email: recuperacao.email }, data: { senhaHash } });
    }
    await this.prisma.recuperacaoSenha.update({ where: { id: recuperacao.id }, data: { usadoEm: new Date() } });
    return { mensagem: 'Senha alterada com sucesso. Agora você já pode entrar.' };
  }

  async validarRecuperacao(token: string, tipo: 'candidato' | 'empresa') {
    const tokenHash = createHash('sha256').update(token ?? '').digest('hex');
    const recuperacao = await this.prisma.recuperacaoSenha.findUnique({ where: { tokenHash } });

    if (!recuperacao || recuperacao.tipo !== tipo) {
      return { valido: false, mensagem: 'Link de recuperação inválido.' };
    }

    if (recuperacao.usadoEm) {
      return { valido: false, mensagem: 'Este link de recuperação já foi usado.' };
    }

    if (recuperacao.expiraEm <= new Date()) {
      return { valido: false, mensagem: 'Este link de recuperação expirou. Solicite um novo link.' };
    }

    return { valido: true, mensagem: 'Link válido.' };
  }

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

  async loginEmpresa(email: string, senha: string, codigo2fa?: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { email } });
    if (!empresa) throw new UnauthorizedException('Credenciais inválidas.');

    const senhaValida = await argon2.verify(empresa.senhaHash, senha);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas.');

    if (empresa.twoFaAtivo) {
      const codigo = codigo2fa?.replace(/\s/g, '');
      if (!empresa.twoFaSecret || !codigo) {
        return { requer2fa: true, mensagem: 'Informe o código do aplicativo autenticador.' };
      }
      const codigoValido = speakeasy.totp.verify({ token: codigo, secret: empresa.twoFaSecret, encoding: 'base32' });
      if (!codigoValido) throw new UnauthorizedException('Código 2FA inválido.');
    }

    if (empresa.statusAprovacao !== 'aprovada') {
      throw new ForbiddenException('A empresa ainda não foi aprovada pelo administrador.');
    }

    const token = await this.jwt.signAsync({
      sub: empresa.id,
      tipo: 'empresa',
    });

    return {
      accessToken: token,
      empresa: {
        id: empresa.id,
        razaoSocial: empresa.razaoSocial,
        email: empresa.email,
        statusAprovacao: empresa.statusAprovacao,
      },
    };
  }
}
