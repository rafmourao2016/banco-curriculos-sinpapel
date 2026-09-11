'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { anosExperienciaOptions, areaPretendidaOptions, escolaridadeOptions, pretensaoSalarialOptions, turnoOptions } from '../../lib/cadastroSchema';
import { apenasDigitos, cnpjValido } from '../../lib/documentos';
import { Localidade } from '../../components/Localidade';
import { ContadorCurriculos } from '../components/contador-curriculos';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const inputClasses = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10';

const rotulos: Record<string, string> = {
  producao: 'Produção',
  manutencao: 'Manutenção',
  administrativo: 'Administrativo',
  logistica: 'Logística',
  qualidade: 'Qualidade',
  comercial: 'Comercial',
  ti: 'TI',
  engenharia: 'Engenharia',
  outra: 'Outra',
  CONTATADO: 'Contatado',
  EM_PROCESSO_SELETIVO: 'Em processo seletivo',
  CONTRATADO: 'Contratado',
  NAO_COMPATIVEL: 'Não compatível',
};

function rotulo(valor?: string | null) {
  if (!valor) return 'Não informado';
  return rotulos[valor] ?? valor;
}

function normalizarBusca(valor?: string | null) {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function idadeEmAnos(dataNascimento?: string | null) {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aniversarioAindaNaoChegou =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aniversarioAindaNaoChegou) idade -= 1;
  return idade;
}

type CandidatoEmpresa = {
  id: string;
  nome: string;
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
  possuiCnh: boolean;
  categoriaCnh?: string | null;
  cargoPretendido?: string | null;
  interesseJovemAprendiz?: boolean | null;
  statusEmpresa?: string | null;
  dataAdmissaoEmpresa?: string | null;
  comentarioEmpresa?: string | null;
  habilidades: string[];
  anosExperienciaTotal?: string | null;
  experiencias: Array<{ cargo: string; area?: string | null }>;
  formacoes?: Array<{ curso?: string | null; nivel?: string | null }>;
};

function perfilJovemAprendiz(candidato: CandidatoEmpresa) {
  if (candidato.interesseJovemAprendiz) return true;

  const idade = idadeEmAnos(candidato.dataNascimento);
  const textos = [
    candidato.cargoPretendido,
    ...candidato.experiencias.map((experiencia) => `${experiencia.cargo} ${experiencia.area ?? ''}`),
    ...(candidato.formacoes ?? []).map((formacao) => `${formacao.curso ?? ''} ${formacao.nivel ?? ''}`),
  ].map(normalizarBusca).join(' ');

  const mencionaAprendiz = textos.includes('jovem aprendiz') || textos.includes('aprendizagem') || textos.includes('aprendiz');
  return mencionaAprendiz || (idade !== null && idade >= 14 && idade <= 24 && candidato.anosExperienciaTotal === 'sem_experiencia');
}

type Vaga = {
  id: string;
  area: string;
  requisitos: string;
  ativa: boolean;
};

