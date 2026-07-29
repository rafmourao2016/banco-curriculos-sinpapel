import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, ArrayMaxSize } from 'class-validator';

export class AtualizarCandidatoDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regiao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string;

  @IsOptional()
  @IsBoolean()
  possuiCnh?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  categoriaCnh?: string;

  @IsOptional()
  @IsIn(['producao', 'manutencao', 'administrativo', 'logistica', 'qualidade', 'comercial', 'ti', 'engenharia', 'outra'])
  areaPretendida?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cargoPretendido?: string;

  @IsOptional()
  @IsIn(['ate_1500', '1501_2500', '2501_3500', '3501_5000', 'acima_5000', 'a_combinar'])
  pretensaoSalarial?: string;

  @IsOptional()
  @IsBoolean()
  experienciaSetorPapel?: boolean;

  @IsOptional()
  @IsIn(['sem_experiencia', 'ate_1_ano', '1_3_anos', '3_5_anos', 'mais_5_anos'])
  anosExperienciaTotal?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsIn(['manha', 'tarde', 'noite', 'revezamento'], { each: true })
  turnos?: string[];

  @IsOptional()
  @IsBoolean()
  inicioImediato?: boolean;

  @IsOptional()
  @IsBoolean()
  disponibilidadeMudanca?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  cursosCertificacoes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  idiomas?: string[];

  @IsOptional()
  @IsBoolean()
  pcd?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pcdObservacao?: string;
}
