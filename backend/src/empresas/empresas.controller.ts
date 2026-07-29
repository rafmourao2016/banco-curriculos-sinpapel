import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { StatusCandidatura } from '@prisma/client';
import { Response } from 'express';
import { EmpresasService } from './empresas.service';
import { CriarEmpresaDto } from './dto/criar-empresa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  cadastrar(@Body() dto: CriarEmpresaDto) {
    return this.empresasService.cadastrar(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  status2fa(@Req() req: any) {
    return this.empresasService.status2fa(req.empresaId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  iniciar2fa(@Req() req: any) {
    return this.empresasService.iniciar2fa(req.empresaId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/confirmar')
  confirmar2fa(@Req() req: any, @Body('codigo') codigo: string) {
    return this.empresasService.confirmar2fa(req.empresaId, codigo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/desativar')
  desativar2fa(@Req() req: any, @Body('codigo') codigo: string) {
    return this.empresasService.desativar2fa(req.empresaId, codigo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('candidatos')
  listarCandidatos(@Req() req: any, @Query() query: any) {
    return this.empresasService.listarCandidatos(req.empresaId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('candidatos/:id/status')
  atualizarStatus(
    @Req() req: any,
    @Param('id') candidatoId: string,
    @Body() body: { status: StatusCandidatura; dataAdmissao?: string; comentario?: string },
  ) {
    return this.empresasService.atualizarStatusCandidato(req.empresaId, candidatoId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('vagas')
  criarVaga(@Req() req: any, @Body() dto: { area: string; requisitos: string }) {
    return this.empresasService.criarVaga(req.empresaId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('vagas')
  listarVagas(@Req() req: any) {
    return this.empresasService.listarVagas(req.empresaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('candidatos/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async baixarPdf(@Req() req: any, @Param('id') candidatoId: string, @Res() res: Response) {
    const pdf = await this.empresasService.gerarPdfCandidato(req.empresaId, candidatoId);
    res.setHeader('Content-Disposition', `attachment; filename="curriculo-${candidatoId}.pdf"`);
    res.send(pdf);
  }
}