export default function EmpresaPage() {
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar');
  const [token, setToken] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');
  const [erroCnpj, setErroCnpj] = useState<string | null>(null);
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState<string | null>(null);
  const [erroRecuperacao, setErroRecuperacao] = useState<string | null>(null);
  const [codigo2fa, setCodigo2fa] = useState('');
  const [exige2fa, setExige2fa] = useState(false);
  const [twoFaAtivo, setTwoFaAtivo] = useState(false);
  const [twoFaQr, setTwoFaQr] = useState('');
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [twoFaCodigo, setTwoFaCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [buscandoCandidatos, setBuscandoCandidatos] = useState(false);
  const [baixandoPdfId, setBaixandoPdfId] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<CandidatoEmpresa[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);

  async function cadastrarEmpresa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const form = new FormData(event.currentTarget);
    const cnpj = apenasDigitos(cnpjEmpresa);
    if (!cnpj) {
      setErroCnpj('CNPJ obrigatório.');
      setErro('Informe o CNPJ da empresa.');
      setCarregando(false);
      return;
    }
    if (!cnpjValido(cnpj)) {
      setErroCnpj('CNPJ inválido. Confira o número informado.');
      setErro('CNPJ inválido. Confira o número informado.');
      setCarregando(false);
      return;
    }
    setErroCnpj(null);
    try {
      const res = await fetch(`${API_URL}/empresas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razaoSocial: String(form.get('razaoSocial') ?? ''),
          cnpj,
          email: String(form.get('email') ?? ''),
          senha: String(form.get('senha') ?? ''),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Não foi possível cadastrar a empresa.');
      }
      setEmail(String(form.get('email') ?? ''));
      setSenha(String(form.get('senha') ?? ''));
      setModo('entrar');
      setMensagem('Empresa cadastrada. Agora clique em Entrar.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function solicitarRecuperacao() {
    setErro(null);
    setMensagem(null);
    setErroRecuperacao(null);
    setMensagemRecuperacao(null);
    if (!email.trim() || !email.includes('@')) {
      setErroRecuperacao('Informe um e-mail válido para receber o link.');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/auth/solicitar-recuperacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo: 'empresa' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Não foi possível solicitar a recuperação.');
      setMensagemRecuperacao(`${data.mensagem ?? 'Confira seu e-mail para redefinir a senha.'} Verifique também a pasta de spam, lixo eletrônico ou promoções.`);
    } catch (e) {
      setErroRecuperacao(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    if (!email.trim()) {
      setErro('Informe o e-mail da empresa.');
      return;
    }
    if (!email.includes('@')) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/auth/empresa/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, ...(codigo2fa.trim() ? { codigo2fa: codigo2fa.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detalhe = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(detalhe ?? 'E-mail ou senha inválidos.');
      }
      if (data.requer2fa) {
        setExige2fa(true);
        setMensagem(data.mensagem ?? 'Digite o código do aplicativo autenticador.');
        return;
      }
      setToken(data.accessToken);
      setEmpresaNome(data.empresa?.razaoSocial ?? 'Empresa');
      await carregarVagas(data.accessToken);
      await carregarStatus2fa(data.accessToken);
      setCodigo2fa('');
      setExige2fa(false);
      setMensagem('Empresa conectada.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarStatus2fa(accessToken: string) {
    const res = await fetch(`${API_URL}/empresas/2fa/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) setTwoFaAtivo((await res.json()).ativo === true);
  }

  async function iniciar2fa() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/empresas/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Não foi possível iniciar o 2FA.');
      setTwoFaQr(data.qrCodeDataUrl ?? '');
      setTwoFaSecret(data.secret ?? '');
      setMensagem('Escaneie o QR Code no aplicativo autenticador e informe o código gerado.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function confirmar2fa() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/empresas/2fa/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ codigo: twoFaCodigo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Código 2FA inválido.');
      setTwoFaAtivo(true);
      setTwoFaQr('');
      setTwoFaSecret('');
      setTwoFaCodigo('');
      setMensagem('2FA ativado. A empresa pedirá um código a cada novo login.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function desativar2fa() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/empresas/2fa/desativar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ codigo: twoFaCodigo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Código 2FA inválido.');
      setTwoFaAtivo(false);
      setTwoFaCodigo('');
      setMensagem('2FA desativado.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarVagas(accessToken = token) {
    if (!accessToken) return;
    const res = await fetch(`${API_URL}/empresas/vagas`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) setVagas(await res.json());
  }

  async function criarVaga(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch(`${API_URL}/empresas/vagas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          area: String(form.get('area') ?? ''),
          requisitos: String(form.get('requisitos') ?? ''),
        }),
      });
      if (!res.ok) throw new Error('Não foi possível cadastrar a necessidade.');
      event.currentTarget.reset();
      await carregarVagas();
      setMensagem('Necessidade cadastrada. Alertas reversos foram registrados para candidatos compatíveis.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarStatus(candidatoId: string, status: string) {
    setErro(null);
    setMensagem(null);
    const comentario = window.prompt('Comentário opcional para o SINPAPEL:')?.trim() ?? '';
    let dataAdmissao = '';
    if (status === 'CONTRATADO') {
      const hoje = new Date().toISOString().slice(0, 10);
      dataAdmissao = window.prompt('Informe a data de admissão (AAAA-MM-DD):', hoje)?.trim() ?? '';
      if (!dataAdmissao) {
        setErro('Informe a data de admissão para marcar como contratado.');
        return;
      }
    }
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/empresas/candidatos/${candidatoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, dataAdmissao: dataAdmissao || undefined, comentario: comentario || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detalhe = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(detalhe ?? 'Não foi possível atualizar o status.');
      }
      setCandidatos((atuais) => status === 'CONTRATADO'
        ? atuais.filter((candidato) => candidato.id !== candidatoId)
        : atuais.map((candidato) => candidato.id === candidatoId ? { ...candidato, statusEmpresa: status, comentarioEmpresa: comentario || null } : candidato));
      setMensagem(status === 'CONTRATADO' ? 'Contratação registrada. O currículo saiu da base ativa.' : 'Status atualizado.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  function formatarNomeArquivoCurriculo(nome: string) {
    const nomeFormatado = (nome || 'candidato')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return `curriculo-${nomeFormatado.toLowerCase() || 'candidato'}.pdf`;
  }

  async function buscar(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setErro(null);
    setMensagem(null);
    setBuscandoCandidatos(true);
    const form = event?.currentTarget ? new FormData(event.currentTarget) : new FormData();
    try {
      const params = new URLSearchParams();
      const tipoOportunidade = String(form.get('tipoOportunidade') ?? '').trim();
      ['q', 'tipoOportunidade', 'area', 'uf', 'regiao', 'cidades', 'escolaridade', 'experiencia', 'cnh', 'turno', 'inicioImediato', 'pretensaoSalarial', 'cursos'].forEach((campo) => {
        const valor = String(form.get(campo) ?? '').trim();
        if (valor) params.set(campo, valor);
      });
      if (form.get('semantica')) params.set('semantica', '1');
      const res = await fetch(`${API_URL}/empresas/candidatos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detalhe = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(detalhe ?? 'Não foi possível consultar candidatos.');
      }
      setCandidatos(tipoOportunidade === 'jovem_aprendiz' ? data.filter(perfilJovemAprendiz) : data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setBuscandoCandidatos(false);
    }
  }

  async function baixarPdf(candidato: CandidatoEmpresa) {
    setErro(null);
    setMensagem(null);
    setBaixandoPdfId(candidato.id);
    try {
      const res = await fetch(`${API_URL}/empresas/candidatos/${candidato.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Não foi possível baixar o PDF.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = formatarNomeArquivoCurriculo(candidato.nome);
      link.click();
      window.URL.revokeObjectURL(url);
      setMensagem(`PDF de ${candidato.nome} baixado com sucesso.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setBaixandoPdfId(null);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-slate-950 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
            Cadastrar currículo
          </Link>
        </div>

        <div className="logo-spotlight mt-6">
          <img
            src="/logo-sinpapel.png"
            alt="SINPAPEL - Sindicato das Indústrias de Celulose, Papel e Papelão no Estado de Minas Gerais"
            className="relative z-10 h-auto w-44 max-w-full sm:w-60"
          />
        </div>

        <header className="mt-6 rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-singreen">Painel da empresa</p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Encontre candidatos ativos no banco do SINPAPEL.</h1>
          <p className="mt-2 text-slate-600">Entre, filtre os currículos e baixe o PDF profissional do candidato.</p>
        </header>

        {!token ? (
          <section className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-2xl bg-white p-4 shadow-xl shadow-slate-200/70">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setModo('entrar')} className={`rounded-lg px-4 py-3 text-sm font-semibold ${modo === 'entrar' ? 'bg-brand-600 text-white' : 'border border-slate-300 text-slate-700'}`}>
                  Entrar
                </button>
                <button onClick={() => setModo('cadastrar')} className={`rounded-lg px-4 py-3 text-sm font-semibold ${modo === 'cadastrar' ? 'bg-brand-600 text-white' : 'border border-slate-300 text-slate-700'}`}>
                  Cadastrar empresa
                </button>
              </div>

              {modo === 'entrar' ? (
                <form onSubmit={entrar} noValidate className="mt-4 grid gap-3">
                  <input className={inputClasses} type="email" autoComplete="email" placeholder="E-mail da empresa" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className={inputClasses} type="password" autoComplete="current-password" minLength={8} placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
                  {exige2fa && (
                    <input className={inputClasses} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Código de 6 dígitos do autenticador" value={codigo2fa} onChange={(e) => setCodigo2fa(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  )}
                  <button disabled={carregando} className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
                    {carregando ? 'Entrando...' : exige2fa ? 'Confirmar código e entrar' : 'Entrar'}
                  </button>
                  <button type="button" onClick={() => setMostrarRecuperacao((atual) => !atual)} className="text-sm font-semibold text-brand-700 underline underline-offset-4">
                    Esqueci minha senha
                  </button>
                  {mostrarRecuperacao && (
                    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                      <p>Informe o e-mail da empresa e enviaremos um link para criar uma nova senha.</p>
                      <button type="button" onClick={solicitarRecuperacao} disabled={carregando} className="rounded-lg border border-brand-600 px-4 py-3 font-semibold text-brand-700 disabled:opacity-60">
                        {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
                      </button>
                      {mensagemRecuperacao && (
                        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                          {mensagemRecuperacao}
                        </p>
                      )}
                      {erroRecuperacao && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                          {erroRecuperacao}
                        </p>
                      )}
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={cadastrarEmpresa} className="mt-4 grid gap-3">
                      <input name="razaoSocial" required minLength={2} className={inputClasses} placeholder="Razão social" />
                  <div className="grid gap-1">
                    <input
                      name="cnpj"
                      required
                      aria-invalid={Boolean(erroCnpj)}
                      minLength={14}
                      maxLength={18}
                      inputMode="numeric"
                      className={inputClasses}
                      placeholder="CNPJ obrigatório - 00.000.000/0000-00"
                      value={cnpjEmpresa}
                      onChange={(event) => {
                        setCnpjEmpresa(event.target.value);
                        if (erroCnpj) setErroCnpj(null);
                      }}
                      onBlur={() => {
                        const cnpj = apenasDigitos(cnpjEmpresa);
                        if (!cnpj) setErroCnpj('CNPJ obrigatório.');
                        else if (!cnpjValido(cnpj)) setErroCnpj('CNPJ inválido. Confira o número informado.');
                      }}
                    />
                    {erroCnpj && <p className="text-sm text-red-600">{erroCnpj}</p>}
                  </div>
                  <input name="email" required className={inputClasses} type="email" placeholder="E-mail" />
                  <input name="senha" required minLength={8} className={inputClasses} type="password" placeholder="Crie uma senha" />
                  <button disabled={carregando} className="rounded-lg bg-singreen px-5 py-3 font-semibold text-white disabled:opacity-60">
                    {carregando ? 'Cadastrando...' : 'Cadastrar empresa'}
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-xl shadow-slate-200/70">
              <h2 className="text-xl font-semibold text-slate-950">Como funciona</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700">
                    <span className="text-sm font-black leading-none">BUSCA</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">Filtragem estratégica</h3>
                  <p className="mt-2 text-sm leading-6">
                    Acesse instantaneamente candidatos ideais através de filtros avançados: cidade, área profissional, escolaridade, experiência e certificações.
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    Visualize apenas perfis de candidatos ativos, otimizando seu processo de seleção.
                  </p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700">
                    <span className="text-2xl font-black leading-none">PDF</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">Perfis padronizados</h3>
                  <p className="mt-2 text-sm leading-6">
                    Visualize perfis consistentes e profissionais, gerados automaticamente a partir de dados estruturados e verificados dos candidatos.
                  </p>
                  <p className="mt-2 text-sm leading-6">
                    Baixe PDFs prontos e completos, sem depender de anexos enviados pelos candidatos.
                  </p>
                </article>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-5">
            <div className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Empresa conectada</p>
                  <h2 className="text-2xl font-semibold">{empresaNome}</h2>
                </div>
                <button onClick={() => { setToken(''); setCandidatos([]); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                  Sair
                </button>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-singreen">Segurança da conta</p>
                  <h3 className="mt-2 text-xl font-semibold">Autenticação em duas etapas</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {twoFaAtivo ? 'Ativa: além da senha, será solicitado um código do aplicativo autenticador.' : 'Proteja o acesso da empresa com um código temporário do aplicativo autenticador.'}
                  </p>
                </div>
                {!twoFaAtivo && !twoFaQr && (
                  <button type="button" onClick={iniciar2fa} disabled={carregando} className="rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    Ativar 2FA
                  </button>
                )}
              </div>

              {!twoFaAtivo && twoFaQr && (
                <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-[220px_1fr] sm:items-center">
                  <img src={twoFaQr} alt="QR Code para ativar a autenticação em duas etapas" className="h-[220px] w-[220px] rounded-lg border border-slate-200 p-2" />
                  <div className="grid gap-3">
                    <p className="text-sm text-slate-700">Abra Google Authenticator, Microsoft Authenticator ou outro aplicativo compatível e escaneie o QR Code.</p>
                    <p className="break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">Chave manual: {twoFaSecret}</p>
                    <input className={inputClasses} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Digite o código de 6 dígitos" value={twoFaCodigo} onChange={(e) => setTwoFaCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                    <button type="button" onClick={confirmar2fa} disabled={carregando || twoFaCodigo.length !== 6} className="rounded-lg bg-singreen px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      Confirmar e ativar 2FA
                    </button>
                  </div>
                </div>
              )}

              {twoFaAtivo && (
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                  <input className={`${inputClasses} sm:max-w-xs`} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Código atual para desativar" value={twoFaCodigo} onChange={(e) => setTwoFaCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  <button type="button" onClick={desativar2fa} disabled={carregando || twoFaCodigo.length !== 6} className="rounded-lg border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60">
                    Desativar 2FA
                  </button>
                </div>
              )}
            </section>

            <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-xl shadow-slate-200/70 lg:grid-cols-[360px_1fr]">
              <form onSubmit={criarVaga} className="grid gap-3">
                <h3 className="text-lg font-semibold">Cadastrar necessidade</h3>
                <select name="area" className={inputClasses} defaultValue="producao">
                  {areaPretendidaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <textarea name="requisitos" className={`${inputClasses} min-h-24`} placeholder="Descreva os requisitos da vaga" />
                <button disabled={carregando} className="rounded-lg bg-singreen px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  Cadastrar necessidade
                </button>
              </form>
              <div className="grid content-start gap-2">
                <h3 className="text-lg font-semibold">Necessidades cadastradas</h3>
                {vagas.map((vaga) => (
                  <div key={vaga.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-semibold">{rotulo(vaga.area)}</p>
                    <p className="mt-1 text-slate-600">{vaga.requisitos}</p>
                  </div>
                ))}
                {vagas.length === 0 && <p className="text-sm text-slate-600">Nenhuma necessidade cadastrada.</p>}
              </div>
            </section>

            <ContadorCurriculos token={token} />

            <form onSubmit={buscar} className="grid gap-3 rounded-2xl bg-white p-4 shadow-xl shadow-slate-200/70 sm:grid-cols-2 lg:grid-cols-6">
              <input name="q" className={inputClasses} placeholder="Nome, cargo ou habilidade" />
              <select name="tipoOportunidade" className={inputClasses} defaultValue="">
                <option value="">Todos os perfis</option>
                <option value="jovem_aprendiz">Jovem Aprendiz</option>
              </select>
              <Localidade filtro className={inputClasses} />
              <select name="area" className={inputClasses} defaultValue="">
                <option value="">Todas as áreas</option>
                {areaPretendidaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select name="escolaridade" className={inputClasses} defaultValue="">
                <option value="">Escolaridade</option>
                {escolaridadeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select name="experiencia" className={inputClasses} defaultValue="">
                <option value="">Experiência</option>
                {anosExperienciaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select name="cnh" className={inputClasses} defaultValue="">
                <option value="">CNH</option>
                <option value="sim">Com CNH</option>
              </select>
              <select name="turno" className={inputClasses} defaultValue="">
                <option value="">Turno</option>
                {turnoOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select name="inicioImediato" className={inputClasses} defaultValue="">
                <option value="">Início</option>
                <option value="sim">Início imediato</option>
              </select>
              <select name="pretensaoSalarial" className={inputClasses} defaultValue="">
                <option value="">Pretensão salarial</option>
                {pretensaoSalarialOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input name="cursos" className={inputClasses} placeholder="Cursos/certificações separados por vírgula" />
              <label className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 sm:col-span-2 lg:col-span-6">
                <input name="semantica" type="checkbox" value="1" className="h-5 w-5" />
                Usar busca semântica
              </label>
              <button disabled={buscandoCandidatos} className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2 lg:col-span-6">
                {buscandoCandidatos ? 'Buscando...' : 'Buscar candidatos'}
              </button>
            </form>

            <div className="grid gap-3">
              {candidatos.map((candidato) => (
                <article key={candidato.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold">{candidato.nome}</h3>
                      <p className="mt-1 text-sm text-slate-600">{candidato.cargoPretendido ?? candidato.experiencias[0]?.cargo ?? 'Cargo não informado'} - {candidato.regiao}{candidato.uf ? `/${candidato.uf}` : ''}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {candidato.interesseJovemAprendiz && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Jovem Aprendiz
                          </span>
                        )}
                        {candidato.habilidades.map((habilidade) => <span key={habilidade} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{habilidade}</span>)}
                      </div>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 lg:min-w-72">
                      <p><strong>E-mail:</strong> {candidato.email}</p>
                      <p><strong>Telefone:</strong> {candidato.telefone}</p>
                      {(candidato.logradouro || candidato.bairro || candidato.numeroEndereco || candidato.cep) && (
                        <p>
                          <strong>Endereço:</strong>{' '}
                          {[
                            candidato.logradouro,
                            candidato.numeroEndereco,
                            candidato.bairro,
                            candidato.regiao,
                            candidato.uf,
                            candidato.cep ? `CEP ${candidato.cep}` : null,
                          ].filter(Boolean).join(', ')}
                          {candidato.complementoEndereco ? ` - ${candidato.complementoEndereco}` : ''}
                        </p>
                      )}
                      <p><strong>CNH:</strong> {candidato.possuiCnh ? candidato.categoriaCnh || 'Sim' : 'Não'}</p>
                      <p><strong>Status:</strong> {candidato.statusEmpresa ? rotulo(candidato.statusEmpresa) : 'Sem status'}</p>
                      {candidato.comentarioEmpresa && <p><strong>Comentário:</strong> {candidato.comentarioEmpresa}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          ['CONTATADO', 'Contatado'],
                          ['EM_PROCESSO_SELETIVO', 'Em processo'],
                          ['CONTRATADO', 'Contratado'],
                          ['NAO_COMPATIVEL', 'Não compatível'],
                        ].map(([valor, label]) => (
                          <button key={valor} type="button" onClick={() => atualizarStatus(candidato.id, valor)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${candidato.statusEmpresa === valor ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-700'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={baixandoPdfId === candidato.id}
                        onClick={() => baixarPdf(candidato)}
                        className="rounded-lg bg-singreen px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                        {baixandoPdfId === candidato.id ? 'Baixando PDF...' : 'Baixar PDF'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {candidatos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                  Use os filtros e clique em Buscar candidatos.
                </div>
              )}
            </div>
          </section>
        )}

        {erro && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
        {mensagem && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</p>}
      </div>
    </main>
  );
}
