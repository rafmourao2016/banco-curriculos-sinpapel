import { Body, Controller, Delete, ForbiddenException, Get, Headers, Header, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../common/prisma.service';
import { gerarEmbedding, vetorPg } from '../common/embedding';

@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private validarToken(token: string | undefined) {
    if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
      throw new ForbiddenException('Acesso administrativo nao autorizado.');
    }
  }

  @Get('candidatos')
  async listarCandidatos(@Headers('x-admin-token') token: string | undefined, @Query('q') busca?: string) {
    this.validarToken(token);
    const termo = busca?.trim();

    const candidatos = await this.prisma.candidato.findMany({
      where: termo
        ? {
            OR: [
              { nome: { contains: termo, mode: 'insensitive' } },
              { email: { contains: termo, mode: 'insensitive' } },
              { telefone: { contains: termo, mode: 'insensitive' } },
              { regiao: { contains: termo, mode: 'insensitive' } },
              { uf: { contains: termo, mode: 'insensitive' } },
              { areaPretendida: { contains: termo, mode: 'insensitive' } },
              { cargoPretendido: { contains: termo, mode: 'insensitive' } },
              { pretensaoSalarial: { contains: termo, mode: 'insensitive' } },
              { experiencias: { some: { cargo: { contains: termo, mode: 'insensitive' } } } },
              { experiencias: { some: { area: { contains: termo, mode: 'insensitive' } } } },
              { experiencias: { some: { empresa: { contains: termo, mode: 'insensitive' } } } },
              { habilidades: { some: { habilidade: { nome: { contains: termo, mode: 'insensitive' } } } } },
            ],
          }
        : undefined,
      orderBy: { dataCadastro: 'desc' },
      take: 100,
      include: {
        experiencias: { orderBy: { dataInicio: 'desc' } },
        formacoes: true,
        habilidades: { include: { habilidade: true } },
        termoConsentimento: true,
      },
    });

    return candidatos.map(({ senhaHash: _senhaHash, ...candidato }) => ({
      ...candidato,
      habilidades: candidato.habilidades.map((item) => item.habilidade.nome),
    }));
  }

  @Delete('candidatos/:id')
  async excluirCandidato(@Headers('x-admin-token') token: string | undefined, @Param('id') id: string) {
    this.validarToken(token);
    await this.prisma.candidato.delete({ where: { id } });
    return { mensagem: 'Dados do candidato excluidos conforme solicitacao LGPD.' };
  }

  @Get('empresas')
  async listarEmpresas(@Headers('x-admin-token') token: string | undefined) {
    this.validarToken(token);
    const empresas = await this.prisma.empresa.findMany({
      orderBy: { razaoSocial: 'asc' },
      take: 100,
    });
    return empresas.map(({ senhaHash: _senhaHash, twoFaSecret: _twoFaSecret, ...empresa }) => empresa);
  }

  @Patch('empresas/:id/status')
  async atualizarEmpresa(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
    @Body('statusAprovacao') statusAprovacao: string,
  ) {
    this.validarToken(token);
    return this.prisma.empresa.update({
      where: { id },
      data: { statusAprovacao },
      select: { id: true, razaoSocial: true, email: true, statusAprovacao: true },
    });
  }

  @Post('empresas/:id/api-keys')
  async criarApiKey(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
    @Body('nome') nome?: string,
  ) {
    this.validarToken(token);
    const rawToken = `sinpapel_${randomBytes(24).toString('hex')}`;
    const tokenPrefix = rawToken.slice(0, 20);
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.empresaApiKey.create({
      data: {
        empresaId: id,
        nome: nome || 'ATS',
        tokenPrefix,
        tokenHash,
      },
    });
    return { apiKey: rawToken, tokenPrefix };
  }

  @Post('embeddings/backfill')
  async backfillEmbeddings(@Headers('x-admin-token') token: string | undefined) {
    this.validarToken(token);
    const candidatos = await this.prisma.candidato.findMany({
      where: { ativo: true },
      include: {
        experiencias: true,
        formacoes: true,
        habilidades: { include: { habilidade: true } },
      },
      take: 500,
    });

    for (const candidato of candidatos) {
      const texto = [
        candidato.nome,
        candidato.regiao,
        candidato.uf,
        candidato.escolaridade,
        candidato.areaPretendida,
        candidato.cargoPretendido,
        candidato.anosExperienciaTotal,
        candidato.cursosCertificacoes.join(' '),
        candidato.idiomas.join(' '),
        candidato.experiencias.map((exp) => `${exp.cargo} ${exp.area} ${exp.empresa ?? ''} ${exp.descricao ?? ''}`).join(' '),
        candidato.formacoes.map((formacao) => `${formacao.curso} ${formacao.instituicao}`).join(' '),
        candidato.habilidades.map((item) => item.habilidade.nome).join(' '),
      ].filter(Boolean).join(' ');
      const embedding = await gerarEmbedding(texto);
      await this.prisma.$executeRawUnsafe(
        `update candidatos set embedding = $1::vector where id = $2::uuid`,
        vetorPg(embedding),
        candidato.id,
      );
    }

    return { status: 'ok', candidatosAtualizados: candidatos.length };
  }

  @Get('logs')
  async listarLogs(@Headers('x-admin-token') token: string | undefined) {
    this.validarToken(token);
    return this.prisma.logVisualizacao.findMany({
      orderBy: { dataHora: 'desc' },
      take: 100,
      include: {
        empresa: { select: { razaoSocial: true, email: true } },
        candidato: { select: { nome: true, email: true } },
      },
    });
  }

  @Get('indicadores')
  async indicadores(@Headers('x-admin-token') token: string | undefined, @Query('meses') meses?: string) {
    this.validarToken(token);
    return this.montarIndicadores(meses);
  }

  @Get('indicadores/exportar')
  @Header('Content-Type', 'application/vnd.ms-excel; charset=utf-8')
  async exportarIndicadores(
    @Headers('x-admin-token') token: string | undefined,
    @Query('meses') meses: string | undefined,
    @Res() res: Response,
  ) {
    this.validarToken(token);
    const indicadores = await this.montarIndicadores(meses);
    const xml = this.gerarExcelXml(indicadores);
    res.setHeader('Content-Disposition', 'attachment; filename="indicadores-sinpapel.xls"');
    res.send(xml);
  }

  @Post('comunicacoes')
  async criarComunicacao(
    @Headers('x-admin-token') token: string | undefined,
    @Body() dto: { candidatoId: string; tipo?: string; canal?: string },
  ) {
    this.validarToken(token);
    return this.prisma.notificacao.create({
      data: {
        candidatoId: dto.candidatoId,
        tipo: dto.tipo || 'geral',
        canal: dto.canal || 'email',
        statusEnvio: 'pendente',
      },
    });
  }

  private async montarIndicadores(meses?: string) {
    const mesesNumero = Math.min(Math.max(Number(meses) || 12, 1), 36);
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - (mesesNumero - 1));
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);

    const [totalCandidatos, ativos, inativos, totalEmpresas, empresasAprovadas, revalidacoes, rankingUso, contratacoesPorPeriodo] = await Promise.all([
      this.prisma.candidato.count(),
      this.prisma.candidato.count({ where: { ativo: true } }),
      this.prisma.candidato.count({ where: { ativo: false } }),
      this.prisma.empresa.count(),
      this.prisma.empresa.count({ where: { statusAprovacao: 'aprovada' } }),
      this.prisma.notificacao.groupBy({
        by: ['statusEnvio'],
        where: { tipo: 'revalidacao', dataEnvio: { gte: inicio } },
        _count: { _all: true },
      }),
      this.prisma.logVisualizacao.groupBy({
        by: ['empresaId'],
        where: { dataHora: { gte: inicio } },
        _count: { _all: true },
        orderBy: { _count: { empresaId: 'desc' } },
        take: 10,
      }),
      this.prisma.$queryRaw<Array<{ periodo: Date; total: bigint }>>`
        select date_trunc('month', data_admissao)::date as periodo, count(*)::bigint as total
        from status_contratacao
        where status = 'CONTRATADO' and data_admissao >= ${inicio}
        group by 1
        order by 1 desc
      `,
    ]);

    const empresasRanking = rankingUso.length
      ? await this.prisma.empresa.findMany({
          where: { id: { in: rankingUso.map((item) => item.empresaId) } },
          select: { id: true, razaoSocial: true, email: true },
        })
      : [];
    const empresasPorId = new Map(empresasRanking.map((empresa) => [empresa.id, empresa]));
    const revalidacoesTotal = revalidacoes.reduce((soma, item) => soma + item._count._all, 0);
    const revalidacoesConfirmadas = revalidacoes
      .filter((item) => item.statusEnvio === 'confirmado')
      .reduce((soma, item) => soma + item._count._all, 0);

    return {
      periodoMeses: mesesNumero,
      atualizadoEm: new Date().toISOString(),
      resumo: {
        totalCandidatos,
        ativos,
        inativos,
        totalEmpresas,
        empresasAprovadas,
        revalidacoesTotal,
        revalidacoesConfirmadas,
        taxaRevalidacao: revalidacoesTotal > 0 ? Number(((revalidacoesConfirmadas / revalidacoesTotal) * 100).toFixed(1)) : 0,
      },
      rankingUsoEmpresas: rankingUso.map((item) => {
        const empresa = empresasPorId.get(item.empresaId);
        return {
          empresaId: item.empresaId,
          razaoSocial: empresa?.razaoSocial ?? 'Empresa removida',
          email: empresa?.email ?? '',
          visualizacoes: item._count._all,
        };
      }),
      contratacoesPorPeriodo: contratacoesPorPeriodo.map((item) => ({
        periodo: item.periodo.toISOString().slice(0, 10),
        total: Number(item.total),
      })),
    };
  }

  private gerarExcelXml(indicadores: Awaited<ReturnType<AdminController['montarIndicadores']>>) {
    const escape = (valor: unknown) => String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const row = (values: unknown[]) => `<Row>${values.map((value) => `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${escape(value)}</Data></Cell>`).join('')}</Row>`;
    const sheet = (name: string, rows: string[]) => `<Worksheet ss:Name="${escape(name)}"><Table>${rows.join('')}</Table></Worksheet>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheet('Resumo', [
  row(['Indicador', 'Valor']),
  row(['Curriculos totais', indicadores.resumo.totalCandidatos]),
  row(['Curriculos ativos', indicadores.resumo.ativos]),
  row(['Curriculos inativos', indicadores.resumo.inativos]),
  row(['Empresas totais', indicadores.resumo.totalEmpresas]),
  row(['Empresas aprovadas', indicadores.resumo.empresasAprovadas]),
  row(['Revalidacoes enviadas/registradas', indicadores.resumo.revalidacoesTotal]),
  row(['Revalidacoes confirmadas', indicadores.resumo.revalidacoesConfirmadas]),
  row(['Taxa de revalidacao (%)', indicadores.resumo.taxaRevalidacao]),
])}
${sheet('Ranking empresas', [
  row(['Empresa', 'E-mail', 'Visualizacoes']),
  ...indicadores.rankingUsoEmpresas.map((item) => row([item.razaoSocial, item.email, item.visualizacoes])),
])}
${sheet('Contratacoes', [
  row(['Periodo', 'Contratacoes']),
  ...indicadores.contratacoesPorPeriodo.map((item) => row([item.periodo, item.total])),
])}
</Workbook>`;
  }
}
