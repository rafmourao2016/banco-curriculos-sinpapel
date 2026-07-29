import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExperienciaDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  empresa?: string;

  @IsString()
  @MaxLength(120)
  cargo: string;

  @IsString()
  @MaxLength(120)
  area: string;

  @IsDateString()
  dataInicio: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descricao?: string;
}
