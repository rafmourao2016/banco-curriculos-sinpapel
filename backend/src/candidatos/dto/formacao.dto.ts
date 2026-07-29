import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FormacaoDto {
  @IsString()
  @MaxLength(60)
  nivel: string;

  @IsString()
  @MaxLength(120)
  curso: string;

  @IsString()
  @MaxLength(120)
  instituicao: string;

  @IsIn(['concluido', 'cursando', 'trancado'])
  status: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  ano?: number;
}
