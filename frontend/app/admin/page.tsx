'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  dataNascimento?: string | null;
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
  interesseJovemAprendiz?: boolean | null;
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
  empresa: { id?: string; razaoSocial: string; email: string; statusAprovacao?: string };
  candidato: { id?: string; nome: string; email: string; telefone?: string; cargoPretendido?: string; regiao?: string; uf?: string };
};

type DistribuicaoCidade = {
  cidade: string;
  uf?: string | null;
  total: number;
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
  curriculosAtivosPorCidade?: DistribuicaoCidade[];
  rankingUsoEmpresas: Array<{ empresaId: string; razaoSocial: string; email: string; visualizacoes: number }>;
  contratacoesPorPeriodo: Array<{ periodo: string; total: number }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const rotulos: Record<string, string> = {
  FUNDAMENTAL_INCOMPLETO: 'Fundamental incompleto',
  FUNDAMENTAL_COMPLETO: 'Fundamental completo',
  MEDIO_INCOMPLETO: 'Médio incompleto',
  MEDIO_COMPLETO: 'Médio completo',
  SUPERIOR_INCOMPLETO: 'Superior incompleto',
  SUPERIOR_COMPLETO: 'Superior completo',
  POS_GRADUACAO: 'Pós-graduação',
  producao: 'Produção',
  manutencao: 'Manutenção',
  administrativo: 'Administrativo',
  logistica: 'Logística',
  qualidade: 'Qualidade',
  comercial: 'Comercial',
  ti: 'TI',
  engenharia: 'Engenharia',
  outra: 'Outra',
  a_combinar: 'A combinar',
  ate_1500: 'Até R$ 1.500',
  '1501_2500': 'R$ 1.501 a R$ 2.500',
  '2501_3500': 'R$ 2.501 a R$ 3.500',
  '3501_5000': 'R$ 3.501 a R$ 5.000',
  acima_5000: 'Acima de R$ 5.000',
  sem_experiencia: 'Sem experiência',
  ate_1_ano: 'Até 1 ano',
  '1_3_anos': '1 a 3 anos',
  '3_5_anos': '3 a 5 anos',
  mais_5_anos: 'Mais de 5 anos',
  integral: 'Período Integral',
  periodo_integral: 'Período Integral',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  revezamento: 'Revezamento',
};

function rotulo(valor?: string | null) {
  if (!valor) return 'Não informado';
  return rotulos[valor] ?? valor;
}

function statusEmpresa(status: string) {
  if (status === 'aprovada') return 'Aprovada';
  if (status === 'reprovada') return 'Reprovada';
  return 'Pendente';
}

function formatarData(valor?: string | null) {
  if (!valor) return 'Data não informada';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Data inválida';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data);
}

function formatarDataSimples(valor?: string | null) {
  if (!valor) return 'Data não informada';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Data inválida';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(data);
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

  // Filtros interativos
  const [filtroStatusCandidato, setFiltroStatusCandidato] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [filtroStatusEmpresa, setFiltroStatusEmpresa] = useState<'todas' | 'pendentes' | 'aprovadas' | 'reprovadas'>('todas');
  const [buscaEmpresas, setBuscaEmpresas] = useState('');
  const [buscaLogs, setBuscaLogs] = useState('');
  const [modoLogs, setModoLogs] = useState<'segmentado' | 'timeline'>('segmentado');
  const [empresaSelecionadaLogsId, setEmpresaSelecionadaLogsId] = useState<string | null>(null);

  // Distribuição de candidatos por cidade
  const [modalDistribuicaoAberta, setModalDistribuicaoAberta] = useState(false);
  const [buscaDistribuicaoCidade, setBuscaDistribuicaoCidade] = useState('');
  const [copiadoResumo, setCopiadoResumo] = useState(false);

  const secaoCandidatosRef = useRef<HTMLElement>(null);
  const secaoEmpresasRef = useRef<HTMLElement>(null);
  const secaoLogsRef = useRef<HTMLElement>(null);

  const totalAtivos = useMemo(() => candidatos.filter((candidato) => candidato.ativo).length, [candidatos]);
  const totalInativos = useMemo(() => candidatos.filter((candidato) => !candidato.ativo).length, [candidatos]);

  const empresasPendentesCount = useMemo(() => empresas.filter((e) => e.statusAprovacao === 'pendente').length, [empresas]);
  const empresasAprovadasCount = useMemo(() => empresas.filter((e) => e.statusAprovacao === 'aprovada').length, [empresas]);
  const empresasReprovadasCount = useMemo(() => empresas.filter((e) => e.statusAprovacao === 'reprovada').length, [empresas]);

  function sairPainel() {
    try {
      localStorage.removeItem('sinpapel_admin_token');
    } catch {
      // ignore
    }
    setAutenticado(false);
    setToken('');
    setBusca('');
    setBuscaEmpresas('');
    setBuscaLogs('');
    setCandidatos([]);
    setEmpresas([]);
    setEmailsEmpresas({});
    setLogs([]);
    setIndicadores(null);
    setErro(null);
    setMensagem(null);
    setConsultado(false);
  }

  async function carregarTudo(adminToken: string) {
    setCarregando(true);
    try {
      await Promise.allSettled([
        carregarIndicadores(adminToken),
        carregarCandidatos(undefined, adminToken),
        carregarEmpresas(adminToken),
        carregarLogs(adminToken),
      ]);
      setAutenticado(true);
      try {
        localStorage.setItem('sinpapel_admin_token', adminToken);
      } catch {
        // ignore
      }
    } catch {
      sairPainel();
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('sinpapel_admin_token');
      if (savedToken) {
        setToken(savedToken);
        void carregarTudo(savedToken);
      }
    } catch {
      // ignore
    }
  }, []);

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
      const dadosIndicadores = await res.json();
      setIndicadores(dadosIndicadores);
      setAutenticado(true);
      try {
        localStorage.setItem('sinpapel_admin_token', token);
      } catch {
        // ignore
      }
      void carregarCandidatos(undefined, token);
      void carregarEmpresas(token);
      void carregarLogs(token);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarCandidatos(event?: FormEvent, tokenParam?: string, queryParam?: string) {
    event?.preventDefault();
    setErro(null);
    setMensagem(null);
    const activeToken = tokenParam ?? token;
    if (!activeToken.trim()) {
      setErro('Informe a chave administrativa.');
      return;
    }
    setCarregando(true);

    try {
      const termoBusca = queryParam !== undefined ? queryParam : busca;
      const params = new URLSearchParams();
      if (termoBusca.trim()) params.set('q', termoBusca.trim());

      const res = await fetch(`${API_URL}/admin/candidatos?${params.toString()}`, {
        headers: { 'x-admin-token': activeToken },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Não foi possível carregar os currículos.');
      }

      const lista = await res.json();
      setCandidatos(lista);
      setConsultado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarEmpresas(tokenParam?: string) {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const activeToken = tokenParam ?? token;
    try {
      const res = await fetch(`${API_URL}/admin/empresas`, { headers: { 'x-admin-token': activeToken } });
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
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/admin/empresas/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ statusAprovacao }),
      });
      if (!res.ok) throw new Error('Não foi possível atualizar a empresa.');
      await carregarEmpresas();
      await carregarIndicadores();
      setMensagem(statusAprovacao === 'aprovada' ? 'Empresa aprovada com sucesso.' : 'Empresa reprovada com sucesso.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
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
      await carregarIndicadores();
      setMensagem('Dados excluídos conforme solicitação LGPD.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    }
  }

  async function carregarLogs(tokenParam?: string) {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const activeToken = tokenParam ?? token;
    try {
      const res = await fetch(`${API_URL}/admin/logs`, { headers: { 'x-admin-token': activeToken } });
      if (!res.ok) throw new Error('Não foi possível carregar logs.');
      const dadosLogs = await res.json();
      setLogs(dadosLogs);
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
      await carregarIndicadores();
      await carregarCandidatos();
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

  async function carregarIndicadores(tokenParam?: string) {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const activeToken = tokenParam ?? token;
    try {
      const res = await fetch(`${API_URL}/admin/indicadores?meses=12`, { headers: { 'x-admin-token': activeToken } });
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
      link.download = 'relatorio-geral-sinpapel.xls';
      link.click();
      window.URL.revokeObjectURL(url);
      setMensagem('Relatório completo exportado com sucesso.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  // Navegações e filtros via clique nos cards
  function selecionarFiltroCandidatos(status: 'todos' | 'ativos' | 'inativos') {
    setFiltroStatusCandidato(status);
    if (candidatos.length === 0) {
      void carregarCandidatos();
    }
    secaoCandidatosRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function selecionarFiltroEmpresas(status: 'todas' | 'pendentes' | 'aprovadas' | 'reprovadas') {
    setFiltroStatusEmpresa(status);
    if (empresas.length === 0) {
      void carregarEmpresas();
    }
    secaoEmpresasRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function navegarParaLogsEmpresa(empresaId?: string) {
    if (empresaId) setEmpresaSelecionadaLogsId(empresaId);
    setModoLogs('segmentado');
    if (logs.length === 0) {
      void carregarLogs();
    }
    secaoLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Distribuição de candidatos ativos por cidade (Backend ou agrupamento local em tempo real)
  const distribuicaoCidades = useMemo(() => {
    if (indicadores?.curriculosAtivosPorCidade && indicadores.curriculosAtivosPorCidade.length > 0) {
      return indicadores.curriculosAtivosPorCidade;
    }
    const mapa = new Map<string, { cidade: string; uf?: string | null; total: number }>();
    candidatos
      .filter((c) => c.ativo)
      .forEach((c) => {
        const cidadeFormatada = (c.regiao || 'Não informada').trim();
        const chave = cidadeFormatada.toLowerCase();
        const existente = mapa.get(chave);
        if (existente) {
          existente.total += 1;
        } else {
          mapa.set(chave, { cidade: cidadeFormatada, uf: c.uf || null, total: 1 });
        }
      });
    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [indicadores, candidatos]);

  const distribuicaoCidadesFiltradas = useMemo(() => {
    if (!buscaDistribuicaoCidade.trim()) return distribuicaoCidades;
    const termo = buscaDistribuicaoCidade.trim().toLowerCase();
    return distribuicaoCidades.filter((item) =>
      `${item.cidade} ${item.uf ?? ''}`.toLowerCase().includes(termo)
    );
  }, [distribuicaoCidades, buscaDistribuicaoCidade]);

  async function copiarResumoCidades() {
    if (distribuicaoCidades.length === 0) return;
    const linhas = distribuicaoCidades.map((item) => `${item.cidade} ${item.total}`);
    const texto = `DISTRIBUIÇÃO DE CURRÍCULOS ATIVOS POR CIDADE:\n${linhas.join('\n')}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoResumo(true);
      setTimeout(() => setCopiadoResumo(false), 2500);
    } catch {
      // fallback
    }
  }

  function filtrarPorCidade(cidadeNome: string) {
    setModalDistribuicaoAberta(false);
    setFiltroStatusCandidato('ativos');
    setBusca(cidadeNome);
    void carregarCandidatos(undefined, undefined, cidadeNome);
    secaoCandidatosRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  // Candidatos filtrados por busca local e status
  const candidatosExibidos = useMemo(() => {
    return candidatos.filter((c) => {
      if (filtroStatusCandidato === 'ativos' && !c.ativo) return false;
      if (filtroStatusCandidato === 'inativos' && c.ativo) return false;
      return true;
    });
  }, [candidatos, filtroStatusCandidato]);

  // Empresas filtradas por status e termo de busca
  const empresasExibidas = useMemo(() => {
    return empresas.filter((empresa) => {
      if (filtroStatusEmpresa === 'pendentes' && empresa.statusAprovacao !== 'pendente') return false;
      if (filtroStatusEmpresa === 'aprovadas' && empresa.statusAprovacao !== 'aprovada') return false;
      if (filtroStatusEmpresa === 'reprovadas' && empresa.statusAprovacao !== 'reprovada') return false;
      if (buscaEmpresas.trim()) {
        const termo = buscaEmpresas.trim().toLowerCase();
        const texto = `${empresa.razaoSocial} ${empresa.cnpj} ${empresa.email}`.toLowerCase();
        return texto.includes(termo);
      }
      return true;
    });
  }, [empresas, filtroStatusEmpresa, buscaEmpresas]);

  // Logs agrupados por empresa (Segmentação de Logs)
  const logsPorEmpresa = useMemo(() => {
    const mapa = new Map<string, { empresa: { id?: string; razaoSocial: string; email: string; statusAprovacao?: string }; logs: LogAcesso[] }>();

    logs.forEach((log) => {
      const empId = log.empresa.id || log.empresa.email || log.empresa.razaoSocial;
      if (!mapa.has(empId)) {
        mapa.set(empId, { empresa: log.empresa, logs: [] });
      }
      mapa.get(empId)!.logs.push(log);
    });

    return Array.from(mapa.values()).sort((a, b) => b.logs.length - a.logs.length);
  }, [logs]);

  // Logs filtrados por busca na timeline
  const logsTimelineFiltrados = useMemo(() => {
    if (!buscaLogs.trim()) return logs;
    const termo = buscaLogs.trim().toLowerCase();
    return logs.filter((l) => {
      const texto = `${l.empresa.razaoSocial} ${l.empresa.email} ${l.candidato.nome} ${l.candidato.email} ${l.candidato.cargoPretendido ?? ''} ${l.candidato.regiao ?? ''}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [logs, buscaLogs]);

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
        {/* Top Header */}
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
            <p className="mt-2 text-sm text-slate-600">Governança, métricas e base completa de currículos e empresas.</p>
          </div>

          {/* Quick interactive stats in header */}
          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <button
              type="button"
              onClick={() => selecionarFiltroCandidatos('todos')}
              className={`min-w-0 rounded-lg border p-4 text-left transition hover:border-brand-600 ${filtroStatusCandidato === 'todos' ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200 bg-white'}`}
            >
              <p className="text-xs font-semibold uppercase text-slate-500">Currículos Totais</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{indicadores?.resumo.totalCandidatos ?? candidatos.length}</p>
              <span className="text-[11px] text-brand-700 font-medium">Clique para ver todos</span>
            </button>
            <button
              type="button"
              onClick={() => selecionarFiltroCandidatos('ativos')}
              className={`min-w-0 rounded-lg border p-4 text-left transition hover:border-emerald-600 ${filtroStatusCandidato === 'ativos' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}
            >
              <p className="text-xs font-semibold uppercase text-emerald-700">Currículos Ativos</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{indicadores?.resumo.ativos ?? totalAtivos}</p>
              <span className="text-[11px] text-emerald-700 font-medium">Clique para filtrar</span>
            </button>
          </div>
        </header>

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

        {/* Indicadores Executivos Interativos */}
        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Indicadores executivos</h2>
              <p className="text-sm text-slate-600">Clique em qualquer card abaixo para carregar e filtrar a lista correspondente.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void carregarTudo(token)}
                disabled={!token || carregando}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {carregando ? 'Atualizando...' : 'Atualizar dados'}
              </button>
              <button
                onClick={exportarIndicadores}
                disabled={!token || carregando}
                title="Exporta todas as abas (Resumo, Empresas, Currículos, Logs) para arquivo Excel completo"
                className="rounded-lg border border-brand-600 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-60"
              >
                Exportar Excel Completo
              </button>
            </div>
          </div>

          {indicadores && (
            <div className="mt-5 grid gap-4">
              {/* Cards clicáveis de métricas */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Ativos */}
                <div
                  className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition hover:border-emerald-600 hover:shadow-md ${filtroStatusCandidato === 'ativos' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Currículos Ativos</p>
                      <button
                        type="button"
                        onClick={() => setModalDistribuicaoAberta(true)}
                        title="Ver relação quantitativa de currículos por cidade"
                        className="rounded bg-emerald-100/90 px-2 py-0.5 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-200"
                      >
                        Por Cidade 📍
                      </button>
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-700">{indicadores.resumo.ativos}</p>
                    {distribuicaoCidades.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setModalDistribuicaoAberta(true)}
                        className="mt-1 block text-left text-xs font-medium text-emerald-800 hover:text-emerald-950 hover:underline truncate w-full cursor-pointer"
                        title={distribuicaoCidades.map((d) => `${d.cidade} ${d.total}`).join(', ')}
                      >
                        {distribuicaoCidades.slice(0, 2).map((d) => `${d.cidade} ${d.total}`).join(' • ')}
                        {distribuicaoCidades.length > 2 ? '...' : ''}
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-emerald-200/60 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => selecionarFiltroCandidatos('ativos')}
                      className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
                    >
                      Ver na tabela &darr;
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDistribuicaoAberta(true)}
                      className="font-bold text-emerald-800 hover:underline"
                    >
                      Cidades ({distribuicaoCidades.length}) &rarr;
                    </button>
                  </div>
                </div>

                {/* Inativos */}
                <button
                  type="button"
                  onClick={() => selecionarFiltroCandidatos('inativos')}
                  className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition hover:border-slate-600 hover:shadow-md ${filtroStatusCandidato === 'inativos' ? 'border-slate-700 bg-slate-200 ring-2 ring-slate-700/20' : 'border-slate-200 bg-slate-50'}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Currículos Inativos</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-700">{indicadores.resumo.inativos}</p>
                  <span className="mt-2 text-xs font-semibold text-slate-700 underline underline-offset-2 group-hover:text-slate-950">
                    Ver na tabela &darr;
                  </span>
                </button>

                {/* Empresas Aprovadas */}
                <button
                  type="button"
                  onClick={() => selecionarFiltroEmpresas('aprovadas')}
                  className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition hover:border-brand-600 hover:shadow-md ${filtroStatusEmpresa === 'aprovadas' ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20' : 'border-slate-200 bg-slate-50'}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-800">Empresas Aprovadas</p>
                  <p className="mt-2 text-3xl font-extrabold text-brand-700">{indicadores.resumo.empresasAprovadas}</p>
                  <span className="mt-2 text-xs font-semibold text-brand-700 underline underline-offset-2 group-hover:text-brand-900">
                    Ver empresas &darr;
                  </span>
                </button>

                {/* Empresas Pendentes */}
                <button
                  type="button"
                  onClick={() => selecionarFiltroEmpresas('pendentes')}
                  className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition hover:border-amber-500 hover:shadow-md ${filtroStatusEmpresa === 'pendentes' ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-600/20' : 'border-slate-200 bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Pendentes de Aprovação</p>
                    {empresasPendentesCount > 0 && (
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                    )}
                  </div>
                  <p className="mt-2 text-3xl font-extrabold text-amber-700">{empresasPendentesCount}</p>
                  <span className="mt-2 text-xs font-semibold text-amber-800 underline underline-offset-2 group-hover:text-amber-950">
                    Auditar cadastros &darr;
                  </span>
                </button>

                {/* Taxa de Revalidação */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Taxa de Revalidação</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900">{indicadores.resumo.taxaRevalidacao}%</p>
                  <p className="mt-2 text-xs text-slate-500">{indicadores.resumo.revalidacoesConfirmadas} de {indicadores.resumo.revalidacoesTotal} enviadas</p>
                </div>
              </div>

              {/* Distribuição Regional, Ranking e Contratações */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* 1. Distribuição de Currículos Ativos por Cidade */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-sm sm:text-base">
                          <span>📍</span> Distribuição por Cidade
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Volume de currículos ativos</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalDistribuicaoAberta(true)}
                        className="text-xs font-semibold text-brand-700 hover:underline shrink-0"
                      >
                        Ver todas ({distribuicaoCidades.length}) &rarr;
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {distribuicaoCidades.slice(0, 5).map((item, idx) => {
                        const totalAtiv = indicadores.resumo.ativos > 0 ? indicadores.resumo.ativos : totalAtivos;
                        const percentual = totalAtiv > 0 ? Math.round((item.total / totalAtiv) * 100) : 0;
                        return (
                          <button
                            key={`${item.cidade}-${idx}`}
                            type="button"
                            onClick={() => filtrarPorCidade(item.cidade)}
                            title={`Clique para filtrar candidatos de ${item.cidade}`}
                            className="group flex flex-col gap-1 rounded-lg bg-slate-50 p-2.5 text-left text-sm transition hover:bg-emerald-50 hover:border-emerald-300 border border-transparent"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 group-hover:text-emerald-900 truncate">
                                {item.cidade}{item.uf ? `/${item.uf}` : ''}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="font-bold text-emerald-700 text-sm sm:text-base">{item.total}</span>
                                <span className="text-[11px] text-slate-500">({percentual}%)</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                                style={{ width: `${Math.max(percentual, 4)}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                      {distribuicaoCidades.length === 0 && (
                        <p className="text-sm text-slate-500 py-3 text-center">Nenhum currículo ativo com cidade informada.</p>
                      )}
                    </div>
                  </div>

                  {distribuicaoCidades.length > 0 && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                      <span className="text-slate-500">{distribuicaoCidades.length} cidades registradas</span>
                      <button
                        type="button"
                        onClick={copiarResumoCidades}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        {copiadoResumo ? '✓ Lista copiada!' : 'Copiar resumo (Texto)'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Ranking de uso por empresa */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Ranking de empresas</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Mais acessos a currículos</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navegarParaLogsEmpresa()}
                        className="text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Ver logs &rarr;
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {indicadores.rankingUsoEmpresas.slice(0, 5).map((item) => (
                        <button
                          key={item.empresaId}
                          type="button"
                          onClick={() => navegarParaLogsEmpresa(item.empresaId)}
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2.5 text-left text-sm transition hover:bg-brand-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{item.razaoSocial}</p>
                            <p className="truncate text-xs text-slate-500">{item.email}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <strong className="text-brand-700">{item.visualizacoes}</strong>
                            <span className="ml-1 text-xs text-slate-500">acessos</span>
                          </div>
                        </button>
                      ))}
                      {indicadores.rankingUsoEmpresas.length === 0 && (
                        <p className="text-sm text-slate-600 py-3 text-center">Sem visualizações no período.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Contratações confirmadas */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Contratações confirmadas</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Admissões no período</p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {indicadores.contratacoesPorPeriodo.slice(0, 5).map((item) => (
                        <div key={item.periodo} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2.5 text-sm">
                          <span className="text-slate-700">{formatarDataSimples(item.periodo)}</span>
                          <strong className="text-singreen">{item.total} contratações</strong>
                        </div>
                      ))}
                      {indicadores.contratacoesPorPeriodo.length === 0 && (
                        <p className="text-sm text-slate-600 py-3 text-center">Sem contratações registradas no período.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SEÇÃO DE EMPRESAS (Ordenação de pendentes fixada no topo) */}
        <section ref={secaoEmpresasRef} id="secao-empresas" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-950">Gestão de Empresas</h2>
                {empresasPendentesCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    {empresasPendentesCount} pendente{empresasPendentesCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">Cadastros pendentes de aprovação ficam fixados automaticamente no topo da lista.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void carregarEmpresas()}
                disabled={!token || carregando}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Recarregar empresas
              </button>
              <button
                onClick={executarAvisoEmpresas}
                disabled={!token || carregando}
                className="rounded-lg border border-brand-600 px-3.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
              >
                Enviar avisos de 30 dias
              </button>
            </div>
          </div>

          {/* Filtros e Busca de Empresas */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltroStatusEmpresa('todas')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroStatusEmpresa === 'todas' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                Todas ({empresas.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatusEmpresa('pendentes')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroStatusEmpresa === 'pendentes' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'}`}
              >
                Pendentes ({empresasPendentesCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatusEmpresa('aprovadas')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroStatusEmpresa === 'aprovadas' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'}`}
              >
                Aprovadas ({empresasAprovadasCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatusEmpresa('reprovadas')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filtroStatusEmpresa === 'reprovadas' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'}`}
              >
                Reprovadas ({empresasReprovadasCount})
              </button>
            </div>

            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                value={buscaEmpresas}
                onChange={(e) => setBuscaEmpresas(e.target.value)}
                placeholder="Filtrar por nome, CNPJ ou e-mail"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-normal outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10"
              />
            </div>
          </div>

          {/* Listagem de Empresas */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {empresasExibidas.map((empresa) => {
              const isPendente = empresa.statusAprovacao === 'pendente';
              const isAprovada = empresa.statusAprovacao === 'aprovada';
              const isReprovada = empresa.statusAprovacao === 'reprovada';

              return (
                <div
                  key={empresa.id}
                  className={`rounded-xl border p-4 text-sm transition shadow-sm ${isPendente ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-400/30' : isAprovada ? 'border-emerald-200 bg-white' : 'border-red-200 bg-red-50/20'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 truncate">{empresa.razaoSocial}</p>
                      <p className="text-xs text-slate-500 truncate">{empresa.cnpj}</p>
                      <p className="text-xs text-slate-600 truncate">{empresa.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${isPendente ? 'bg-amber-100 text-amber-900 border border-amber-300' : isAprovada ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}
                    >
                      {statusEmpresa(empresa.statusAprovacao)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    <p>Cadastro: {empresa.diasDesdeCadastro ?? 0} dias{empresa.dataCadastro ? ` (${formatarDataSimples(empresa.dataCadastro)})` : ''}</p>
                    {empresa.cadastroMaisDe30Dias && (
                      <span className="inline-flex items-center text-amber-800 font-semibold">
                        &bull; Cadastro com mais de 30 dias
                      </span>
                    )}
                  </div>

                  {/* Edição rápida de e-mail */}
                  <div className="mt-3 grid gap-1.5 rounded-lg bg-slate-50 p-2.5">
                    <label className="text-[11px] font-semibold text-slate-600">
                      E-mail de acesso
                      <input
                        type="email"
                        value={emailsEmpresas[empresa.id] ?? empresa.email}
                        onChange={(event) => setEmailsEmpresas((atuais) => ({ ...atuais, [empresa.id]: event.target.value }))}
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-950 outline-none focus:border-brand-600"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => atualizarEmailEmpresa(empresa.id)}
                      disabled={carregando || (emailsEmpresas[empresa.id] ?? empresa.email) === empresa.email}
                      className="justify-self-start rounded border border-brand-600 px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                    >
                      Salvar e-mail
                    </button>
                  </div>

                  {/* Ações de aprovação / reprovação */}
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => atualizarEmpresa(empresa.id, 'aprovada')}
                      disabled={carregando || isAprovada}
                      className="flex-1 rounded-lg bg-singreen py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isAprovada ? 'Aprovada' : 'Aprovar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => atualizarEmpresa(empresa.id, 'reprovada')}
                      disabled={carregando || isReprovada}
                      className="flex-1 rounded-lg border border-sinred py-2 text-xs font-semibold text-sinred transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isReprovada ? 'Reprovada' : 'Reprovar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navegarParaLogsEmpresa(empresa.id)}
                      title="Ver logs desta empresa"
                      className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Logs
                    </button>
                  </div>
                </div>
              );
            })}
            {empresasExibidas.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-slate-500">
                Nenhuma empresa encontrada com os filtros atuais.
              </p>
            )}
          </div>
        </section>

        {/* SEÇÃO DE LOGS DE ACESSO (Segmentação por Empresa) */}
        <section ref={secaoLogsRef} id="secao-logs" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Logs de Acesso e Visualizações</h2>
              <p className="text-sm text-slate-600">Acompanhe individualmente quais currículos cada empresa consultou na base.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setModoLogs('segmentado')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${modoLogs === 'segmentado' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  Por Empresa (Segmentado)
                </button>
                <button
                  type="button"
                  onClick={() => setModoLogs('timeline')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${modoLogs === 'timeline' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  Linha do Tempo Geral
                </button>
              </div>
              <button
                onClick={() => void carregarLogs()}
                disabled={!token || carregando}
                className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Atualizar logs
              </button>
            </div>
          </div>

          {modoLogs === 'segmentado' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
              {/* Lista de Empresas com acessos */}
              <div className="grid content-start gap-2 max-h-[500px] overflow-y-auto pr-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Empresas ({logsPorEmpresa.length})</p>
                {logsPorEmpresa.map((grupo) => {
                  const empId = grupo.empresa.id || grupo.empresa.email;
                  const isSelected = (empresaSelecionadaLogsId ?? logsPorEmpresa[0]?.empresa.id ?? logsPorEmpresa[0]?.empresa.email) === empId;

                  return (
                    <button
                      key={empId}
                      type="button"
                      onClick={() => setEmpresaSelecionadaLogsId(empId)}
                      className={`flex flex-col rounded-xl border p-3 text-left transition ${isSelected ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-600/20' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">{grupo.empresa.razaoSocial}</span>
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800 shrink-0">
                          {grupo.logs.length}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{grupo.empresa.email}</p>
                    </button>
                  );
                })}
                {logsPorEmpresa.length === 0 && (
                  <p className="text-sm text-slate-500 py-4 text-center">Nenhum log de acesso registrado.</p>
                )}
              </div>

              {/* Detalhes dos acessos da empresa selecionada */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 min-h-[300px]">
                {(() => {
                  const grupoAtivo = logsPorEmpresa.find(
                    (g) => (g.empresa.id || g.empresa.email) === (empresaSelecionadaLogsId ?? logsPorEmpresa[0]?.empresa.id ?? logsPorEmpresa[0]?.empresa.email),
                  ) ?? logsPorEmpresa[0];

                  if (!grupoAtivo) {
                    return <p className="text-sm text-slate-500 py-8 text-center">Selecione uma empresa para visualizar o histórico de currículos acessados.</p>;
                  }

                  return (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <h3 className="font-semibold text-base text-slate-900">{grupoAtivo.empresa.razaoSocial}</h3>
                          <p className="text-xs text-slate-500">{grupoAtivo.empresa.email}</p>
                        </div>
                        <span className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                          {grupoAtivo.logs.length} currículo{grupoAtivo.logs.length > 1 ? 's' : ''} visualizado{grupoAtivo.logs.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {grupoAtivo.logs.map((log) => (
                          <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-xs">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{log.candidato.nome}</p>
                              <p className="text-xs text-slate-600">
                                {log.candidato.cargoPretendido ?? 'Cargo não informado'} &bull; {log.candidato.regiao}{log.candidato.uf ? `/${log.candidato.uf}` : ''}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span>E-mail: {log.candidato.email}</span>
                                {log.candidato.telefone && <span>Telefone: {log.candidato.telefone}</span>}
                              </div>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                {formatarData(log.dataHora)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-3">
                <input
                  type="text"
                  value={buscaLogs}
                  onChange={(e) => setBuscaLogs(e.target.value)}
                  placeholder="Pesquisar em todos os logs por empresa, candidato, e-mail ou cidade..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10"
                />
              </div>
              <div className="grid gap-2 max-h-[450px] overflow-y-auto pr-1">
                {logsTimelineFiltrados.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                    <div>
                      <span className="font-bold text-slate-900">{log.empresa.razaoSocial}</span>
                      <span className="text-slate-500 text-xs ml-1">({log.empresa.email})</span>
                      <p className="mt-0.5 text-slate-700">
                        Visualizou: <strong className="text-brand-700">{log.candidato.nome}</strong>
                        {log.candidato.cargoPretendido && <span className="text-xs text-slate-500 ml-1">({log.candidato.cargoPretendido})</span>}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 shrink-0">
                      {formatarData(log.dataHora)}
                    </span>
                  </div>
                ))}
                {logsTimelineFiltrados.length === 0 && (
                  <p className="text-center py-6 text-sm text-slate-500">Nenhum log encontrado.</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* SEÇÃO DA BASE DE CURRÍCULOS */}
        <section ref={secaoCandidatosRef} id="secao-candidatos" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Base de Currículos</h2>
              <p className="text-sm text-slate-600">Consulte, filtre por status e gerencie os candidatos cadastrados.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void carregarCandidatos()}
                disabled={carregando}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Recarregar lista
              </button>
            </div>
          </div>

          {/* Filtros de Status e Formulário de Busca Ampla */}
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltroStatusCandidato('todos')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${filtroStatusCandidato === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Todos ({candidatos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusCandidato('ativos')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${filtroStatusCandidato === 'ativos' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'}`}
                >
                  Ativos ({totalAtivos})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusCandidato('inativos')}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${filtroStatusCandidato === 'inativos' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Inativos ({totalInativos})
                </button>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Exibindo <strong>{candidatosExibidos.length}</strong> currículo{candidatosExibidos.length === 1 ? '' : 's'}
              </span>
            </div>

            <form onSubmit={carregarCandidatos} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Busca ampla: Nome, CPF, cidade, UF, cargo, área, habilidade, curso, telefone ou e-mail..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-normal outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
              />
              <button
                type="submit"
                disabled={carregando}
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {carregando ? 'Buscando...' : 'Buscar'}
              </button>
              {busca && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('');
                    void carregarCandidatos(undefined, undefined, '');
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Limpar
                </button>
              )}
            </form>
          </div>

          {/* Cards dos Candidatos */}
          <div className="mt-5 grid gap-4">
            {candidatosExibidos.map((candidato) => {
              const experiencia = candidato.experiencias[0];

              return (
                <article key={candidato.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 text-xl font-bold text-slate-950">{candidato.nome}</h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${candidato.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}
                        >
                          {candidato.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        {candidato.interesseJovemAprendiz && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                            Jovem Aprendiz
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {candidato.cargoPretendido ?? experiencia?.cargo ?? 'Cargo não informado'} &bull; {rotulo(candidato.areaPretendida ?? experiencia?.area)} &bull; {candidato.regiao}
                        {candidato.uf ? `/${candidato.uf}` : ''}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {candidato.inicioImediato && (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            Início imediato
                          </span>
                        )}
                        {candidato.experienciaSetorPapel && (
                          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
                            Setor papel/embalagem
                          </span>
                        )}
                        {candidato.habilidades.map((habilidade) => (
                          <span key={habilidade} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {habilidade}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => criarComunicacao(candidato.id)}
                          className="rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          Registrar comunicação
                        </button>
                        <button
                          type="button"
                          onClick={() => excluirCandidato(candidato.id)}
                          className="rounded-lg border border-sinred px-3 py-1.5 text-xs font-semibold text-sinred hover:bg-red-50"
                        >
                          Excluir LGPD
                        </button>
                      </div>
                    </div>

                    <dl className="grid min-w-0 gap-x-4 gap-y-2 text-xs text-slate-700 sm:grid-cols-2 lg:min-w-[440px] bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div>
                        <dt className="font-semibold text-slate-500">E-mail</dt>
                        <dd className="font-medium truncate">{candidato.email}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Telefone</dt>
                        <dd className="font-medium">{candidato.telefone}</dd>
                      </div>
                      {(candidato.logradouro || candidato.bairro || candidato.numeroEndereco || candidato.cep) && (
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-slate-500">Endereço</dt>
                          <dd className="font-medium">
                            {[
                              candidato.logradouro,
                              candidato.numeroEndereco,
                              candidato.bairro,
                              candidato.regiao,
                              candidato.uf,
                              candidato.cep ? `CEP ${candidato.cep}` : null,
                            ].filter(Boolean).join(', ')}
                            {candidato.complementoEndereco ? ` - ${candidato.complementoEndereco}` : ''}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="font-semibold text-slate-500">CPF</dt>
                        <dd className="font-medium">{candidato.cpf}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Nascimento</dt>
                        <dd className="font-medium">{formatarDataSimples(candidato.dataNascimento)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Cadastro</dt>
                        <dd className="font-medium">{formatarDataSimples(candidato.dataCadastro)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Escolaridade</dt>
                        <dd className="font-medium">{rotulo(candidato.escolaridade)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Pretensão salarial</dt>
                        <dd className="font-medium">{rotulo(candidato.pretensaoSalarial)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">Experiência total</dt>
                        <dd className="font-medium">{rotulo(candidato.anosExperienciaTotal)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">CNH</dt>
                        <dd className="font-medium">{candidato.possuiCnh ? candidato.categoriaCnh || 'Sim' : 'Não'}</dd>
                      </div>
                    </dl>
                  </div>

                  {(experiencia?.empresa || experiencia?.descricao || (candidato.cursosCertificacoes && candidato.cursosCertificacoes.length > 0) || (candidato.idiomas && candidato.idiomas.length > 0) || candidato.pcd) && (
                    <div className="mt-3.5 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 sm:grid-cols-2 border border-slate-100">
                      {experiencia?.empresa && <p><strong>Última Empresa:</strong> {experiencia.empresa}</p>}
                      {experiencia?.descricao && <p><strong>Atividades:</strong> {experiencia.descricao}</p>}
                      {candidato.cursosCertificacoes && candidato.cursosCertificacoes.length > 0 && <p><strong>Cursos:</strong> {candidato.cursosCertificacoes.join(', ')}</p>}
                      {candidato.idiomas && candidato.idiomas.length > 0 && <p><strong>Idiomas:</strong> {candidato.idiomas.join(', ')}</p>}
                      {candidato.pcd && <p><strong>PCD:</strong> Sim</p>}
                    </div>
                  )}
                </article>
              );
            })}

            {candidatosExibidos.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center text-slate-600">
                <p className="text-base font-semibold text-slate-800">Nenhum currículo encontrado.</p>
                <p className="text-sm mt-1">Tente ajustar o termo de busca ou o filtro de status acima.</p>
              </div>
            )}
          </div>
        </section>

        {/* Ferramentas e Manutenções */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Rotinas e Manutenções do Sistema</h2>
              <p className="text-sm text-slate-600">Revalidações periódicas e indexação da busca semântica com IA.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={executarRevalidacao}
                disabled={!token || carregando}
                className="rounded-lg bg-singreen px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Executar revalidação agora
              </button>
              <button
                onClick={backfillEmbeddings}
                disabled={!token || carregando}
                className="rounded-lg border border-brand-600 px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
              >
                Atualizar embeddings (Busca semântica)
              </button>
            </div>
          </div>
        </section>

        {/* Modal de Distribuição Regional de Currículos Ativos */}
        {modalDistribuicaoAberta && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs"
            onClick={() => setModalDistribuicaoAberta(false)}
          >
            <div
              className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <span>📍</span> Distribuição de Currículos Ativos por Cidade
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Relação quantitativa de candidatos ativos agrupados por município.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalDistribuicaoAberta(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Badges and Filter */}
              <div className="border-b border-slate-200 px-5 py-3 sm:px-6 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-semibold text-emerald-800">
                    Total Ativos: <strong>{indicadores?.resumo.ativos ?? totalAtivos}</strong>
                  </span>
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 font-semibold text-slate-800">
                    Cidades: <strong>{distribuicaoCidades.length}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Filtrar cidade..."
                    value={buscaDistribuicaoCidade}
                    onChange={(e) => setBuscaDistribuicaoCidade(e.target.value)}
                    className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10"
                  />
                  <button
                    type="button"
                    onClick={copiarResumoCidades}
                    title="Copiar lista resumida no formato 'Belo Horizonte 15, Contagem 7...'"
                    className="shrink-0 rounded-lg border border-brand-600 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    {copiadoResumo ? '✓ Copiado!' : 'Copiar Lista'}
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5 max-h-[55vh]">
                {distribuicaoCidadesFiltradas.map((item, index) => {
                  const totalAtiv = indicadores?.resumo.ativos ?? totalAtivos;
                  const percentual = totalAtiv > 0 ? Math.round((item.total / totalAtiv) * 100) : 0;
                  return (
                    <div
                      key={`${item.cidade}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:bg-emerald-50/60 hover:border-emerald-300"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-900 truncate text-sm sm:text-base">
                            {item.cidade}
                          </span>
                          {item.uf && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                              {item.uf}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${Math.max(percentual, 3)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-lg sm:text-xl font-extrabold text-emerald-700 leading-none">
                            {item.total}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {percentual}% dos ativos
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => filtrarPorCidade(item.cidade)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Ver currículos &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}

                {distribuicaoCidadesFiltradas.length === 0 && (
                  <div className="py-10 text-center text-slate-500">
                    <p className="text-base font-semibold">Nenhuma cidade encontrada.</p>
                    <p className="text-xs mt-1">Tente ajustar o termo digitado no filtro de busca.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
                <p className="text-xs text-slate-500 text-center sm:text-left">
                  Clique em <strong>Ver currículos</strong> para filtrar a base na cidade selecionada.
                </p>
                <button
                  type="button"
                  onClick={() => setModalDistribuicaoAberta(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 w-full sm:w-auto"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
