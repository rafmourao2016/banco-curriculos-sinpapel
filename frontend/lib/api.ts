import { CadastroFormValues } from './cadastroSchema';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function cadastrarCandidato(dados: CadastroFormValues) {
  const payload = {
    nome: dados.nome,
    cpf: dados.cpf,
    email: dados.email,
    telefone: dados.telefone,
    dataNascimento: dados.dataNascimento,
    regiao: dados.regiao,
    escolaridade: dados.escolaridade,
    possuiCnh: dados.possuiCnh,
    categoriaCnh: dados.categoriaCnh,
    senha: dados.senha,
    experiencias: [
      {
        cargo: dados.cargoAtual,
        area: dados.areaAtual,
        dataInicio: dados.dataNascimento, // placeholder simples para o MVP
      },
    ],
    formacoes: [],
    habilidades: dados.habilidades.split(',').map((h) => h.trim()).filter(Boolean),
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
