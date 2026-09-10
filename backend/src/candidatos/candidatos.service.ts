import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { CriarCandidatoDto } from './dto/criar-candidato.dto';
import { AtualizarCandidatoDto } from './dto/atualizar-candidato.dto';
import { gerarCurriculoPdf } from '../common/curriculo-pdf';
import { gerarEmbedding, vetorPg } from '../common/embedding';
import { apenasDigitos, cpfValido } from '../common/documentos';

@Injectable()
export class CandidatosService {
  private cadastrosAtivos = 0;
  private readonly filaCadastro: Array<() => void> = [];
  private readonly concorrenciaCadastro = Math.max(
    1,
    Math.min(Number(process.env.CANDIDATE_REGISTRATION_CONCURRENCY) || 5, 20),
  );

  constructor(private readonly prisma: PrismaService) {}

  async cadastrar(dto: CriarCandidatoDto, ip: string) {
    return this.executarCadastroNaFila(() => this.cadastrarNoBanco(dto, ip));
  }

  private async executarCadastroNaFila<T>(tarefa: () => Promise<T>) {
    if (this.cadastrosAtivos >= this.concorrenciaCadastro) {
      await new Promise<void>((resolve) => this.filaCadastro.push(resolve));
    }

    this.cadastrosAtivos += 1;

    try {
      return await tarefa();
    } finally {
      this.cadastrosAtivos -= 1;
      const proximo = this.filaCadastro.shift();
      if (proximo) proximo();
    }
  }

  private async cadastrarNoBanco(dto: CriarCandidatoDto, ip: string) {
    if (!dto.aceiteTermoLgpd) {
      throw new BadRequestException('O aceite do termo de consentimento LGPD é obrigatório.');
    }

    const cpf = apenasDigitos(dto.cpf);
    if (!cpfValido(cpf)) {
      throw new BadRequestException('CPF invalido. Confira o numero informado.');
    }

    const existente = await this.prisma.candidato.findFirst({
      where: { OR: [{ cpf }, { cpf: dto.cpf }, { email: dto.email }] },
    });
    if (existente) {
      throw new ConflictException('Já existe um candidato cadastrado com este CPF ou e-mail.');
    }

    const senhaHash = await argon2.hash(dto.senha);

    // Garante que as habilidades informadas existam na tabela de referência
    // (usada depois pela busca semântica via embeddings).
    const habilidades = await Promise.all(
      dto.habilidades.map((nome) =>
        this.prisma.habilidade.upsert({
          where: { nome: nome.trim().toLowerCase() },
          update: {},
          create: { nome: nome.trim().toLowerCase() },
        }),
      ),
    );

    const candidato = await this.prisma.candidato.create({
      data: {
        nome: dto.nome,
        cpf,
        email: dto.email,
        telefone: dto.telefone,
        dataNascimento: new Date(dto.dataNascimento),
        cep: dto.cep,
        logradouro: dto.logradouro,
        bairro: dto.bairro,
        numeroEndereco: dto.numeroEndereco,
        complementoEndereco: dto.complementoEndereco,
        regiao: dto.regiao,
        uf: dto.uf,
        escolaridade: dto.escolaridade,
        possuiCnh: dto.possuiCnh,
        categoriaCnh: dto.categoriaCnh,
        areaPretendida: dto.areaPretendida,
        cargoPretendido: dto.cargoPretendido,
        pretensaoSalarial: dto.pretensaoSalarial,
        experienciaSetorPapel: dto.experienciaSetorPapel,
        anosExperienciaTotal: dto.anosExperienciaTotal,
        turnos: dto.turnos,
        inicioImediato: dto.inicioImediato,
        disponibilidadeMudanca: dto.disponibilidadeMudanca,
        cursosCertificacoes: dto.cursosCertificacoes,
        idiomas: dto.idiomas,
        pcd: dto.pcd,
        pcdObservacao: dto.pcdObservacao,
        senhaHash,
        experiencias: {
          create: dto.experiencias.map((exp) => ({
            empresa: exp.empresa,
            cargo: exp.cargo,
            area: exp.area,
            dataInicio: new Date(exp.dataInicio),
            dataFim: exp.dataFim ? new Date(exp.dataFim) : null,
            descricao: exp.descricao,
          })),
        },
        formacoes: {
          create: dto.formacoes.map((f) => ({
            nivel: f.nivel,
            curso: f.curso,
            instituicao: f.instituicao,
            status: f.status,
            ano: f.ano,
          })),
        },
        habilidades: {
          create: habilidades.map((h) => ({ habilidadeId: h.id })),
        },
        termoConsentimento: {
          create: {
            versao: '1.0',
            ip,
          },
        },
      },
      include: { experiencias: true, formacoes: true, habilidades: true },
    });

    const { senhaHash: _omit, ...candidatoSemSenha } = candidato;
    await this.registrarAlertasCompatibilidade(candidato.id, dto.areaPretendida);
    return candidatoSemSenha;
  }

  async buscarPerfilProprio(candidatoId: string) {
    const candidato = await this.prisma.candidato.findUnique({
      where: { id: candidatoId },
      include: { experiencias: true, formacoes: true, habilidades: { include: { habilidade: true } } },
    });
    if (!candidato) throw new NotFoundException('Candidato não encontrado.');
    const { senhaHash, ...resto } = candidato;
    return resto;
  }

