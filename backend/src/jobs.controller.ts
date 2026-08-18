import { Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from './common/prisma.service';
import { EmailService } from './common/email.service';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

  @Post('empresas-aviso-senha')
  executarAvisoEmpresasManual(@Headers('x-admin-token') token: string | undefined) {
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      return { status: 'bloqueado' };
    }
    return this.executarAvisoEmpresas();
  }

  @Get('empresas-aviso-senha')
  executarAvisoEmpresasCron(@Headers('user-agent') userAgent: string | undefined, @Query('token') token?: string) {
    if (!userAgent?.includes('vercel-cron') && token !== process.env.ADMIN_TOKEN) {
      return { status: 'bloqueado' };
    }
    return this.executarAvisoEmpresas();
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

    const apiBaseUrl = (process.env.API_PUBLIC_URL || process.env.APP_URL || '').replace(/\/$/, '');
    if (!apiBaseUrl) {
      await this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: {
          statusEnvio: 'erro_configuracao_email',
          erroEnvio: 'API_PUBLIC_URL ou APP_URL não configurada.',
        },
      });
      return 'erro_configuracao_email';
    }

    const confirmarUrl = `${apiBaseUrl}/candidatos/revalidacao/confirmar?token=${encodeURIComponent(token)}`;
    const removerUrl = `${apiBaseUrl}/candidatos/revalidacao/remover?token=${encodeURIComponent(token)}`;

    try {
      await this.emailService.send({
        to: candidato.email,
        subject: 'Confirme a disponibilidade do seu currículo - SINPAPEL',
        html: this.emailRevalidacaoHtml(candidato.nome, confirmarUrl, removerUrl),
      });

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

  private async executarAvisoEmpresas() {
    const agora = new Date();
    const limiteCadastro = new Date(agora);
    limiteCadastro.setDate(limiteCadastro.getDate() - 30);
    const limiteReenvio = new Date(agora);
    limiteReenvio.setDate(limiteReenvio.getDate() - 30);

    const empresas = await this.prisma.empresa.findMany({
      where: {
        statusAprovacao: 'aprovada',
        dataCadastro: { lte: limiteCadastro },
        OR: [
          { dataUltimoAvisoSenha: null },
          { dataUltimoAvisoSenha: { lte: limiteReenvio } },
        ],
      },
      select: { id: true, razaoSocial: true, email: true },
      take: 200,
      orderBy: { dataCadastro: 'asc' },
    });

    let emailsEnviados = 0;
    let emailsComErro = 0;

    for (const empresa of empresas) {
      const resultado = await this.criarEEnviarAvisoEmpresa(empresa, agora);
      if (resultado === 'enviado') emailsEnviados += 1;
      if (resultado !== 'enviado') emailsComErro += 1;
    }

    return {
      status: 'ok',
      empresasElegiveis: empresas.length,
      emailsEnviados,
      emailsComErro,
    };
  }

  private async criarEEnviarAvisoEmpresa(
    empresa: { id: string; razaoSocial: string; email: string },
    agora: Date,
  ) {
    const appUrl = (process.env.APP_URL || 'https://sinpapel.vercel.app').replace(/\/$/, '');
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiraEm = new Date(agora);
    expiraEm.setHours(expiraEm.getHours() + 1);

    await this.prisma.recuperacaoSenha.deleteMany({ where: { email: empresa.email, tipo: 'empresa' } });
    await this.prisma.recuperacaoSenha.create({
      data: {
        email: empresa.email,
        tipo: 'empresa',
        tokenHash,
        expiraEm,
      },
    });

    const acessoUrl = `${appUrl}/empresa`;
    const redefinirUrl = `${appUrl}/recuperar-senha?token=${encodeURIComponent(token)}&tipo=empresa`;

    try {
      await this.emailService.send({
        to: empresa.email,
        subject: 'Atualizacao de acesso - Banco de Curriculos SINPAPEL',
        html: this.emailAvisoEmpresaHtml(empresa.razaoSocial, acessoUrl, redefinirUrl),
      });

      await this.prisma.empresa.update({
        where: { id: empresa.id },
        data: { dataUltimoAvisoSenha: agora },
      });
      return 'enviado';
    } catch {
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

  private emailAvisoEmpresaHtml(razaoSocial: string, acessoUrl: string, redefinirUrl: string) {
    return `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.55;">
        <p>Associados,</p>
        <p>O Banco de Curriculos SINPAPEL esta com novos curriculos cadastrados e disponiveis para consulta pela empresa ${this.escapeHtml(razaoSocial)}.</p>
        <p>Acesse a plataforma e confira os candidatos que atendem as vagas em aberto:</p>
        <p style="margin: 24px 0;">
          <a href="${acessoUrl}" style="background: #7a3f33; color: #ffffff; padding: 12px 18px; text-decoration: none; border-radius: 6px; font-weight: 700;">Acessar plataforma</a>
        </p>
        <p>Por seguranca, pedimos que atualize a senha de acesso vinculada ao e-mail cadastrado na sua empresa. Essa atualizacao simples ajuda a manter os dados protegidos e o acesso exclusivo aos responsaveis autorizados.</p>
        <p style="margin: 24px 0;">
          <a href="${redefinirUrl}" style="background: #ffffff; color: #7a3f33; padding: 11px 17px; text-decoration: none; border: 1px solid #7a3f33; border-radius: 6px; font-weight: 700;">Alterar senha de acesso</a>
        </p>
        <p>Importante: caso sua empresa precise trocar o e-mail de acesso a plataforma, nao e possivel altera-lo diretamente pelo sistema. Basta responder este e-mail informando o novo endereco, e o SINPAPEL fara a liberacao do acesso.</p>
        <p>Qualquer duvida, estamos a disposicao.</p>
        <p>Atenciosamente,<br/>SINPAPEL</p>
        <p style="font-size: 12px; color: #64748b;">O link de alteracao de senha expira em 1 hora e pode ser usado uma unica vez.</p>
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
