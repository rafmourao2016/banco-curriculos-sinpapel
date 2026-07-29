import { CadastroFormValues } from './cadastroSchema';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function listaPorVirgula(valor?: string) {
  return (valor ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function cadastrarCandidato(dados: CadastroFormValues) {
  const payload = {
    nome: dados.nome,
    cpf: dados.cpf,
    email: dados.email,
    telefone: dados.telefone,
    dataNascimento: dados.dataNascimento,
    regiao: dados.regiao,
    uf: dados.uf.toUpperCase(),
    escolaridade: dados.escolaridade,
    possuiCnh: dados.possuiCnh,
    categoriaCnh: dados.categoriaCnh,
    areaPretendida: dados.areaPretendida,
    cargoPretendido: dados.cargoPretendido,
    pretensaoSalarial: dados.pretensaoSalarial,
    experienciaSetorPapel: dados.experienciaSetorPapel,
    anosExperienciaTotal: dados.anosExperienciaTotal,
    turnos: dados.turnos,
    inicioImediato: dados.inicioImediato,
    disponibilidadeMudanca: dados.disponibilidadeMudanca,
    cursosCertificacoes: listaPorVirgula(dados.cursosCertificacoes),
    idiomas: listaPorVirgula(dados.idiomas),
    pcd: dados.pcd,
    pcdObservacao: dados.pcdObservacao?.trim() || undefined,
    senha: dados.senha,
    experiencias: [
      {
        empresa: dados.empresaExperiencia?.trim() || undefined,
        cargo: dados.cargoAtual,
        area: dados.areaAtual,
        dataInicio: dados.dataInicioExperiencia,
        dataFim: dados.dataFimExperiencia || undefined,
        descricao: dados.descricaoExperiencia?.trim() || undefined,
      },
    ],
    formacoes: [
      {
        nivel: dados.escolaridade,
        curso: dados.cursoFormacao,
        instituicao: dados.instituicaoFormacao,
        status: dados.statusFormacao,
        ano: dados.anoFormacao,
      },
    ],
    habilidades: listaPorVirgula(dados.habilidades),
    aceiteTermoLgpd: dados.aceiteTermoLgpd,
  };

  const res = await fetch(`${API_URL}/candidatos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.message ?? 'Não foi possível concluir o cadastro.');
  }

  return res.json();
}
