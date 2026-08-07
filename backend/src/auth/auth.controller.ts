import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('solicitar-recuperacao')
  @HttpCode(200)
  solicitarRecuperacao(@Body() body: { email: string; tipo: 'candidato' | 'empresa' }) {
    return this.authService.solicitarRecuperacao(body.email, body.tipo);
  }

  @Post('redefinir-senha')
  @HttpCode(200)
  redefinirSenha(@Body() body: { token: string; tipo: 'candidato' | 'empresa'; senha: string }) {
    return this.authService.redefinirSenha(body.token, body.tipo, body.senha);
  }

  @Post('validar-recuperacao')
  @HttpCode(200)
  validarRecuperacao(@Body() body: { token: string; tipo: 'candidato' | 'empresa' }) {
    return this.authService.validarRecuperacao(body.token, body.tipo);
  }

  @Post('candidato/login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.loginCandidato(dto.email, dto.senha);
  }

  @Post('empresa/login')
  @HttpCode(200)
  loginEmpresa(@Body() dto: LoginDto) {
    return this.authService.loginEmpresa(dto.email, dto.senha, dto.codigo2fa);
  }
}
