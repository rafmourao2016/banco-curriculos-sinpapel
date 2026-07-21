import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExperienciaDto {
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
  @MaxLength(500)
  descricao?: string;
}
