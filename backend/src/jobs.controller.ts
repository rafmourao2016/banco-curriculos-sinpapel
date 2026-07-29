import { Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Resend } from 'resend';
import { PrismaService } from './common/prisma.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('revalidacao')
  executarManual(@Headers('x-admin-token') token: string | undefined) {
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return { status: 'bloqueado' };
    }
    return this.executar();
  }

  @Get('revalidacao')
  executarCron(@Headers('user-agent') userAgent: string | undefined, @Query('token') token?: string) {
    if (!userAgent?.includes('vercel-cron') && token !== process.env.ADMIN_TOKEN) {
      return { status: 'bloqueado' };
    }
    return this.executar();
  }

  private async executar() {
    const agora = new Date();
    const limiteRevalidacao = new Date(agora);
    limiteRevalidacao.setDate(limiteRevalidacao.getDate() - 90);
    const limiteInativacao = new Date(agora);
    limiteInativacao.setDate(limiteInativacao.getDate() - 120);
    const limiteExclusao = new Date(agora);
    limiteExclusao.setMonth(limiteExclusao.getMonth() - 12);

    const paraRevalidar = await this.prisma.candidato.findMany({
      where: {
        ativo: true,
        dataUltimaRevalidacao: { lte: limiteRevalidacao, gt: limiteInativacao },
        notificacoes: {
          none: {
            tipo: 'revalidacao',
            statusEnvio: { in: ['pendente', 'enviado'] },
            expiraEm: { gt: agora },
            usadoEm: null,
          },
        },
      },
      select: { id: true, nome: true, email: true },
      take: 500,
    });

    let emailsEnviados = 0;
    let emailsComErro = 0;
    let notificacoesCriadas = 0;

    for (const candidato of paraRevalidar) {
      const resultado = await this.criarEEnviarRevalidacao(candidato, agora);
      notificacoesCriadas += 1;
      if (resultado === 'enviado') emailsEnviados += 1;
      if (resultado !== 'enviado') emailsComErro += 1;
    }

    const inativados = await this.prisma.candidato.updateMany({
      where: {
        ativo: true,
        dataUltimaRevalidacao: { lte: limiteInativacao },
      },
      data: { ativo: false, dataInativacao: agora },
    });

    const excluidos = await this.prisma.candidato.deleteMany({
      where: {
        ativo: false,
        dataInativacao: { lte: limiteExclusao },
      },
    });

    return {
      status: 'ok',
      revalidacoesCriadas: notificacoesCriadas,
      emailsEnviados,
      emailsComErro,
      curriculosInativados: inativados.count,
      curriculosExcluidosDefinitivamente: excluidos.count,
    };
  }

  private async criarEEnviarRevalidacao(
    candidato: { id: string; nome: string; email: string },
    agora: Date,
  ) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiraEm = new Date(agora);
    expiraEm.setDate(expiraEm.getDate() + 30);

    const notificacao = await this.prisma.notificacao.create({
      data: {
        candidatoId: candidato.id,
        tipo: 'revalidacao',
        canal: 'email',
        statusEnvio: 'pendente',
        tokenHash,
        expiraEm,
      },
    });

    if (!process.env.RESEND_API_KEY) {
      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: {
          statusEnvio: 'erro_configuracao_email',
          erroEnvio: 'RESEND_API_KEY nao configurada.',
        },
      });
      return 'erro_configuracao_email';
    }

    const apiBaseUrl = (process.env.API_PUBLIC_URL || process.env.APP_URL || '').replace(/\/$/, '');
    if (!apiBaseUrl) {
      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: {
          statusEnvio: 'erro_configuracao_email',
          erroEnvio: 'API_PUBLIC_URL ou APP_URL nao configurada.',
        },
      });
      return 'erro_configuracao_email';
    }

    const confirmarUrl = `${apiBaseUrl}/candidatos/revalidacao/confirmar?token=${encodeURIComponent(token)}`;
    const removerUrl = `${apiBaseUrl}/candidatos/revalidacao/remover?token=${encodeURIComponent(token)}`;

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const envio = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'SINPAPEL <noreply@seudominio.com>',
        to: candidato.email,
        subject: 'Confirme a disponibilidade do seu curriculo - SINPAPEL',
        html: this.emailRevalidacaoHtml(candidato.nome, confirmarUrl, removerUrl),
      });

      if (envio.error) {
        throw new Error(envio.error.message);
      }

      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: { statusEnvio: 'enviado' },
      });
      return 'enviado';
    } catch (erro) {
      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: {
          statusEnvio: 'erro_envio',
          erroEnvio: erro instanceof Error ? erro.message : 'Erro desconhecido no envio.',
        },
      });
      return 'erro_envio';
    }
  }

  private emailRevalidacaoHtml(nome: string, confirmarUrl: string, removerUrl: string) {
    return `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
        <p>Olá, ${this.escapeHtml(nome)}.</p>
        <p>Para manter o Banco de Currículos do SINPAPEL atualizado, confirme se você ainda está disponível para oportunidades em empresas associadas.</p>
        <p>Este link vale por 30 dias. Sem confirmação, seu currículo ficará inativo e deixará de aparecer nas buscas das empresas.</p>
        <p style="margin: 28px 0;">
          <a href="${confirmarUrl}" style="background: #166534; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 6px; font-weight: 700;">Ainda estou disponível</a>
        </p>
        <p style="margin: 28px 0;">
          <a href="${removerUrl}" style="background: #ffffff; color: #991b1b; padding: 11px 17px; text-decoration: none; border: 1px solid #991b1b; border-radius: 6px; font-weight: 700;">Remover meu currículo</a>
        </p>
        <p>Se você não reconhece este cadastro, use o botão de remoção ou entre em contato com o SINPAPEL.</p>
      </div>
    `;
  }

  private escapeHtml(valor: string) {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
