import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StatusCandidatura } from '@prisma/client';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../common/prisma.service';
import { CriarEmpresaDto } from './dto/criar-empresa.dto';
import { gerarCurriculoPdf } from '../common/curriculo-pdf';
import { gerarEmbedding, vetorPg } from '../common/embedding';
import { apenasDigitos, cnpjValido } from '../common/documentos';

const semanticCache = new Map<string, { ids: string[]; expiraEm: number }>();
const SEMANTIC_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async status2fa(empresaId: string) {
    const empresa = await this.validarEmpresa(empresaId);
    return { ativo: empresa.twoFaAtivo };
  }

  async iniciar2fa(empresaId: string) {
    const empresa = await this.validarEmpresa(empresaId);
    const segredo = speakeasy.generateSecret({ length: 20, name: `SINPAPEL:${empresa.email}`, issuer: 'SINPAPEL' });
    const secret = segredo.base32;
    const otpauthUrl = segredo.otpauth_url ?? `otpauth://totp/SINPAPEL:${encodeURIComponent(empresa.email)}?secret=${secret}&issuer=SINPAPEL`;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });

    await this.prisma.empresa.update({
      where: { id: empresaId },
      data: { twoFaSecret: secret, twoFaAtivo: false },
    });

    return { otpauthUrl, qrCodeDataUrl, secret };
  }

  async confirmar2fa(empresaId: string, codigo: string) {
    const empresa = await this.validarEmpresa(empresaId);
    if (!empresa.twoFaSecret) throw new BadRequestException('Inicie a configuracao do 2FA primeiro.');
    const valido = speakeasy.totp.verify({ token: codigo?.replace(/\s/g, ''), secret: empresa.twoFaSecret, encoding: 'base32' });
    if (!valido) throw new BadRequestException('Codigo 2FA invalido.');

    await this.prisma.empresa.update({ where: { id: empresaId }, data: { twoFaAtivo: true } });
    return { ativo: true };
  }

  async desativar2fa(empresaId: string, codigo: string) {
    const empresa = await this.validarEmpresa(empresaId);
    if (!empresa.twoFaAtivo || !empresa.twoFaSecret) return { ativo: false };
    const valido = speakeasy.totp.verify({ token: codigo?.replace(/\s/g, ''), secret: empresa.twoFaSecret, encoding: 'base32' });
    if (!valido) throw new BadRequestException('Codigo 2FA invalido.');

    await this.prisma.empresa.update({
      where: { id: empresaId },
      data: { twoFaAtivo: false, twoFaSecret: null },
    });
    return { ativo: false };
  }

  async cadastrar(dto: CriarEmpresaDto) {
    const cnpj = apenasDigitos(dto.cnpj);
    if (!cnpjValido(cnpj)) {
      throw new BadRequestException('CNPJ invalido. Confira o numero informado.');
    }

    const existente = await this.prisma.empresa.findFirst({
      where: { OR: [{ cnpj }, { cnpj: dto.cnpj }, { email: dto.email }] },
    });
    if (existente) {
      throw new ConflictException('Ja existe uma empresa cadastrada com este CNPJ ou e-mail.');
    }

    const senhaHash = await argon2.hash(dto.senha);
    const empresa = await this.prisma.empresa.create({
      data: {
        razaoSocial: dto.razaoSocial,
        cnpj,
        email: dto.email,
        senhaHash,
        statusAprovacao: 'pendente',
        usuarios: {
          create: {
            nome: dto.razaoSocial,
            email: dto.email,
            papel: 'admin_empresa',
          },
        },
      },
    });

    const { senhaHash: _senhaHash, twoFaSecret: _twoFaSecret, ...semSegredos } = empresa;
    return semSegredos;
  }

  async estatisticasBanco(empresaId: string) {
    await this.validarEmpresa(empresaId);
    const [totalCadastrados, curriculosAtivos] = await Promise.all([
      this.prisma.candidato.count(),
      this.prisma.candidato.count({ where: { ativo: true } }),
    ]);

    return {
      totalCadastrados,
      curriculosAtivos,
    };
  }

  async listarCandidatos(
    empresaId: string,
    filtros: {
      q?: string;
      area?: string;
      regiao?: string;
      uf?: string;
      escolaridade?: string;
      experiencia?: string;
      cnh?: string;
      turno?: string;
      inicioImediato?: string;
      pretensaoSalarial?: string;
      cursos?: string;
      cidades?: string;
      semantica?: string;
      tipoOportunidade?: string;
    },
  ) {
    await this.validarEmpresa(empresaId);
    const termo = filtros.q?.trim();
    const cidades = filtros.cidades
      ?.split(',')
      .map((cidade) => cidade.trim())
      .filter(Boolean)
      .slice(0, 853);
    const cursos = filtros.cursos
      ?.split(',')
      .map((curso) => curso.trim())
      .filter(Boolean)
      .slice(0, 20);
    const idsSemanticos = termo && filtros.semantica === '1'
      ? await this.buscarIdsSemanticos(termo)
      : null;

    const and: any[] = [];
    if (cidades?.length) {
      and.push({ OR: cidades.map((cidade) => ({ regiao: { contains: cidade, mode: 'insensitive' as const } })) });
    }
    if (filtros.tipoOportunidade === 'jovem_aprendiz') {
      const hoje = new Date();
      const dataMax = new Date(hoje.getFullYear() - 14, hoje.getMonth(), hoje.getDate());
      const dataMin = new Date(hoje.getFullYear() - 25, hoje.getMonth(), hoje.getDate());
      and.push({
        OR: [
          { interesseJovemAprendiz: true },
          { cargoPretendido: { contains: 'aprendiz', mode: 'insensitive' } },
          { cargoPretendido: { contains: 'jovem', mode: 'insensitive' } },
          { cargoPretendido: { contains: 'talento', mode: 'insensitive' } },
          { experiencias: { some: { cargo: { contains: 'aprendiz', mode: 'insensitive' } } } },
          {
            AND: [
              { dataNascimento: { gte: dataMin, lte: dataMax } },
              {
                OR: [
                  { anosExperienciaTotal: 'sem_experiencia' },
                  { anosExperienciaTotal: 'ate_1_ano' },
                  { anosExperienciaTotal: null },
                ],
              },
            ],
          },
        ],
      });
    }
    if (termo && !idsSemanticos) {
      and.push({
        OR: [
          { nome: { contains: termo, mode: 'insensitive' } },
          { regiao: { contains: termo, mode: 'insensitive' } },
          { areaPretendida: { contains: termo, mode: 'insensitive' } },
          { cargoPretendido: { contains: termo, mode: 'insensitive' } },
          { experiencias: { some: { cargo: { contains: termo, mode: 'insensitive' } } } },
          { habilidades: { some: { habilidade: { nome: { contains: termo, mode: 'insensitive' } } } } },
        ],
      });
    }

    const candidatos = await this.prisma.candidato.findMany({
      where: {
        ativo: true,
        ...(idsSemanticos ? { id: { in: idsSemanticos } } : {}),
        ...(filtros.area ? { areaPretendida: filtros.area } : {}),
        ...(filtros.regiao ? { regiao: { contains: filtros.regiao.trim(), mode: 'insensitive' } } : {}),
        ...(filtros.uf ? { uf: { equals: filtros.uf.trim(), mode: 'insensitive' } } : {}),
        ...(filtros.escolaridade ? { escolaridade: filtros.escolaridade as any } : {}),
        ...(filtros.experiencia ? { anosExperienciaTotal: filtros.experiencia } : {}),
        ...(filtros.cnh === 'sim' ? { possuiCnh: true } : {}),
        ...(filtros.turno ? { turnos: { has: filtros.turno } } : {}),
        ...(filtros.inicioImediato === 'sim' ? { inicioImediato: true } : {}),
        ...(filtros.pretensaoSalarial ? { pretensaoSalarial: filtros.pretensaoSalarial } : {}),
        ...(cursos?.length ? { cursosCertificacoes: { hasSome: cursos } } : {}),
        ...(and.length ? { AND: and } : {}),
      },
      orderBy: { dataUltimaRevalidacao: 'desc' },
      take: 100,
      include: {
        experiencias: { orderBy: { dataInicio: 'desc' } },
        formacoes: true,
        habilidades: { include: { habilidade: true } },
        statusContratacoes: { where: { empresaId }, orderBy: { dataAtualizacao: 'desc' }, take: 1 },
      },
    });

    return candidatos.map(({ senhaHash: _senhaHash, cpf: _cpf, ...candidato }) => ({
      ...candidato,
      habilidades: candidato.habilidades.map((item) => item.habilidade.nome),
      statusEmpresa: candidato.statusContratacoes[0]?.status ?? null,
      dataAdmissaoEmpresa: candidato.statusContratacoes[0]?.dataAdmissao ?? null,
      comentarioEmpresa: candidato.statusContratacoes[0]?.comentario ?? null,
    }));
  }

  private async buscarIdsSemanticos(consulta: string) {
    const chave = consulta.toLocaleLowerCase('pt-BR');
    const cache = semanticCache.get(chave);
    if (cache && cache.expiraEm > Date.now()) return cache.ids;

    const embedding = await gerarEmbedding(consulta);
    let linhas: Array<{ id: string }> = [];
    try {
      linhas = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `select id::text
         from candidatos
         where ativo = true and embedding is not null
         order by embedding <=> $1::vector
         limit 100`,
        vetorPg(embedding),
      );

      if (linhas.length === 0) {
        const totalComEmbedding = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
          `select count(*)::int as count from candidatos where embedding is not null`,
        );
        if ((totalComEmbedding[0]?.count ?? 0) === 0) {
          await this.backfillEmbeddingsAutomatico();
          linhas = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
            `select id::text
             from candidatos
             where ativo = true and embedding is not null
             order by embedding <=> $1::vector
             limit 100`,
            vetorPg(embedding),
          );
        }
      }
    } catch {
      linhas = [];
    }

    const ids = linhas.map((linha) => linha.id);
    if (ids.length > 0) {
      semanticCache.set(chave, { ids, expiraEm: Date.now() + SEMANTIC_CACHE_TTL_MS });
    }
    return ids;
  }

  private async backfillEmbeddingsAutomatico() {
    try {
      const candidatos = await this.prisma.candidato.findMany({
        where: { ativo: true },
        include: {
          experiencias: true,
          formacoes: true,
          habilidades: { include: { habilidade: true } },
        },
        take: 200,
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
    } catch {
      // continua sem erro caso a extensão vector ainda não esteja instalada no banco
    }
  }

  async atualizarStatusCandidato(
    empresaId: string,
    candidatoId: string,
    dto: { status: StatusCandidatura; dataAdmissao?: string; comentario?: string },
  ) {
    await this.validarEmpresa(empresaId);
    const candidato = await this.prisma.candidato.findFirst({ where: { id: candidatoId, ativo: true } });
    if (!candidato) throw new NotFoundException('Curriculo nao encontrado.');
    if (!Object.values(StatusCandidatura).includes(dto.status)) {
      throw new BadRequestException('Status de candidatura invalido.');
    }
    if (dto.status === 'CONTRATADO' && !dto.dataAdmissao) {
      throw new BadRequestException('Informe a data de admissao para marcar como contratado.');
    }
    const dataAdmissao = dto.dataAdmissao ? new Date(dto.dataAdmissao) : null;
    if (dto.dataAdmissao && Number.isNaN(dataAdmissao?.getTime())) {
      throw new BadRequestException('Data de admissao invalida.');
    }
    const comentario = dto.comentario?.trim() ? dto.comentario.trim().slice(0, 1000) : null;

    const registro = await this.prisma.statusContratacao.upsert({
      where: {
        candidatoId_empresaId: {
          candidatoId,
          empresaId,
        },
      },
      update: { status: dto.status, dataAdmissao, comentario },
      create: { candidatoId, empresaId, status: dto.status, dataAdmissao, comentario },
    });

    await this.prisma.logVisualizacao.create({ data: { empresaId, candidatoId } });
    if (dto.status === 'CONTRATADO') {
      await this.prisma.candidato.update({
        where: { id: candidatoId },
        data: { ativo: false, dataInativacao: new Date() },
      });
    }
    return registro;
  }

  async criarVaga(empresaId: string, dto: { area: string; requisitos: string }) {
    await this.validarEmpresa(empresaId);
    const vaga = await this.prisma.vagaNecessidade.create({
      data: {
        empresaId,
        area: dto.area,
        requisitos: dto.requisitos,
        ativa: true,
      },
    });

    const candidatos = await this.prisma.candidato.findMany({
      where: { ativo: true, areaPretendida: dto.area },
      select: { id: true },
      take: 50,
    });

    await this.prisma.notificacao.createMany({
      data: candidatos.map((candidato) => ({
        candidatoId: candidato.id,
        tipo: 'alerta_reverso',
        canal: 'email',
        statusEnvio: 'pendente',
      })),
      skipDuplicates: true,
    });

    return vaga;
  }

  async listarVagas(empresaId: string) {
    await this.validarEmpresa(empresaId);
    return this.prisma.vagaNecessidade.findMany({
      where: { empresaId },
      orderBy: { id: 'desc' },
      take: 50,
    });
  }

  async excluirVaga(empresaId: string, vagaId: string) {
    await this.validarEmpresa(empresaId);
    const vaga = await this.prisma.vagaNecessidade.findFirst({
      where: { id: vagaId, empresaId },
    });
    if (!vaga) throw new NotFoundException('Necessidade nao encontrada.');
    await this.prisma.vagaNecessidade.delete({ where: { id: vagaId } });
    return { ok: true };
  }

  async gerarPdfCandidato(empresaId: string, candidatoId: string) {
    await this.validarEmpresa(empresaId);
    const candidato = await this.prisma.candidato.findFirst({
      where: { id: candidatoId, ativo: true },
      include: {
        experiencias: { orderBy: { dataInicio: 'desc' } },
        formacoes: true,
        habilidades: { include: { habilidade: true } },
      },
    });
    if (!candidato) throw new NotFoundException('Curriculo nao encontrado.');

    await this.prisma.logVisualizacao.create({
      data: { empresaId, candidatoId },
    });

    const pdf = await gerarCurriculoPdf(candidato);
    return { pdf, nome: candidato.nome };
  }

  private async validarEmpresa(empresaId: string) {
    if (!empresaId) throw new ForbiddenException('Acesso permitido apenas para empresa.');
    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) throw new ForbiddenException('Empresa nao encontrada.');
    if (empresa.statusAprovacao !== 'aprovada') {
      throw new ForbiddenException('Empresa ainda nao aprovada.');
    }
    return empresa;
  }
}
