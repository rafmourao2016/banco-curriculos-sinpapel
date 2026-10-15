'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Localidade } from '../../components/Localidade';
import { areaPretendidaOptions, anosExperienciaOptions, pretensaoSalarialOptions, turnoOptions } from '../../lib/cadastroSchema';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const inputClasses = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10';

function LocalidadePerfil({ uf, cidade }: { uf: string; cidade: string }) {
  const [local, setLocal] = useState({ uf, cidade });
  return <Localidade {...local} className={inputClasses} onChange={(uf, cidade) => setLocal({ uf, cidade })} />;
}

type Perfil = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  regiao: string;
  uf?: string | null;
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
  possuiCnh: boolean;
  categoriaCnh?: string | null;
  pcd?: boolean | null;
  pcdObservacao?: string | null;
  ativo: boolean;
  dataUltimaRevalidacao: string;
};

type VagaDisponivel = {
  id: string;
  area: string;
  requisitos: string;
  imagemUrl?: string | null;
  empresaNome: string;
  jaCandidatou: boolean;
  candidatura?: {
    id: string;
    dataEnvio: string;
    mensagem: string;
  } | null;
};

function lista(valor: string) {
  return valor.split(',').map((item) => item.trim()).filter(Boolean);
}

function rotuloArea(valor?: string | null) {
  if (!valor) return 'Geral';
  const opt = areaPretendidaOptions.find((o) => o.value === valor);
  return opt ? opt.label : valor;
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
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

  // Vagas e Candidaturas
  const [vagas, setVagas] = useState<VagaDisponivel[]>([]);
  const [carregandoVagas, setCarregandoVagas] = useState(false);
  const [vagaSelecionadaParaCandidatar, setVagaSelecionadaParaCandidatar] = useState<VagaDisponivel | null>(null);
  const [mensagemApresentacao, setMensagemApresentacao] = useState('');
  const [enviandoCandidatura, setEnviandoCandidatura] = useState(false);
  const [modalImagemVaga, setModalImagemVaga] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  function sair() {
    try {
      localStorage.removeItem('sinpapel_candidato_token');
    } catch {
      // ignore
    }
    setToken('');
    setPerfil(null);
    setVagas([]);
    setVagaSelecionadaParaCandidatar(null);
  }

  async function carregarPerfil(accessToken: string) {
    const res = await fetch(`${API_URL}/candidatos/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Não foi possível carregar seu currículo.');
    setPerfil(await res.json());
  }

  async function carregarVagas(accessToken: string) {
    setCarregandoVagas(true);
    try {
      const res = await fetch(`${API_URL}/candidatos/vagas-disponiveis`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVagas(data);
      }
    } catch {
      // ignore
    } finally {
      setCarregandoVagas(false);
    }
  }

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('sinpapel_candidato_token');
      if (savedToken) {
        setToken(savedToken);
        setCarregando(true);
        void carregarPerfil(savedToken)
          .then(() => {
            void carregarVagas(savedToken);
          })
          .catch(() => {
            sair();
          })
          .finally(() => {
            setCarregando(false);
          });
      }
    } catch {
      // ignore
    }
  }, []);

  async function solicitarRecuperacao() {
    setErro(null);
    setMensagem(null);
    if (!email.trim() || !email.includes('@')) {
      setErro('Informe um e-mail válido para receber o link.');
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
      if (!res.ok) throw new Error(data.message ?? 'Não foi possível solicitar a recuperação.');
      setMensagem(`${data.mensagem ?? 'Confira seu e-mail para redefinir a senha.'} Verifique também a pasta de spam, lixo eletrônico ou promoções.`);
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
      setErro('Informe um e-mail válido.');
      return;
    }
    if (senha.length < 8) {
      setErro('A senha deve ter no mínimo 8 caracteres.');
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
      try {
        localStorage.setItem('sinpapel_candidato_token', data.accessToken);
      } catch {
        // ignore
      }
      await carregarPerfil(data.accessToken);
      void carregarVagas(data.accessToken);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  async function candidatarVaga(event: FormEvent) {
    event.preventDefault();
    if (!vagaSelecionadaParaCandidatar) return;
    if (!mensagemApresentacao.trim()) {
      alert('Por favor, escreva uma mensagem de apresentação para a empresa.');
      return;
    }

    setEnviandoCandidatura(true);
    setErro(null);
    setMensagem(null);
    try {
      const res = await fetch(`${API_URL}/candidatos/vagas/${vagaSelecionadaParaCandidatar.id}/candidatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensagem: mensagemApresentacao.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Não foi possível enviar a candidatura.');
      }
      setMensagem('Apresentação enviada com sucesso para a empresa!');
      setVagaSelecionadaParaCandidatar(null);
      setMensagemApresentacao('');
      await carregarVagas(token);
    } catch (e: any) {
      alert(e.message || 'Erro ao enviar apresentação.');
    } finally {
      setEnviandoCandidatura(false);
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
      const body: Record<string, unknown> = {
        telefone: String(form.get('telefone') ?? ''),
        regiao: String(form.get('regiao') ?? ''),
        uf: String(form.get('uf') ?? '').toUpperCase(),
        areaPretendida: String(form.get('areaPretendida') ?? ''),
        cargoPretendido: String(form.get('cargoPretendido') ?? ''),
        interesseJovemAprendiz: form.get('interesseJovemAprendiz') === 'on',
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

      let res = await fetch(`${API_URL}/candidatos/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.clone().json().catch(() => ({}));
        const detalhe = Array.isArray(data.message) ? data.message.join(' ') : String(data.message ?? '');
        if (detalhe.includes('interesseJovemAprendiz')) {
          const bodyCompatibilidade = { ...body };
          delete bodyCompatibilidade.interesseJovemAprendiz;
          res = await fetch(`${API_URL}/candidatos/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(bodyCompatibilidade),
          });
        }
      }
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
      if (!res.ok) throw new Error('Não foi possível gerar o PDF.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const nomeFormatado = perfil?.nome
        ? perfil.nome.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s-_]/g, '').trim().replace(/\s+/g, '-').toLowerCase()
        : 'meu-curriculo';
      link.download = `curriculo-${nomeFormatado}.pdf`;
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
      sair();
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

        <div className="logo-spotlight mt-8">
          <img
            src="/logo-sinpapel.png"
            alt="SINPAPEL - Sindicato das Indústrias de Celulose, Papel e Papelão no Estado de Minas Gerais"
            className="relative z-10 h-auto w-64 max-w-full sm:w-80"
          />
        </div>

        <header className="mt-8 rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-700">Área do candidato</p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Atualize seu currículo e conecte-se a vagas exclusivas.</h1>
          <p className="mt-2 text-slate-600">Veja oportunidades abertas pelas indústrias associadas, envie sua apresentação e gerencie sua disponibilidade.</p>
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
            {mostrarRecuperacao && <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><p>Informe o e-mail do cadastro e enviaremos um link para criar uma nova senha.</p><button type="button" onClick={solicitarRecuperacao} disabled={carregando} className="rounded-lg border border-brand-600 px-4 py-3 font-semibold text-brand-700 disabled:opacity-60">Enviar link de recuperação</button></div>}
          </form>
        ) : (
          <div className="mt-6 space-y-6">
            {/* SEÇÃO DE OPORTUNIDADES ABERTAS PELAS EMPRESAS */}
            <section className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-6 border border-brand-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💼</span>
                    <h2 className="text-xl font-bold text-slate-900">Vagas e Oportunidades no Setor</h2>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Indústrias de papel, papelão e embalagens associadas ao SINPAPEL com necessidades em aberto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => carregarVagas(token)}
                  disabled={carregandoVagas}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {carregandoVagas ? 'Atualizando...' : 'Atualizar vagas'}
                </button>
              </div>

              {carregandoVagas && vagas.length === 0 && (
                <p className="text-center py-8 text-sm text-slate-500">Buscando oportunidades do setor...</p>
              )}

              {!carregandoVagas && vagas.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                  <p className="font-semibold text-sm">Nenhuma oportunidade aberta no momento.</p>
                  <p className="text-xs text-slate-500 mt-1">Fique atento, novas vagas são cadastradas frequentemente pelas empresas associadas.</p>
                </div>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {vagas.map((vaga) => (
                  <article
                    key={vaga.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white hover:border-brand-300 hover:shadow-xs"
                  >
                    <div>
                      {vaga.imagemUrl && (
                        <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() => setModalImagemVaga(vaga.imagemUrl!)}
                            className="group relative block w-full"
                            title="Clique para ampliar o banner da vaga"
                          >
                            <img src={vaga.imagemUrl} alt="Banner da vaga" className="max-h-40 w-full object-cover transition group-hover:scale-102" />
                            <span className="absolute bottom-1 right-1 rounded bg-slate-900/70 px-2 py-0.5 text-[10px] text-white">
                              🔍 Ampliar
                            </span>
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="rounded-md bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-800 border border-brand-200/60">
                          {rotuloArea(vaga.area)}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          🏢 {vaga.empresaNome}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Requisitos e Atividades:</h3>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-line line-clamp-4">
                          {vaga.requisitos}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80">
                      {vaga.jaCandidatou ? (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-2.5 text-xs text-emerald-900">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>✓</span> Apresentação enviada {vaga.candidatura?.dataEnvio ? `em ${formatarDataHora(vaga.candidatura.dataEnvio)}` : ''}
                          </div>
                          {vaga.candidatura?.mensagem && (
                            <p className="mt-1 text-[11px] text-emerald-800 italic line-clamp-2">
                              &ldquo;{vaga.candidatura.mensagem}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setVagaSelecionadaParaCandidatar(vaga);
                            setMensagemApresentacao(`Olá, tenho grande interesse na oportunidade de ${rotuloArea(vaga.area)}. Meu perfil e currículo estão disponíveis na plataforma e tenho disponibilidade imediata para contato.`);
                          }}
                          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-700 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <span>📩</span> Candidatar-se / Enviar Apresentação
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* SEÇÃO DO CURRÍCULO DO CANDIDATO */}
            <form onSubmit={salvar} className="grid gap-5 rounded-2xl bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold">{perfil.nome}</h2>
                  <p className="text-sm text-slate-600">{perfil.email}</p>
                  <p className="mt-1 text-sm text-slate-600">Atualizado em {new Intl.DateTimeFormat('pt-BR').format(new Date(perfil.dataUltimaRevalidacao))}</p>
                </div>
                <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                  <button type="button" onClick={confirmar} disabled={carregando} className="min-w-0 rounded-lg bg-singreen px-4 py-3 text-sm font-semibold text-white cursor-pointer">Confirmar disponibilidade</button>
                  <button type="button" onClick={baixarPdf} disabled={carregando} className="min-w-0 rounded-lg border border-brand-600 px-4 py-3 text-sm font-semibold text-brand-700 cursor-pointer">Baixar PDF</button>
                  <button type="button" onClick={excluir} disabled={carregando} className="min-w-0 rounded-lg border border-sinred px-4 py-3 text-sm font-semibold text-sinred cursor-pointer">Excluir currículo</button>
                  <button type="button" onClick={sair} className="min-w-0 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Sair da conta</button>
                </div>
              </div>

              <section className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input name="telefone" defaultValue={perfil.telefone} className={inputClasses} placeholder="Telefone" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cidade / Estado</label>
                  <LocalidadePerfil key={perfil.id} uf={perfil.uf ?? 'MG'} cidade={perfil.regiao} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cargo pretendido</label>
                  <input name="cargoPretendido" defaultValue={perfil.cargoPretendido ?? ''} className={inputClasses} placeholder="Ex: Operador de Máquina, Mecânico, etc." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Área pretendida</label>
                  <select name="areaPretendida" defaultValue={perfil.areaPretendida ?? 'producao'} className={inputClasses}>
                    {areaPretendidaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pretensão salarial</label>
                  <select name="pretensaoSalarial" defaultValue={perfil.pretensaoSalarial ?? 'a_combinar'} className={inputClasses}>
                    {pretensaoSalarialOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Anos de experiência</label>
                  <select name="anosExperienciaTotal" defaultValue={perfil.anosExperienciaTotal ?? 'sem_experiencia'} className={inputClasses}>
                    {anosExperienciaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria CNH</label>
                  <input name="categoriaCnh" defaultValue={perfil.categoriaCnh ?? ''} className={inputClasses} placeholder="Ex: B, AB, D" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cursos e certificações (separados por vírgula)</label>
                  <input name="cursosCertificacoes" defaultValue={perfil.cursosCertificacoes?.join(', ') ?? ''} className={inputClasses} placeholder="Cursos e certificações" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Idiomas (separados por vírgula)</label>
                  <input name="idiomas" defaultValue={perfil.idiomas?.join(', ') ?? ''} className={inputClasses} placeholder="Ex: Inglês Básico, Espanhol" />
                </div>
              </section>

              <section className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                <span className="sm:col-span-2 text-xs font-bold text-slate-700">Turnos de trabalho disponíveis:</span>
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
                  ['experienciaSetorPapel', 'Tenho experiência no setor de papel, papelão ou embalagens', !!perfil.experienciaSetorPapel],
                  ['interesseJovemAprendiz', 'Tenho interesse em vaga de Menor / Jovem Aprendiz', !!perfil.interesseJovemAprendiz],
                  ['inicioImediato', 'Tenho início imediato', !!perfil.inicioImediato],
                  ['disponibilidadeMudanca', 'Tenho disponibilidade para mudar de cidade', !!perfil.disponibilidadeMudanca],
                  ['pcd', 'Sou Pessoa com Deficiência (PCD)', !!perfil.pcd],
                ].map(([name, label, checked]) => (
                  <label key={String(name)} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm">
                    <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} className="h-5 w-5" />
                    {label}
                  </label>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Observação sobre deficiência (PCD):</label>
                  <input name="pcdObservacao" defaultValue={perfil.pcdObservacao ?? ''} className={inputClasses} placeholder="Ex: Baixa visão olho esquerdo, mobilidade reduzida, etc." />
                </div>
              </section>

              <button disabled={carregando} className="rounded-lg bg-brand-600 px-5 py-4 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60 cursor-pointer">
                {carregando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </form>
          </div>
        )}

        {erro && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
        {mensagem && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</p>}

        {/* Modal para Candidatar-se e Enviar Apresentação à Empresa */}
        {montado && vagaSelecionadaParaCandidatar && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs overflow-y-auto"
            onClick={() => setVagaSelecionadaParaCandidatar(null)}
          >
            <div
              className="relative my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-800 border border-brand-200">
                    {rotuloArea(vagaSelecionadaParaCandidatar.area)}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">
                    Apresentação para {vagaSelecionadaParaCandidatar.empresaNome}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVagaSelecionadaParaCandidatar(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <p className="font-semibold text-slate-700">Requisitos da vaga:</p>
                <p className="mt-1 whitespace-pre-line line-clamp-3">{vagaSelecionadaParaCandidatar.requisitos}</p>
              </div>

              <form onSubmit={candidatarVaga} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sua mensagem de apresentação para a empresa:
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Apresente seu interesse, suas experiências principais e sua disponibilidade. A empresa receberá esta mensagem juntamente com o seu currículo completo do SINPAPEL.
                  </p>
                  <textarea
                    rows={5}
                    required
                    value={mensagemApresentacao}
                    onChange={(e) => setMensagemApresentacao(e.target.value)}
                    className={`${inputClasses} leading-relaxed`}
                    placeholder="Escreva sua mensagem de apresentação..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setVagaSelecionadaParaCandidatar(null)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoCandidatura || !mensagemApresentacao.trim()}
                    className="rounded-lg bg-singreen px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                  >
                    {enviandoCandidatura ? 'Enviando...' : 'Enviar apresentação para a empresa'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal Lightbox para Ampliar Banner da Vaga */}
        {montado && modalImagemVaga && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs overflow-y-auto"
            onClick={() => setModalImagemVaga(null)}
          >
            <div
              className="relative my-auto max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-4 shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-950">Banner / Imagem da Oportunidade</span>
                <button
                  type="button"
                  onClick={() => setModalImagemVaga(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              </div>
              <img src={modalImagemVaga} alt="Banner ampliado da vaga" className="mt-3 max-h-[75vh] w-full rounded-lg object-contain" />
            </div>
          </div>,
          document.body
        )}
      </div>
    </main>
  );
}
