'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';

type Experiencia = {
  empresa?: string | null;
  cargo: string;
  area: string;
  dataInicio: string;
  dataFim?: string | null;
  descricao?: string | null;
};

type Candidato = {
  id: string;
  nome: string;
  cpf: string;
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
  inicioImediato?: boolean | null;
  disponibilidadeMudanca?: boolean | null;
  cursosCertificacoes: string[];
  idiomas: string[];
  pcd?: boolean | null;
  ativo: boolean;
  dataCadastro: string;
  dataUltimaRevalidacao: string;
  experiencias: Experiencia[];
  habilidades: string[];
};

type Empresa = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  statusAprovacao: string;
  dataCadastro?: string;
  dataUltimoAvisoSenha?: string | null;
  diasDesdeCadastro?: number;
  cadastroMaisDe30Dias?: boolean;
};

type LogAcesso = {
  id: string;
  dataHora: string;
  empresa: { razaoSocial: string; email: string };
  candidato: { nome: string; email: string };
};

type Indicadores = {
  periodoMeses: number;
  resumo: {
    totalCandidatos: number;
    ativos: number;
    inativos: number;
    totalEmpresas: number;
    empresasAprovadas: number;
    revalidacoesTotal: number;
    revalidacoesConfirmadas: number;
    taxaRevalidacao: number;
  };
  rankingUsoEmpresas: Array<{ empresaId: string; razaoSocial: string; email: string; visualizacoes: number }>;
  contratacoesPorPeriodo: Array<{ periodo: string; total: number }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(valor));
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [busca, setBusca] = useState('');
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [emailsEmpresas, setEmailsEmpresas] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<LogAcesso[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [autenticado, setAutenticado] = useState(false);

  const totalAtivos = useMemo(() => candidatos.filter((candidato) => candidato.ativo).length, [candidatos]);

  async function acessarPainel(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);

    if (!token.trim()) {
      setErro('Informe a chave administrativa.');
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/admin/indicadores?meses=12`, { headers: { 'x-admin-token': token } });
      if (!res.ok) throw new Error('Chave administrativa inválida.');
      setIndicadores(await res.json());
      setAutenticado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  function sairPainel() {
    setAutenticado(false);
    setToken('');
    setBusca('');
    setCandidatos([]);
    setEmpresas([]);
    setEmailsEmpresas({});
    setLogs([]);
    setIndicadores(null);
    setErro(null);
    setMensagem(null);
    setConsultado(false);
  }

  async function carregarCandidatos(event?: FormEvent) {
    event?.preventDefault();
    setErro(null);
    setMensagem(null);
    if (!token.trim()) {
      setErro('Informe a chave administrativa.');
      return;
    }
    setCarregando(true);

    try {
      const params = new URLSearchParams();
      if (busca.trim()) params.set('q', busca.trim());

      const res = await fetch(`${API_URL}/admin/candidatos?${params.toString()}`, {
        headers: { 'x-admin-token': token },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Não foi possível carregar os currículos.');
      }

      setCandidatos(await res.json());
      setConsultado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarEmpresas() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/admin/empresas`, { headers: { 'x-admin-token': token } });
      if (!res.ok) throw new Error('Não foi possível carregar empresas.');
      const dados = await res.json();
      setEmpresas(dados);
      setEmailsEmpresas(Object.fromEntries(dados.map((empresa: Empresa) => [empresa.id, empresa.email])));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarEmpresa(id: string, statusAprovacao: string) {
    setErro(null);
    setMensagem(null);
    try {
      const res = await fetch(`${API_URL}/admin/empresas/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ statusAprovacao }),
      });
      if (!res.ok) throw new Error('Não foi possível atualizar a empresa.');
      await carregarEmpresas();
      setMensagem('Empresa atualizada.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    }
  }

  async function atualizarEmailEmpresa(id: string) {
    setErro(null);
    setMensagem(null);
    const email = emailsEmpresas[id]?.trim().toLowerCase();
    if (!email) {
      setErro('Informe o novo e-mail da empresa.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/empresas/${id}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? 'Não foi possível atualizar o e-mail.');
      await carregarEmpresas();
      setMensagem('E-mail de acesso da empresa atualizado.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    }
  }

  async function backfillEmbeddings() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/admin/embeddings/backfill`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      if (!res.ok) throw new Error('Não foi possível atualizar embeddings.');
      const body = await res.json();
      setMensagem(`Busca semântica atualizada. Currículos processados: ${body.candidatosAtualizados ?? 0}.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function excluirCandidato(id: string) {
    if (!confirm('Excluir definitivamente os dados deste candidato?')) return;
    setErro(null);
    setMensagem(null);
    try {
      const res = await fetch(`${API_URL}/admin/candidatos/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      if (!res.ok) throw new Error('Não foi possível excluir o candidato.');
      setCandidatos((atuais) => atuais.filter((candidato) => candidato.id !== id));
      setMensagem('Dados excluidos conforme solicitacao LGPD.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    }
  }

  async function carregarLogs() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/admin/logs`, { headers: { 'x-admin-token': token } });
      if (!res.ok) throw new Error('Não foi possível carregar logs.');
      setLogs(await res.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function criarComunicacao(candidatoId: string) {
    setErro(null);
    setMensagem(null);
    try {
      const res = await fetch(`${API_URL}/admin/comunicacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ candidatoId, tipo: 'geral', canal: 'email' }),
      });
      if (!res.ok) throw new Error('Não foi possível registrar comunicação.');
      setMensagem('Comunicação manual registrada como pendente.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    }
  }

  async function executarRevalidacao() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/jobs/revalidacao`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      if (!res.ok) throw new Error('Não foi possível executar rotina.');
      const body = await res.json();
      setMensagem(`Rotina executada. Revalidações: ${body.revalidacoesCriadas ?? 0}. Inativados: ${body.curriculosInativados ?? 0}.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function executarAvisoEmpresas() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/jobs/empresas-aviso-senha`, {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
      if (!res.ok) throw new Error('Não foi possível enviar os avisos.');
      const body = await res.json();
      setMensagem(`Avisos processados. Empresas elegíveis: ${body.empresasElegiveis ?? 0}. E-mails enviados: ${body.emailsEnviados ?? 0}. Erros: ${body.emailsComErro ?? 0}.`);
      await carregarEmpresas();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarIndicadores() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/admin/indicadores?meses=12`, { headers: { 'x-admin-token': token } });
      if (!res.ok) throw new Error('Não foi possível carregar indicadores.');
      setIndicadores(await res.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function exportarIndicadores() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/admin/indicadores/exportar?meses=12`, { headers: { 'x-admin-token': token } });
      if (!res.ok) throw new Error('Não foi possível exportar indicadores.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'indicadores-sinpapel.xls';
      link.click();
      window.URL.revokeObjectURL(url);
      setMensagem('Indicadores exportados.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  if (!autenticado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-8 text-slate-950">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <Link href="/" className="text-sm font-semibold text-brand-700 underline underline-offset-4">
            Voltar ao início
          </Link>

          <div className="mt-8">
            <img
              src="/logo-sinpapel.png"
              alt="SINPAPEL - Sindicato das Indústrias de Celulose, Papel e Papelão no Estado de Minas Gerais"
              className="h-auto w-64 max-w-full drop-shadow-[0_18px_28px_rgba(107,59,49,0.18)]"
            />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-sinred">Área restrita</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Acesso administrativo</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Área restrita para consulta, indicadores e governança do Banco de Currículos SINPAPEL.
            </p>
          </div>

          <form onSubmit={acessarPainel} className="mt-6 grid gap-4">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Chave de acesso
              <input
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Digite a chave administrativa"
                className="min-w-0 rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
              />
            </label>
            <button
              type="submit"
              disabled={carregando || !token}
              className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {carregando ? 'Validando...' : 'Entrar no painel'}
            </button>
          </form>

          {erro && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-5 text-slate-950 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <img
                src="/logo-sinpapel.png"
                alt="SINPAPEL"
                className="mr-2 h-auto w-40 max-w-full drop-shadow-[0_12px_18px_rgba(107,59,49,0.16)]"
              />
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-600 hover:text-brand-700"
              >
                Voltar ao início
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
              >
                Fazer novo cadastro
              </Link>
              <button
                type="button"
                onClick={sairPainel}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-sinred hover:text-sinred"
              >
                Sair
              </button>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Painel administrativo</h1>
            <p className="mt-2 text-sm text-slate-600">Área para consultar os currículos recebidos pelo formulário público.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Total listado</p>
              <p className="mt-1 text-2xl font-semibold">{candidatos.length}</p>
            </div>
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Ativos</p>
              <p className="mt-1 text-2xl font-semibold">{totalAtivos}</p>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-lg font-semibold">Buscar currículos</h2>
            <p className="text-sm text-slate-600">Pesquise por nome, cidade, cargo, área, habilidade, e-mail ou telefone.</p>
          </div>

          <form onSubmit={carregarCandidatos} className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Buscar candidato
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Nome, cidade, cargo, área, habilidade, e-mail ou telefone"
                className="min-w-0 rounded-lg border border-slate-300 px-4 py-3 text-sm font-normal outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
              />
            </label>
            <button
              type="submit"
              disabled={carregando || !token}
              className="min-w-0 self-end rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {carregando ? 'Carregando...' : 'Consultar'}
            </button>
          </form>
        </section>

        {erro && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </p>
        )}
        {mensagem && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {mensagem}
          </p>
        )}
        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Indicadores executivos</h2>
              <p className="text-sm text-slate-600">Uso, revalidação e contratações dos últimos 12 meses.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={carregarIndicadores} disabled={!token || carregando} className="rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                Atualizar indicadores
              </button>
              <button onClick={exportarIndicadores} disabled={!token || carregando} className="rounded-lg border border-brand-600 px-4 py-3 text-sm font-semibold text-brand-700 disabled:opacity-60">
                Exportar Excel
              </button>
            </div>
          </div>

          {indicadores && (
            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Currículos ativos', indicadores.resumo.ativos],
                  ['Currículos inativos', indicadores.resumo.inativos],
                  ['Empresas aprovadas', indicadores.resumo.empresasAprovadas],
                  ['Taxa de revalidação', `${indicadores.resumo.taxaRevalidacao}%`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold">Ranking de uso por empresa</h3>
                  <div className="mt-3 grid gap-2">
                    {indicadores.rankingUsoEmpresas.map((item) => (
                      <div key={item.empresaId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                        <span className="min-w-0 truncate">{item.razaoSocial}</span>
                        <strong>{item.visualizacoes}</strong>
                      </div>
                    ))}
                    {indicadores.rankingUsoEmpresas.length === 0 && <p className="text-sm text-slate-600">Sem visualizações no período.</p>}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold">Contratações por período</h3>
                  <div className="mt-3 grid gap-2">
                    {indicadores.contratacoesPorPeriodo.map((item) => (
                      <div key={item.periodo} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                        <span>{formatarData(item.periodo)}</span>
                        <strong>{item.total}</strong>
                      </div>
                    ))}
                    {indicadores.contratacoesPorPeriodo.length === 0 && <p className="text-sm text-slate-600">Sem contratações registradas no período.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Empresas</h2>
                <p className="text-sm text-slate-600">Aprove acessos e acompanhe cadastros com mais de 30 dias.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={carregarEmpresas} disabled={!token || carregando} className="rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  Carregar empresas
                </button>
                <button onClick={executarAvisoEmpresas} disabled={!token || carregando} className="rounded-lg border border-brand-600 px-4 py-3 text-sm font-semibold text-brand-700 disabled:opacity-60">
                  Enviar avisos 30 dias
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {empresas.map((empresa) => (
                <div key={empresa.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{empresa.razaoSocial}</p>
                      <p className="text-slate-600">{empresa.email} - {empresa.statusAprovacao}</p>
                    </div>
                    {empresa.cadastroMaisDe30Dias && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Cadastro com mais de 30 dias
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-slate-500">
                    <p>Cadastro: {empresa.diasDesdeCadastro ?? 0} dias{empresa.dataCadastro ? ` (${formatarData(empresa.dataCadastro)})` : ''}</p>
                    <p>Último aviso: {empresa.dataUltimoAvisoSenha ? formatarData(empresa.dataUltimoAvisoSenha) : 'ainda não enviado'}</p>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3">
                    <label className="grid gap-1 text-xs font-semibold text-slate-600">
                      E-mail de acesso
                      <input
                        type="email"
                        value={emailsEmpresas[empresa.id] ?? empresa.email}
                        onChange={(event) => setEmailsEmpresas((atuais) => ({ ...atuais, [empresa.id]: event.target.value }))}
                        className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => atualizarEmailEmpresa(empresa.id)}
                      disabled={carregando || (emailsEmpresas[empresa.id] ?? empresa.email) === empresa.email}
                      className="justify-self-start rounded-lg border border-brand-600 px-3 py-2 text-xs font-semibold text-brand-700 disabled:opacity-50"
                    >
                      Salvar e-mail
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => atualizarEmpresa(empresa.id, 'aprovada')} className="rounded-lg bg-singreen px-3 py-2 text-xs font-semibold text-white">Aprovar</button>
                    <button onClick={() => atualizarEmpresa(empresa.id, 'reprovada')} className="rounded-lg border border-sinred px-3 py-2 text-xs font-semibold text-sinred">Reprovar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Logs de acesso</h2>
                <p className="text-sm text-slate-600">Visualizações e ações feitas por empresas.</p>
              </div>
              <button onClick={carregarLogs} disabled={!token || carregando} className="rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                Carregar logs
              </button>
            </div>
            <div className="mt-4 grid max-h-80 gap-2 overflow-auto">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold">{log.empresa.razaoSocial}</p>
                  <p className="text-slate-600">Visualizou: {log.candidato.nome}</p>
                  <p className="text-xs text-slate-500">{formatarData(log.dataHora)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Rotina de revalidação</h2>
              <p className="text-sm text-slate-600">Registra alertas após 90 dias e inativa currículos sem resposta após 120 dias.</p>
            </div>
            <button onClick={executarRevalidacao} disabled={!token || carregando} className="rounded-lg bg-singreen px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              Executar agora
            </button>
            <button onClick={backfillEmbeddings} disabled={!token || carregando} className="rounded-lg border border-brand-600 px-4 py-3 text-sm font-semibold text-brand-700 disabled:opacity-60">
              Atualizar busca semântica
            </button>
          </div>
        </section>

        <section className="mt-5 grid gap-3">
          {candidatos.map((candidato) => {
            const experiencia = candidato.experiencias[0];

            return (
              <article key={candidato.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 text-xl font-semibold">{candidato.nome}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${candidato.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {candidato.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {candidato.cargoPretendido ?? experiencia?.cargo ?? 'Cargo não informado'} - {candidato.areaPretendida ?? experiencia?.area ?? 'Área não informada'} - {candidato.regiao}
                      {candidato.uf ? `/${candidato.uf}` : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {candidato.inicioImediato && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Início imediato</span>}
                      {candidato.experienciaSetorPapel && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">Setor papel/embalagem</span>}
                      {candidato.habilidades.map((habilidade) => (
                        <span key={habilidade} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {habilidade}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => criarComunicacao(candidato.id)} className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-semibold text-brand-700">
                        Registrar comunicação
                      </button>
                      <button onClick={() => excluirCandidato(candidato.id)} className="rounded-lg border border-sinred px-3 py-2 text-xs font-semibold text-sinred">
                        Excluir LGPD
                      </button>
                    </div>
                  </div>

                  <dl className="grid min-w-0 gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:min-w-[420px]">
                    <div>
                      <dt className="font-semibold text-slate-500">E-mail</dt>
                      <dd>{candidato.email}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Telefone</dt>
                      <dd>{candidato.telefone}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">CPF</dt>
                      <dd>{candidato.cpf}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Cadastro</dt>
                      <dd>{formatarData(candidato.dataCadastro)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Escolaridade</dt>
                      <dd>{candidato.escolaridade.replaceAll('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Pretensão</dt>
                      <dd>{candidato.pretensaoSalarial?.replaceAll('_', ' ') ?? 'Não informada'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Experiência total</dt>
                      <dd>{candidato.anosExperienciaTotal?.replaceAll('_', ' ') ?? 'Não informada'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Turnos</dt>
                      <dd>{candidato.turnos?.length ? candidato.turnos.join(', ') : 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Mudança</dt>
                      <dd>{candidato.disponibilidadeMudanca ? 'Disponível' : 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">CNH</dt>
                      <dd>{candidato.possuiCnh ? candidato.categoriaCnh || 'Sim' : 'Não'}</dd>
                    </div>
                  </dl>
                </div>

                {(experiencia?.empresa || experiencia?.descricao || candidato.cursosCertificacoes?.length || candidato.idiomas?.length || candidato.pcd) && (
                  <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                    {experiencia?.empresa && <p><strong>Empresa:</strong> {experiencia.empresa}</p>}
                    {experiencia?.descricao && <p><strong>Atividades:</strong> {experiencia.descricao}</p>}
                    {candidato.cursosCertificacoes?.length > 0 && <p><strong>Cursos:</strong> {candidato.cursosCertificacoes.join(', ')}</p>}
                    {candidato.idiomas?.length > 0 && <p><strong>Idiomas:</strong> {candidato.idiomas.join(', ')}</p>}
                    {candidato.pcd && <p><strong>PCD:</strong> Sim</p>}
                  </div>
                )}
              </article>
            );
          })}

          {consultado && candidatos.length === 0 && !erro && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              Nenhum curriculo encontrado.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
