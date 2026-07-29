import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ExperienciaDto } from './experiencia.dto';
import { FormacaoDto } from './formacao.dto';

// Importante: este DTO representa o contrato do cadastro "mobile-first".
// Propositalmente NÃO existe um campo de upload de arquivo (ex.: PDF) aqui —
// a regra de negócio exige que a fonte de dados de busca seja sempre
// estruturada, nunca extraída de um documento livre.
export enum EscolaridadeDto {
  FUNDAMENTAL_INCOMPLETO = 'FUNDAMENTAL_INCOMPLETO',
  FUNDAMENTAL_COMPLETO = 'FUNDAMENTAL_COMPLETO',
  MEDIO_INCOMPLETO = 'MEDIO_INCOMPLETO',
  MEDIO_COMPLETO = 'MEDIO_COMPLETO',
  SUPERIOR_INCOMPLETO = 'SUPERIOR_INCOMPLETO',
  SUPERIOR_COMPLETO = 'SUPERIOR_COMPLETO',
  POS_GRADUACAO = 'POS_GRADUACAO',
}

export class CriarCandidatoDto {
  @IsString()
  @MaxLength(150)
  nome: string;

  @IsString()
  @MaxLength(14)
  cpf: string;

  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(20)
  telefone: string;

  @IsDateString()
  dataNascimento: string;

  @IsString()
  @MaxLength(100)
  regiao: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string;

  @IsEnum(EscolaridadeDto)
  escolaridade: EscolaridadeDto;

  @IsBoolean()
  possuiCnh: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  categoriaCnh?: string;

  @IsIn(['producao', 'manutencao', 'administrativo', 'logistica', 'qualidade', 'comercial', 'ti', 'engenharia', 'outra'])
  areaPretendida: string;

  @IsString()
  @MaxLength(120)
  cargoPretendido: string;

  @IsIn(['ate_1500', '1501_2500', '2501_3500', '3501_5000', 'acima_5000', 'a_combinar'])
  pretensaoSalarial: string;

  @IsBoolean()
  experienciaSetorPapel: boolean;

  @IsIn(['sem_experiencia', 'ate_1_ano', '1_3_anos', '3_5_anos', 'mais_5_anos'])
  anosExperienciaTotal: string;

  @IsArray()
  @ArrayMaxSize(4)
  @IsIn(['manha', 'tarde', 'noite', 'revezamento'], { each: true })
  turnos: string[];

  @IsBoolean()
  inicioImediato: boolean;

  @IsBoolean()
  disponibilidadeMudanca: boolean;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  cursosCertificacoes: string[];

  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  idiomas: string[];

  @IsBoolean()
  pcd: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pcdObservacao?: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no minimo 8 caracteres.' })
  @MaxLength(72)
  senha: string;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ExperienciaDto)
  experiencias: ExperienciaDto[];

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => FormacaoDto)
  formacoes: FormacaoDto[];

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  habilidades: string[];

  @IsBoolean()
  aceiteTermoLgpd: boolean;
}