  async atualizarPerfilProprio(candidatoId: string, dto: AtualizarCandidatoDto) {
    const candidato = await this.prisma.candidato.findUnique({ where: { id: candidatoId } });
    if (!candidato) throw new NotFoundException('Candidato não encontrado.');

    const atualizado = await this.prisma.candidato.update({
      where: { id: candidatoId },
      data: {
        telefone: dto.telefone,
        cep: dto.cep,
        logradouro: dto.logradouro,
        bairro: dto.bairro,
        numeroEndereco: dto.numeroEndereco,
        complementoEndereco: dto.complementoEndereco,
        regiao: dto.regiao,
        uf: dto.uf,
        possuiCnh: dto.possuiCnh,
        categoriaCnh: dto.categoriaCnh,
        areaPretendida: dto.areaPretendida,
        cargoPretendido: dto.cargoPretendido,
        pretensaoSalarial: dto.pretensaoSalarial,
        experienciaSetorPapel: dto.experienciaSetorPapel,
        anosExperienciaTotal: dto.anosExperienciaTotal,
        turnos: dto.turnos,
        inicioImediato: dto.inicioImediato,
        disponibilidadeMudanca: dto.disponibilidadeMudanca,
        cursosCertificacoes: dto.cursosCertificacoes,
        idiomas: dto.idiomas,
        pcd: dto.pcd,
        pcdObservacao: dto.pcdObservacao,
        ativo: true,
        dataUltimaRevalidacao: new Date(),
      },
      include: { experiencias: true, formacoes: true, habilidades: { include: { habilidade: true } } },
    });

    const { senhaHash, ...resto } = atualizado;
    if (dto.areaPretendida) {
      await this.registrarAlertasCompatibilidade(candidatoId, dto.areaPretendida);
    }
    return resto;
  }

  // Exclusão imediata, conforme direito garantido pela LGPD.
  async excluirConta(candidatoId: string) {
    const candidato = await this.prisma.candidato.findUnique({ where: { id: candidatoId } });
    if (!candidato) throw new NotFoundException('Candidato não encontrado.');
    await this.prisma.candidato.delete({ where: { id: candidatoId } });
    return { mensagem: 'Conta e dados pessoais excluídos com sucesso.' };
  }

  async confirmarDisponibilidade(candidatoId: string) {
    const candidato = await this.prisma.candidato.update({
      where: { id: candidatoId },
      data: { ativo: true, dataInativacao: null, dataUltimaRevalidacao: new Date() },
    });
    const { senhaHash, ...resto } = candidato;
    return resto;
  }

  async confirmarDisponibilidadePorToken(token: string) {
    const notificacao = await this.buscarNotificacaoRevalidacao(token);

    await this.prisma.$transaction([
      this.prisma.candidato.update({
        where: { id: notificacao.candidatoId },
        data: { ativo: true, dataInativacao: null, dataUltimaRevalidacao: new Date() },
      }),
      this.prisma.notificacao.update({
        where: { id: notificacao.id },
        data: { usadoEm: new Date(), statusEnvio: 'confirmado' },
      }),
    ]);

    return { mensagem: 'Disponibilidade confirmada. Seu curriculo continua ativo no banco do SINPAPEL.' };
  }

  async excluirContaPorToken(token: string) {
    const notificacao = await this.buscarNotificacaoRevalidacao(token);

    await this.prisma.notificacao.update({
      where: { id: notificacao.id },
      data: { usadoEm: new Date(), statusEnvio: 'exclusao_solicitada' },
    });
    await this.prisma.candidato.delete({ where: { id: notificacao.candidatoId } });

    return { mensagem: 'Curriculo removido com sucesso do banco do SINPAPEL.' };
  }

  async gerarPdfProprio(candidatoId: string) {
    const candidato = await this.prisma.candidato.findUnique({
      where: { id: candidatoId },
      include: {
        experiencias: { orderBy: { dataInicio: 'desc' } },
        formacoes: true,
        habilidades: { include: { habilidade: true } },
      },
    });
    if (!candidato) throw new NotFoundException('Candidato nÃ£o encontrado.');
    return gerarCurriculoPdf(candidato);
  }

  private async registrarAlertasCompatibilidade(candidatoId: string, areaPretendida?: string | null) {
    if (!areaPretendida) return;
    const vagas = await this.prisma.vagaNecessidade.findMany({
      where: { ativa: true, area: areaPretendida },
      select: { id: true },
      take: 50,
    });
    if (vagas.length === 0) return;

    await this.prisma.notificacao.createMany({
      data: vagas.map(() => ({
        candidatoId,
        tipo: 'alerta_reverso',
        canal: 'email',
        statusEnvio: 'pendente',
      })),
      skipDuplicates: true,
    });
  }

  private async textoEmbedding(candidatoId: string) {
    const candidato = await this.prisma.candidato.findUnique({
      where: { id: candidatoId },
      include: {
        experiencias: true,
        formacoes: true,
        habilidades: { include: { habilidade: true } },
      },
    });
    if (!candidato) return '';
    return [
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
  }

  private async atualizarEmbedding(candidatoId: string) {
    const texto = await this.textoEmbedding(candidatoId);
    if (!texto) return;
    const embedding = await gerarEmbedding(texto);
    await this.prisma.$executeRawUnsafe(
      `update candidatos set embedding = $1::vector where id = $2::uuid`,
      vetorPg(embedding),
      candidatoId,
    );
  }

  private async buscarNotificacaoRevalidacao(token: string) {
    if (!token?.trim()) {
      throw new BadRequestException('Token de revalidacao nao informado.');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const notificacao = await this.prisma.notificacao.findFirst({
      where: {
        tokenHash,
        tipo: 'revalidacao',
      },
    });

    if (!notificacao || notificacao.usadoEm || !notificacao.expiraEm || notificacao.expiraEm <= new Date()) {
      throw new BadRequestException('Link de revalidacao invalido ou expirado.');
    }

    return notificacao;
  }
}
