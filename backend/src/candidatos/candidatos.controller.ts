import { Body, Controller, Delete, Get, Header, Ip, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CandidatosService } from './candidatos.service';
import { CriarCandidatoDto } from './dto/criar-candidato.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtualizarCandidatoDto } from './dto/atualizar-candidato.dto';

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
  @Get('me/pdf')
  @Header('Content-Type', 'application/pdf')
  async baixarMeuPdf(@Req() req: any, @Res() res: Response) {
    const pdf = await this.candidatosService.gerarPdfProprio(req.candidatoId);
    res.setHeader('Content-Disposition', 'attachment; filename="meu-curriculo-sinpapel.pdf"');
    res.send(pdf);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  atualizarMeuPerfil(@Req() req: any, @Body() dto: AtualizarCandidatoDto) {
    return this.candidatosService.atualizarPerfilProprio(req.candidatoId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/confirmar-disponibilidade')
  confirmarDisponibilidade(@Req() req: any) {
    return this.candidatosService.confirmarDisponibilidade(req.candidatoId);
  }

  @Get('revalidacao/confirmar')
  confirmarDisponibilidadePorToken(@Query('token') token: string) {
    return this.candidatosService.confirmarDisponibilidadePorToken(token);
  }

  @Get('revalidacao/remover')
  excluirContaPorToken(@Query('token') token: string) {
    return this.candidatosService.excluirContaPorToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  excluirConta(@Req() req: any) {
    return this.candidatosService.excluirConta(req.candidatoId);
  }
}
