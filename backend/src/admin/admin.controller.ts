import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, Headers, Header, Param, Patch, Post, Query, Res } from '@nestjs/common';
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
  async listarCandidatos(
    @Headers('x-admin-token') token: string | undefined,
    @Query('q') busca?: string,
    @Query('cidade') cidade?: string,
    @Query('status') status?: string,
  ) {
    this.validarToken(token);
    const termo = busca?.trim();
    const apenasNumeros = termo ? termo.replace(/\D/g, '') : '';
    const cidadeFiltro = cidade?.trim();

    const condicoesWhere: any[] = [];

    if (status === 'ativo' || status === 'ativos') {
      condicoesWhere.push({ ativo: true });
    } else if (status === 'inativo' || status === 'inativos') {
      condicoesWhere.push({ ativo: false });
    }

    if (cidadeFiltro) {
      condicoesWhere.push({ regiao: { equals: cidadeFiltro, mode: 'insensitive' } });
    }

    if (termo) {
      const orBusca: any[] = [
        { nome: { contains: termo, mode: 'insensitive' } },
        { email: { contains: termo, mode: 'insensitive' } },
        { telefone: { contains: termo, mode: 'insensitive' } },
        { regiao: { contains: termo, mode: 'insensitive' } },
        { uf: { contains: termo, mode: 'insensitive' } },
        { areaPretendida: { contains: termo, mode: 'insensitive' } },
        { cargoPretendido: { contains: termo, mode: 'insensitive' } },
        { escolaridade: { contains: termo, mode: 'insensitive' } },
        { pretensaoSalarial: { contains: termo, mode: 'insensitive' } },
        { experiencias: { some: { cargo: { contains: termo, mode: 'insensitive' } } } },
        { experiencias: { some: { area: { contains: termo, mode: 'insensitive' } } } },
        { experiencias: { some: { empresa: { contains: termo, mode: 'insensitive' } } } },
        { formacoes: { some: { curso: { contains: termo, mode: 'insensitive' } } } },
        { formacoes: { some: { instituicao: { contains: termo, mode: 'insensitive' } } } },
        { habilidades: { some: { habilidade: { nome: { contains: termo, mode: 'insensitive' } } } } },
      ];

      if (apenasNumeros.length >= 3) {
        orBusca.push({ cpf: { contains: apenasNumeros } });
        orBusca.push({ telefone: { contains: apenasNumeros } });
      }

      condicoesWhere.push({ OR: orBusca });
    }

    const where = condicoesWhere.length > 0 ? { AND: condicoesWhere } : undefined;

    const candidatos = await this.prisma.candidato.findMany({
      where,
      orderBy: { dataCadastro: 'desc' },
      take: 500,
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
      take: 500,
    });
    const agora = Date.now();
    const diaMs = 24 * 60 * 60 * 1000;

    // Fix pending companies at the top
    empresas.sort((a, b) => {
      const priority = (s: string) => (s === 'pendente' ? 0 : s === 'aprovada' ? 1 : 2);
      const pA = priority(a.statusAprovacao);
      const pB = priority(b.statusAprovacao);
      if (pA !== pB) return pA - pB;
      const dataA = a.dataCadastro ? new Date(a.dataCadastro).getTime() : 0;
      const dataB = b.dataCadastro ? new Date(b.dataCadastro).getTime() : 0;
      return dataB - dataA;
    });

    return empresas.map(({ senhaHash: _senhaHash, twoFaSecret: _twoFaSecret, ...empresa }) => {
      const diasDesdeCadastro = Math.max(0, Math.floor((agora - empresa.dataCadastro.getTime()) / diaMs));
      return {
        ...empresa,
        diasDesdeCadastro,
        cadastroMaisDe30Dias: diasDesdeCadastro >= 30,
      };
    });
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

  @Patch('empresas/:id/email')
  async atualizarEmailEmpresa(
    @Headers('x-admin-token') token: string | undefined,
    @Param('id') id: string,
    @Body('email') email: string,
  ) {
    this.validarToken(token);
    const novoEmail = email?.trim().toLowerCase();
    if (!novoEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) {
      throw new BadRequestException('Informe um e-mail valido.');
    }

    const empresa = await this.prisma.empresa.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!empresa) throw new BadRequestException('Empresa nao encontrada.');

    const emailEmUso = await this.prisma.empresa.findFirst({
      where: { email: novoEmail, NOT: { id } },
      select: { id: true },
    });
    if (emailEmUso) {
      throw new ConflictException('Ja existe uma empresa usando este e-mail.');
    }

    const usuarioEmUso = await this.prisma.usuarioEmpresa.findFirst({
      where: { email: novoEmail, NOT: { empresaId: id } },
      select: { id: true },
    });
    if (usuarioEmUso) {
      throw new ConflictException('Ja existe um usuario de empresa usando este e-mail.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.usuarioEmpresa.updateMany({
        where: { empresaId: id, email: empresa.email },
        data: { email: novoEmail },
      });
      await tx.recuperacaoSenha.deleteMany({ where: { email: empresa.email, tipo: 'empresa' } });
      return tx.empresa.update({
        where: { id },
        data: { email: novoEmail },
        select: { id: true, razaoSocial: true, email: true, statusAprovacao: true },
      });
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
      take: 500,
      include: {
        empresa: { select: { id: true, razaoSocial: true, email: true, statusAprovacao: true } },
        candidato: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            regiao: true,
            uf: true,
            cargoPretendido: true,
            areaPretendida: true,
          },
        },
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
    const [indicadores, empresas, candidatos, logs] = await Promise.all([
      this.montarIndicadores(meses),
      this.prisma.empresa.findMany({
        orderBy: { dataCadastro: 'desc' },
      }),
      this.prisma.candidato.findMany({
        orderBy: { dataCadastro: 'desc' },
        include: {
          experiencias: { orderBy: { dataInicio: 'desc' }, take: 1 },
          habilidades: { include: { habilidade: true } },
        },
      }),
      this.prisma.logVisualizacao.findMany({
        orderBy: { dataHora: 'desc' },
        take: 500,
        include: {
          empresa: { select: { razaoSocial: true, email: true } },
          candidato: { select: { nome: true, email: true, cargoPretendido: true, regiao: true, uf: true } },
        },
      }),
    ]);

    const xml = this.gerarExcelXml(indicadores, empresas, candidatos, logs);
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-completo-sinpapel.xls"');
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

    const [
      totalCandidatos,
      ativos,
      inativos,
      totalEmpresas,
      empresasAprovadas,
      revalidacoes,
      rankingUso,
      contratacoesPorPeriodo,
      candidatosPorCidadeRaw,
    ] = await Promise.all([
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
      this.prisma.candidato.groupBy({
        by: ['regiao', 'uf'],
        where: { ativo: true },
        _count: { _all: true },
        orderBy: { _count: { regiao: 'desc' } },
      }),
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

    // Agrupar distribuição por cidade de forma normalizada
    const cidadesMap = new Map<string, { cidade: string; uf?: string | null; total: number }>();
    for (const item of candidatosPorCidadeRaw) {
      const cidadeFormatada = (item.regiao || 'Não informada').trim();
      const chave = cidadeFormatada.toLowerCase();
      const existente = cidadesMap.get(chave);
      if (existente) {
        existente.total += item._count._all;
      } else {
        cidadesMap.set(chave, {
          cidade: cidadeFormatada,
          uf: item.uf?.trim() || null,
          total: item._count._all,
        });
      }
    }
    const curriculosAtivosPorCidade = Array.from(cidadesMap.values()).sort((a, b) => b.total - a.total);

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
      curriculosAtivosPorCidade,
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

  private gerarExcelXml(
    indicadores: Awaited<ReturnType<AdminController['montarIndicadores']>>,
    empresas: any[] = [],
    candidatos: any[] = [],
    logs: any[] = [],
  ) {
    const escape = (valor: unknown) => String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const row = (values: unknown[]) => `<Row>${values.map((value) => `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${escape(value)}</Data></Cell>`).join('')}</Row>`;
    const sheet = (name: string, rows: string[]) => `<Worksheet ss:Name="${escape(name)}"><Table>${rows.join('')}</Table></Worksheet>`;

    const formatData = (d?: Date | string | null) => {
      if (!d) return '';
      const dt = new Date(d);
      return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
    };

    return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheet('Resumo Executivo', [
  row(['Indicador', 'Valor']),
  row(['Currículos totais', indicadores.resumo.totalCandidatos]),
  row(['Currículos ativos', indicadores.resumo.ativos]),
  row(['Currículos inativos', indicadores.resumo.inativos]),
  row(['Empresas totais', indicadores.resumo.totalEmpresas]),
  row(['Empresas aprovadas', indicadores.resumo.empresasAprovadas]),
  row(['Revalidações enviadas/registradas', indicadores.resumo.revalidacoesTotal]),
  row(['Revalidações confirmadas', indicadores.resumo.revalidacoesConfirmadas]),
  row(['Taxa de revalidação (%)', indicadores.resumo.taxaRevalidacao]),
])}
${sheet('Distribuição por Cidade', [
  row(['Cidade', 'UF', 'Currículos Ativos', '% do Total de Ativos']),
  ...(indicadores.curriculosAtivosPorCidade ?? []).map((item) =>
    row([
      item.cidade,
      item.uf ?? '',
      item.total,
      indicadores.resumo.ativos > 0
        ? `${((item.total / indicadores.resumo.ativos) * 100).toFixed(1)}%`
        : '0%',
    ]),
  ),
])}
${sheet('Empresas Detalhadas', [
  row(['Razão Social', 'CNPJ', 'E-mail', 'Status Aprovação', 'Data Cadastro']),
  ...empresas.map((e) => row([e.razaoSocial, e.cnpj, e.email, e.statusAprovacao, formatData(e.dataCadastro)])),
])}
${sheet('Base de Currículos', [
  row(['Nome', 'CPF', 'E-mail', 'Telefone', 'Cidade', 'UF', 'Cargo Pretendido', 'Área', 'Escolaridade', 'Pretensão Salarial', 'Experiência Total', 'CNH', 'Início Imediato', 'Status', 'Data Cadastro', 'Habilidades']),
  ...candidatos.map((c) =>
    row([
      c.nome,
      c.cpf,
      c.email,
      c.telefone,
      c.regiao,
      c.uf ?? '',
      c.cargoPretendido ?? c.experiencias?.[0]?.cargo ?? '',
      c.areaPretendida ?? '',
      c.escolaridade ?? '',
      c.pretensaoSalarial ?? '',
      c.anosExperienciaTotal ?? '',
      c.possuiCnh ? c.categoriaCnh || 'Sim' : 'Não',
      c.inicioImediato ? 'Sim' : 'Não',
      c.ativo ? 'Ativo' : 'Inativo',
      formatData(c.dataCadastro),
      (c.habilidades ?? []).map((h: any) => h.habilidade?.nome ?? h).join(', '),
    ]),
  ),
])}
${sheet('Ranking Uso Empresas', [
  row(['Empresa', 'E-mail', 'Visualizações no Período']),
  ...indicadores.rankingUsoEmpresas.map((item) => row([item.razaoSocial, item.email, item.visualizacoes])),
])}
${sheet('Logs de Acessos', [
  row(['Data/Hora', 'Empresa', 'E-mail Empresa', 'Candidato Visualizado', 'E-mail Candidato', 'Cargo', 'Localidade']),
  ...logs.map((l) =>
    row([
      l.dataHora ? new Date(l.dataHora).toISOString().replace('T', ' ').slice(0, 19) : '',
      l.empresa?.razaoSocial ?? '',
      l.empresa?.email ?? '',
      l.candidato?.nome ?? '',
      l.candidato?.email ?? '',
      l.candidato?.cargoPretendido ?? '',
      `${l.candidato?.regiao ?? ''}${l.candidato?.uf ? `/${l.candidato.uf}` : ''}`,
    ]),
  ),
])}
${sheet('Contratações', [
  row(['Período', 'Contratações']),
  ...indicadores.contratacoesPorPeriodo.map((item) => row([item.periodo, item.total])),
])}
</Workbook>`;
  }
}
