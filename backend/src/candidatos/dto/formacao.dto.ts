import { IsIn, IsString, MaxLength } from 'class-validator';

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
}
