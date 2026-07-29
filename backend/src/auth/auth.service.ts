import { ForbiddenException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async solicitarRecuperacao(email: string, tipo: 'candidato' | 'empresa') {
    const usuario = tipo === 'candidato'
      ? await this.prisma.candidato.findUnique({ where: { email }, select: { email: true } })
      : await this.prisma.empresa.findUnique({ where: { email }, select: { email: true } });

    if (!usuario) return { mensagem: 'Se o e-mail estiver cadastrado, voce recebera um link de recuperacao.' };
    if (!process.env.RESEND_API_KEY) {
      throw new InternalServerErrorException('O servico de e-mail ainda nao foi configurado.');
    }

    await this.prisma.recuperacaoSenha.deleteMany({ where: { email, tipo } });
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.recuperacaoSenha.create({ data: { email, tipo, tokenHash, expiraEm } });

    const appUrl = process.env.APP_URL ?? 'https://sinpapel.vercel.app';
    const link = `${appUrl}/recuperar-senha?token=${encodeURIComponent(token)}&tipo=${tipo}`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const envio = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'SINPAPEL <onboarding@resend.dev>',
      to: email,
      subject: 'Recuperacao de senha - SINPAPEL',
      html: `<p>Recebemos uma solicitacao para redefinir sua senha no SINPAPEL.</p><p><a href="${link}">Criar nova senha</a></p><p>Este link expira em 1 hora e pode ser usado uma unica vez.</p>`,
    });
    if (envio.error) throw new InternalServerErrorException('Nao foi possivel enviar o e-mail de recuperacao.');
    return { mensagem: 'Se o e-mail estiver cadastrado, voce recebera um link de recuperacao.' };
  }

  async redefinirSenha(token: string, tipo: 'candidato' | 'empresa', senha: string) {
    const tokenHash = createHash('sha256').update(token ?? '').digest('hex');
    const recuperacao = await this.prisma.recuperacaoSenha.findUnique({ where: { tokenHash } });
    if (!recuperacao || recuperacao.tipo !== tipo || recuperacao.usadoEm || recuperacao.expiraEm <= new Date()) {
      throw new UnauthorizedException('Link de recuperacao invalido ou expirado.');
    }

    const senhaHash = await argon2.hash(senha);
    if (tipo === 'candidato') {
      await this.prisma.candidato.update({ where: { email: recuperacao.email }, data: { senhaHash } });
    } else {
      await this.prisma.empresa.update({ where: { email: recuperacao.email }, data: { senhaHash } });
    }
    await this.prisma.recuperacaoSenha.update({ where: { id: recuperacao.id }, data: { usadoEm: new Date() } });
    return { mensagem: 'Senha alterada com sucesso. Agora voce ja pode entrar.' };
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
    if (!empresa) throw new UnauthorizedException('Credenciais invÃ¡lidas.');

    const senhaValida = await argon2.verify(empresa.senhaHash, senha);
    if (!senhaValida) throw new UnauthorizedException('Credenciais invÃ¡lidas.');

    if (empresa.twoFaAtivo) {
      const codigo = codigo2fa?.replace(/\s/g, '');
      if (!empresa.twoFaSecret || !codigo) {
        return { requer2fa: true, mensagem: 'Informe o codigo do aplicativo autenticador.' };
      }
      const codigoValido = speakeasy.totp.verify({ token: codigo, secret: empresa.twoFaSecret, encoding: 'base32' });
      if (!codigoValido) throw new UnauthorizedException('Codigo 2FA invalido.');
    }

    if (empresa.statusAprovacao !== 'aprovada') {
      throw new ForbiddenException('A empresa ainda nao foi aprovada pelo administrador.');
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
