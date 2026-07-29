import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CriarEmpresaDto {
  @IsString()
  @MaxLength(180)
  razaoSocial: string;

  @IsString()
  @MaxLength(18)
  cnpj: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no minimo 8 caracteres.' })
  @MaxLength(72)
  senha: string;
}
