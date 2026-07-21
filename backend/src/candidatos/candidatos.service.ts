import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma.service';
import { CriarCandidatoDto } from './dto/criar-candidato.dto';

@Injectable()
export class CandidatosService {
  constructor(private readonly prisma: PrismaService) {}

  async cadastrar(dto: CriarCandidatoDto, ip: string) {
    if (!dto.aceiteTermoLgpd) {
      throw new BadRequestException('O aceite do termo de consentimento LGPD é obrigatório.');
    }

    const existente = await this.prisma.candidato.findFirst({
      where: { OR: [{ cpf: dto.cpf }, { email: dto.email }] },
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
        cpf: dto.cpf,
        email: dto.email,
        telefone: dto.telefone,
        dataNascimento: new Date(dto.dataNascimento),
        regiao: dto.regiao,
        escolaridade: dto.escolaridade,
        possuiCnh: dto.possuiCnh,
        categoriaCnh: dto.categoriaCnh,
        senhaHash,
        experiencias: {
          create: dto.experiencias.map((exp) => ({
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

  // Exclusão imediata, conforme direito garantido pela LGPD.
  async excluirConta(candidatoId: string) {
    const candidato = await this.prisma.candidato.findUnique({ where: { id: candidatoId } });
    if (!candidato) throw new NotFoundException('Candidato não encontrado.');
    await this.prisma.candidato.delete({ where: { id: candidatoId } });
    return { mensagem: 'Conta e dados pessoais excluídos com sucesso.' };
  }

  async confirmarDisponibilidade(candidatoId: string) {
    return this.prisma.candidato.update({
      where: { id: candidatoId },
      data: { ativo: true, dataUltimaRevalidacao: new Date() },
    });
  }
}
