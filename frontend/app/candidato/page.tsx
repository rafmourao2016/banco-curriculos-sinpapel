'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { areaPretendidaOptions, anosExperienciaOptions, pretensaoSalarialOptions, turnoOptions } from '../../lib/cadastroSchema';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const inputClasses = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10';

type Perfil = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  regiao: string;
  uf?: string | null;
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
  possuiCnh: boolean;
  categoriaCnh?: string | null;
  pcd?: boolean | null;
  pcdObservacao?: string | null;
  ativo: boolean;
  dataUltimaRevalidacao: string;
};

function lista(valor: string) {
  return valor.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function CandidatoPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false);
  const [token, setToken] = useState('');
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function carregarPerfil(accessToken: string) {
    const res = await fetch(`${API_URL}/candidatos/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Não foi possível carregar seu currículo.');
    setPerfil(await res.json());
  }

  async function solicitarRecuperacao() {
    setErro(null);
    setMensagem(null);
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um e-mail valido para receber o link.');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/auth/solicitar-recuperacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo: 'candidato' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Nao foi possivel solicitar a recuperacao.');
      setMensagem(data.mensagem ?? 'Confira seu e-mail para redefinir a senha.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    if (!email.trim()) {
      setErro('Informe seu e-mail.');
      return;
    }
    if (!email.includes('@')) {
      setErro('Informe um e-mail valido.');
      return;
    }
    if (senha.length < 8) {
      setErro('A senha deve ter no minimo 8 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/auth/candidato/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) throw new Error('E-mail ou senha inválidos.');
      const data = await res.json();
      setToken(data.accessToken);
      await carregarPerfil(data.accessToken);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!perfil) return;
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    const form = new FormData(event.currentTarget);

    try {
      const body = {
        telefone: String(form.get('telefone') ?? ''),
        regiao: String(form.get('regiao') ?? ''),
        uf: String(form.get('uf') ?? '').toUpperCase(),
        areaPretendida: String(form.get('areaPretendida') ?? ''),
        cargoPretendido: String(form.get('cargoPretendido') ?? ''),
        pretensaoSalarial: String(form.get('pretensaoSalarial') ?? ''),
        experienciaSetorPapel: form.get('experienciaSetorPapel') === 'on',
        anosExperienciaTotal: String(form.get('anosExperienciaTotal') ?? ''),
        turnos: form.getAll('turnos').map(String),
        inicioImediato: form.get('inicioImediato') === 'on',
        disponibilidadeMudanca: form.get('disponibilidadeMudanca') === 'on',
        cursosCertificacoes: lista(String(form.get('cursosCertificacoes') ?? '')),
        idiomas: lista(String(form.get('idiomas') ?? '')),
        possuiCnh: form.get('possuiCnh') === 'on',
        categoriaCnh: String(form.get('categoriaCnh') ?? ''),
        pcd: form.get('pcd') === 'on',
        pcdObservacao: String(form.get('pcdObservacao') ?? ''),
      };

      const res = await fetch(`${API_URL}/candidatos/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Não foi possível atualizar seu currículo.');
      await carregarPerfil(token);
      setMensagem('Currículo atualizado e disponibilidade renovada.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function confirmar() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/candidatos/me/confirmar-disponibilidade`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Não foi possível confirmar disponibilidade.');
      await carregarPerfil(token);
      setMensagem('Disponibilidade confirmada.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function baixarPdf() {
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/candidatos/me/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Nao foi possivel gerar o PDF.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'meu-curriculo-sinpapel.pdf';
      link.click();
      window.URL.revokeObjectURL(url);
      setMensagem('PDF gerado com sucesso.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function excluir() {
    if (!confirm('Excluir seu currículo definitivamente? Esta ação não pode ser desfeita.')) return;
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/candidatos/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Não foi possível excluir o currículo.');
      setPerfil(null);
      setToken('');
      setMensagem('Currículo excluído com sucesso.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
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
            Fazer novo cadastro
          </Link>
        </div>

        <header className="mt-8 rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-700">Área do candidato</p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Atualize seu currículo em uma única tela.</h1>
          <p className="mt-2 text-slate-600">Confirme disponibilidade, edite filtros importantes ou solicite exclusão dos seus dados.</p>
        </header>

        {!perfil ? (
          <form onSubmit={entrar} noValidate className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/70 sm:max-w-lg sm:p-6">
            <input className={inputClasses} type="email" autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputClasses} type="password" autoComplete="current-password" minLength={8} placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
            <button disabled={carregando} className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
            <button type="button" onClick={() => setMostrarRecuperacao((atual) => !atual)} className="text-sm font-semibold text-brand-700 underline underline-offset-4">
              Esqueci minha senha
            </button>
            {mostrarRecuperacao && <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><p>Informe o e-mail do cadastro e enviaremos um link para criar uma nova senha.</p><button type="button" onClick={solicitarRecuperacao} disabled={carregando} className="rounded-lg border border-brand-600 px-4 py-3 font-semibold text-brand-700 disabled:opacity-60">Enviar link de recuperacao</button></div>}
          </form>
        ) : (
          <form onSubmit={salvar} className="mt-6 grid gap-5 rounded-2xl bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold">{perfil.nome}</h2>
                <p className="text-sm text-slate-600">{perfil.email}</p>
                <p className="mt-1 text-sm text-slate-600">Atualizado em {new Intl.DateTimeFormat('pt-BR').format(new Date(perfil.dataUltimaRevalidacao))}</p>
              </div>
              <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                <button type="button" onClick={confirmar} disabled={carregando} className="min-w-0 rounded-lg bg-singreen px-4 py-3 text-sm font-semibold text-white">Confirmar disponibilidade</button>
                <button type="button" onClick={baixarPdf} disabled={carregando} className="min-w-0 rounded-lg border border-brand-600 px-4 py-3 text-sm font-semibold text-brand-700">Baixar PDF</button>
                <button type="button" onClick={excluir} disabled={carregando} className="min-w-0 rounded-lg border border-sinred px-4 py-3 text-sm font-semibold text-sinred sm:col-span-2">Excluir currículo</button>
              </div>
            </div>

            <section className="grid gap-4 sm:grid-cols-2">
              <input name="telefone" defaultValue={perfil.telefone} className={inputClasses} placeholder="Telefone" />
              <input name="regiao" defaultValue={perfil.regiao} className={inputClasses} placeholder="Cidade" />
              <input name="uf" defaultValue={perfil.uf ?? 'MG'} maxLength={2} className={inputClasses} placeholder="UF" />
              <input name="cargoPretendido" defaultValue={perfil.cargoPretendido ?? ''} className={inputClasses} placeholder="Cargo pretendido" />
              <select name="areaPretendida" defaultValue={perfil.areaPretendida ?? 'producao'} className={inputClasses}>
                {areaPretendidaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select name="pretensaoSalarial" defaultValue={perfil.pretensaoSalarial ?? 'a_combinar'} className={inputClasses}>
                {pretensaoSalarialOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <select name="anosExperienciaTotal" defaultValue={perfil.anosExperienciaTotal ?? 'sem_experiencia'} className={inputClasses}>
                {anosExperienciaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input name="categoriaCnh" defaultValue={perfil.categoriaCnh ?? ''} className={inputClasses} placeholder="Categoria CNH" />
              <input name="cursosCertificacoes" defaultValue={perfil.cursosCertificacoes?.join(', ') ?? ''} className={inputClasses} placeholder="Cursos e certificações" />
              <input name="idiomas" defaultValue={perfil.idiomas?.join(', ') ?? ''} className={inputClasses} placeholder="Idiomas" />
            </section>

            <section className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
              {turnoOptions.map((turno) => (
                <label key={turno.value} className="flex items-center gap-3 text-sm">
                  <input name="turnos" type="checkbox" value={turno.value} defaultChecked={perfil.turnos?.includes(turno.value)} className="h-5 w-5" />
                  {turno.label}
                </label>
              ))}
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              {[
                ['possuiCnh', 'Possuo CNH', perfil.possuiCnh],
                ['experienciaSetorPapel', 'Tenho experiência no setor papel/embalagem', !!perfil.experienciaSetorPapel],
                ['inicioImediato', 'Tenho início imediato', !!perfil.inicioImediato],
                ['disponibilidadeMudanca', 'Tenho disponibilidade para mudança', !!perfil.disponibilidadeMudanca],
                ['pcd', 'Sou PCD', !!perfil.pcd],
              ].map(([name, label, checked]) => (
                <label key={String(name)} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                  <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} className="h-5 w-5" />
                  {label}
                </label>
              ))}
              <input name="pcdObservacao" defaultValue={perfil.pcdObservacao ?? ''} className={inputClasses} placeholder="Observação PCD" />
            </section>

            <button disabled={carregando} className="rounded-lg bg-brand-600 px-5 py-4 font-semibold text-white disabled:opacity-60">
              {carregando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        )}

        {erro && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
        {mensagem && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</p>}
      </div>
    </main>
  );
}
