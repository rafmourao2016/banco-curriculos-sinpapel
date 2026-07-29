import { Controller, Get, Header, Headers, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AtsService } from './ats.service';
import { EmpresasService } from '../empresas/empresas.service';

@Controller('ats')
export class AtsController {
  constructor(
    private readonly atsService: AtsService,
    private readonly empresasService: EmpresasService,
  ) {}

  @Get('candidatos')
  async listar(@Headers('x-api-key') apiKey: string | undefined, @Query() query: any) {
    const empresaId = await this.atsService.autenticar(apiKey);
    return this.empresasService.listarCandidatos(empresaId, query);
  }

  @Get('candidatos/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(@Headers('x-api-key') apiKey: string | undefined, @Param('id') candidatoId: string, @Res() res: Response) {
    const empresaId = await this.atsService.autenticar(apiKey);
    const pdf = await this.empresasService.gerarPdfCandidato(empresaId, candidatoId);
    res.setHeader('Content-Disposition', `attachment; filename="curriculo-${candidatoId}.pdf"`);
    res.send(pdf);
  }
}
