import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  senha: string;

  @IsOptional()
  @IsString()
  codigo2fa?: string;
}
