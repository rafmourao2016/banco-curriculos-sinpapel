import { Body, Controller, Delete, Get, Ip, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CandidatosService } from './candidatos.service';
import { CriarCandidatoDto } from './dto/criar-candidato.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('candidatos')
export class CandidatosController {
  constructor(private readonly candidatosService: CandidatosService) {}

  // Rota pública — único ponto de entrada do candidato antes do login.
  @Post()
  cadastrar(@Body() dto: CriarCandidatoDto, @Ip() ip: string) {
    return this.candidatosService.cadastrar(dto, ip);
  }

  // A partir daqui, apenas o próprio candidato autenticado tem acesso —
  // nunca outros candidatos ou o público em geral.
  @UseGuards(JwtAuthGuard)
  @Get('me')
  buscarMeuPerfil(@Req() req: any) {
    return this.candidatosService.buscarPerfilProprio(req.candidatoId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/confirmar-disponibilidade')
  confirmarDisponibilidade(@Req() req: any) {
    return this.candidatosService.confirmarDisponibilidade(req.candidatoId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  excluirConta(@Req() req: any) {
    return this.candidatosService.excluirConta(req.candidatoId);
  }
}
