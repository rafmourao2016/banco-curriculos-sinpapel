import { CadastroFormValues } from './cadastroSchema';
import { apenasDigitos } from './documentos';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function listaPorVirgula(valor?: string) {
  return (valor ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function cadastrarCandidato(dados: CadastroFormValues) {
  const payload: Record<string, unknown> = {
    nome: dados.nome,
    cpf: apenasDigitos(dados.cpf),
    email: dados.email,
    telefone: dados.telefone,
    dataNascimento: dados.dataNascimento,
    cep: apenasDigitos(dados.cep ?? '') || undefined,
    logradouro: dados.logradouro?.trim() || undefined,
    bairro: dados.bairro?.trim() || undefined,
    numeroEndereco: dados.numeroEndereco?.trim() || undefined,
    complementoEndereco: dados.complementoEndereco?.trim() || undefined,
    regiao: dados.regiao,
    uf: dados.uf.toUpperCase(),
    escolaridade: dados.escolaridade,
    possuiCnh: dados.possuiCnh,
    categoriaCnh: dados.categoriaCnh,
    areaPretendida: dados.areaPretendida,
    cargoPretendido: dados.cargoPretendido,
    interesseJovemAprendiz: dados.interesseJovemAprendiz,
    pretensaoSalarial: dados.pretensaoSalarial,
    experienciaSetorPapel: dados.experienciaSetorPapel,
    anosExperienciaTotal: dados.anosExperienciaTotal,
    turnos: dados.turnos,
    inicioImediato: dados.inicioImediato,
    disponibilidadeMudanca: dados.disponibilidadeMudanca,
    cursosCertificacoes: [],
    idiomas: listaPorVirgula(dados.idiomas),
    pcd: dados.pcd,
    pcdObservacao: dados.pcdObservacao?.trim() || undefined,
    senha: dados.senha,
    experiencias: dados.experiencias.map((experiencia) => ({
      empresa: experiencia.empresa?.trim() || undefined,
      cargo: experiencia.cargo,
      area: experiencia.area,
      dataInicio: experiencia.dataInicio,
      dataFim: experiencia.dataFim || undefined,
      descricao: experiencia.descricao?.trim() || undefined,
    })),
    formacoes: dados.formacoes.map((formacao) => ({
      nivel: formacao.nivel,
      curso: formacao.curso,
      instituicao: formacao.instituicao,
      status: formacao.status,
      ano: formacao.ano,
    })),
    habilidades: listaPorVirgula(dados.habilidades),
    aceiteTermoLgpd: dados.aceiteTermoLgpd,
  };

  let res = await fetch(`${API_URL}/candidatos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const erro = await res.clone().json().catch(() => ({}));
    const mensagem = Array.isArray(erro.message) ? erro.message.join(' ') : String(erro.message ?? '');
    if (mensagem.includes('interesseJovemAprendiz')) {
      const payloadCompatibilidade = { ...payload };
      delete payloadCompatibilidade.interesseJovemAprendiz;
      res = await fetch(`${API_URL}/candidatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadCompatibilidade),
      });
    }
  }

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message ?? 'Não foi possível concluir o cadastro.');
  }

  return res.json();
}
