import PDFDocument = require('pdfkit');

type CurriculoPdf = {
  nome: string;
  email: string;
  telefone: string;
  regiao: string;
  uf?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  numeroEndereco?: string | null;
  complementoEndereco?: string | null;
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
  return texto(valor?.replaceAll('_', ' ')) || 'Não informado';
}

function texto(valor?: unknown) {
  return String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function lista<T>(valor: T[] | null | undefined): T[] {
  return Array.isArray(valor) ? valor : [];
}

function data(valor?: Date | string | null) {
  if (!valor) return 'Atual';
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Atual';
  return new Intl.DateTimeFormat('pt-BR').format(data);
}

function habilidades(candidato: CurriculoPdf) {
  return lista(candidato.habilidades)
    .map((item) => (typeof item === 'string' ? item : item?.habilidade?.nome))
    .map(texto)
    .filter(Boolean)
    .join(', ');
}

function listaTexto(valor?: string[] | null) {
  const itens = lista(valor).map(texto).filter(Boolean);
  return itens.length ? itens.join(', ') : 'Não informado';
}

export async function gerarCurriculoPdf(candidato: CurriculoPdf) {
  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.rect(0, 0, 595.28, 92).fill('#116dff');
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('BANCO DE CURRÍCULOS DO SINPAPEL', 48, 28);
  doc.fontSize(24).text(texto(candidato.nome) || 'Candidato', 48, 45, { width: 500 });

  doc.fillColor('#111827').font('Helvetica').fontSize(10);
  doc.moveDown(3.2);
  doc.text(`${texto(candidato.email) || 'E-mail não informado'}  |  ${texto(candidato.telefone) || 'Telefone não informado'}`);
  doc.text(`${texto(candidato.regiao) || 'Cidade não informada'}${candidato.uf ? `/${texto(candidato.uf)}` : ''}`);
  const endereco = [
    texto(candidato.logradouro),
    texto(candidato.numeroEndereco),
    texto(candidato.bairro),
    candidato.cep ? `CEP ${texto(candidato.cep)}` : null,
  ].filter(Boolean).join(', ');
  if (endereco) {
    doc.text(`Endereço: ${endereco}${candidato.complementoEndereco ? ` - ${texto(candidato.complementoEndereco)}` : ''}`);
  }

  doc.moveDown(1.2);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Objetivo profissional');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  doc.text(`Cargo pretendido: ${normalizar(candidato.cargoPretendido)}`);
  doc.text(`Área pretendida: ${normalizar(candidato.areaPretendida)}`);
  doc.text(`Pretensão salarial: ${normalizar(candidato.pretensaoSalarial)}`);
  doc.text(`Turnos: ${listaTexto(candidato.turnos)}`);

  doc.moveDown(1.1);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Resumo');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  doc.text(`Escolaridade: ${normalizar(candidato.escolaridade)}`);
  doc.text(`Experiência total: ${normalizar(candidato.anosExperienciaTotal)}`);
  doc.text(`Experiência no setor papel/embalagem: ${candidato.experienciaSetorPapel ? 'Sim' : 'Não informado'}`);
  doc.text(`CNH: ${candidato.possuiCnh ? texto(candidato.categoriaCnh) || 'Sim' : 'Não'}`);
  doc.text(`Habilidades: ${habilidades(candidato) || 'Não informado'}`);

  doc.moveDown(1.1);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Experiência profissional');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  const experiencias = lista(candidato.experiencias);
  if (experiencias.length === 0) {
    doc.text('Não informado');
  } else {
    experiencias.forEach((exp) => {
      doc.font('Helvetica-Bold').text(texto(exp.cargo) || 'Cargo não informado');
      doc.font('Helvetica').text(`${texto(exp.empresa) || 'Empresa não informada'} - ${texto(exp.area) || 'Área não informada'}`);
      doc.text(`${data(exp.dataInicio)} a ${data(exp.dataFim)}`);
      if (exp.descricao) doc.text(texto(exp.descricao), { width: 500 });
      doc.moveDown(0.7);
    });
  }

  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Formação');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  const formacoes = lista(candidato.formacoes);
  if (formacoes.length === 0) {
    doc.text('Não informado');
  } else {
    formacoes.forEach((formacao) => {
      doc.font('Helvetica-Bold').text(texto(formacao.curso) || 'Curso não informado');
      doc.font('Helvetica').text(`${normalizar(formacao.nivel)} - ${texto(formacao.instituicao) || 'Instituição não informada'} - ${normalizar(formacao.status)}${formacao.ano ? ` (${formacao.ano})` : ''}`);
    });
  }

  doc.moveDown(1.1);
  doc.fillColor('#d10606').font('Helvetica-Bold').fontSize(13).text('Cursos e idiomas');
  doc.fillColor('#111827').font('Helvetica').fontSize(10).moveDown(0.4);
  doc.text(`Cursos/certificações: ${listaTexto(candidato.cursosCertificacoes)}`);
  doc.text(`Idiomas: ${listaTexto(candidato.idiomas)}`);

  doc.moveDown(1.5);
  doc.fillColor('#6b7280').fontSize(8).text('Currículo gerado automaticamente pelo Banco de Currículos do SINPAPEL.', { align: 'center' });
  doc.end();

  return done;
}
