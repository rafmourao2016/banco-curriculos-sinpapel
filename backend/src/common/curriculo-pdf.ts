import PDFDocument from 'pdfkit';

type CurriculoPdf = {
  nome: string;
  email: string;
  telefone: string;
  regiao: string;
  uf?: string | null;
  escolaridade: string;
  possuiCnh: boolean;
  categoriaCnh?: string | null;
  areaPretendida?: string | null;
  cargoPretendido?: string | null;
  pretensaoSalarial?: string | null;
  experienciaSetorPapel?: boolean | null;
  anosExperienciaTotal?: string | null;
  turnos: string[];
  cursosCertificacoes: string[];
  idiomas: string[];
  experiencias: Array<{
    empresa?: string | null;
    cargo: string;
    area: string;
    dataInicio: Date;
    dataFim?: Date | null;
    descricao?: string | null;
  }>;
  formacoes: Array<{
    nivel: string;
    curso: string;
    instituicao: string;
    status: string;
    ano?: number | null;
  }>;
  habilidades: Array<{ habilidade?: { nome: string } } | string>;
};

function normalizar(valor?: string | null) {
  return valor?.replaceAll('_', ' ') || 'Nao informado';
}

function data(valor?: Date | null) {
  if (!valor) return 'Atual';
  return new Intl.DateTimeFormat('pt-BR').format(valor);
}

function habilidades(candidato: CurriculoPdf) {
  return candidato.habilidades
    .map((item) => (typeof item === 'string' ? item : item.habilidade?.nome))
    .filter(Boolean)
    .join(', ');
}

export async function gerarCurriculoPdf(candidato: CurriculoPdf) {
  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.rect(0, 0, 595.28, 92).fill('#116dff');
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('BANCO DE CURRICULOS DO SINPAPEL', 48, 28);
  doc.fontSize(24).text(candidato.nome, 48, 45, { width: 500 });

  doc.fillColor('#111827').font('Helvetica').fontSize(10);
  doc.moveDown(3.2);
  doc.text(`${candidato.email}  |  ${candidato.telefone}`);
  doc.text(`${candidato.regiao}${candidato.uf ? `/${candidato.uf}` : ''}`);

  doc.moveDown(1.2);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Objetivo profissional');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  doc.text(`Cargo pretendido: ${normalizar(candidato.cargoPretendido)}`);
  doc.text(`Area pretendida: ${normalizar(candidato.areaPretendida)}`);
  doc.text(`Pretensao salarial: ${normalizar(candidato.pretensaoSalarial)}`);
  doc.text(`Turnos: ${candidato.turnos?.length ? candidato.turnos.join(', ') : 'Nao informado'}`);

  doc.moveDown(1.1);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Resumo');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  doc.text(`Escolaridade: ${normalizar(candidato.escolaridade)}`);
  doc.text(`Experiencia total: ${normalizar(candidato.anosExperienciaTotal)}`);
  doc.text(`Experiencia no setor papel/embalagem: ${candidato.experienciaSetorPapel ? 'Sim' : 'Nao informado'}`);
  doc.text(`CNH: ${candidato.possuiCnh ? candidato.categoriaCnh || 'Sim' : 'Nao'}`);
  doc.text(`Habilidades: ${habilidades(candidato) || 'Nao informado'}`);

  doc.moveDown(1.1);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Experiencia profissional');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  if (candidato.experiencias.length === 0) {
    doc.text('Nao informado');
  } else {
    candidato.experiencias.forEach((exp) => {
      doc.font('Helvetica-Bold').text(exp.cargo);
      doc.font('Helvetica').text(`${exp.empresa || 'Empresa nao informada'} - ${exp.area}`);
      doc.text(`${data(exp.dataInicio)} a ${data(exp.dataFim)}`);
      if (exp.descricao) doc.text(exp.descricao, { width: 500 });
      doc.moveDown(0.7);
    });
  }

  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Formacao');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  candidato.formacoes.forEach((formacao) => {
    doc.font('Helvetica-Bold').text(formacao.curso);
    doc.font('Helvetica').text(`${formacao.instituicao} - ${normalizar(formacao.status)}${formacao.ano ? ` (${formacao.ano})` : ''}`);
  });

  doc.moveDown(1.1);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Cursos e idiomas');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  doc.text(`Cursos/certificacoes: ${candidato.cursosCertificacoes?.length ? candidato.cursosCertificacoes.join(', ') : 'Nao informado'}`);
  doc.text(`Idiomas: ${candidato.idiomas?.length ? candidato.idiomas.join(', ') : 'Nao informado'}`);

  doc.moveDown(1.5);
  doc.fillColor('#6b7280').fontSize(8).text('Curriculo gerado automaticamente pelo Banco de Curriculos do SINPAPEL.', { align: 'center' });
  doc.end();

  return done;
}
