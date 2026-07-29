'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const inputClasses = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10';

function FormularioRecuperacao() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const tipo = params.get('tipo') === 'empresa' ? 'empresa' : 'candidato';
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function redefinir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    if (!token) return setErro('Link de recuperacao invalido.');
    if (senha.length < 8) return setErro('A senha deve ter no minimo 8 caracteres.');
    if (senha !== confirmacao) return setErro('A confirmacao da senha nao confere.');
    setCarregando(true);
    try {
      const res = await fetch(`${API_URL}/auth/redefinir-senha`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, tipo, senha }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? 'Nao foi possivel redefinir a senha.');
      setMensagem(data.mensagem ?? 'Senha alterada com sucesso.');
      setSenha('');
      setConfirmacao('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={redefinir} noValidate className="mt-6 grid gap-4">
      <input className={inputClasses} type="password" minLength={8} autoComplete="new-password" placeholder="Nova senha (minimo 8 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} />
      <input className={inputClasses} type="password" minLength={8} autoComplete="new-password" placeholder="Confirme a nova senha" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
      <button disabled={carregando || !token} className="rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{carregando ? 'Salvando...' : 'Criar nova senha'}</button>
      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
      {mensagem && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensagem}</p>}
    </form>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-slate-950 sm:px-6">
      <section className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <Link href="/" className="text-sm font-semibold text-brand-700 underline underline-offset-4">Voltar ao inicio</Link>
        <h1 className="mt-8 text-2xl font-semibold">Criar nova senha</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use uma senha com pelo menos 8 caracteres. O link de recuperacao vale por 1 hora e pode ser usado uma unica vez.</p>
        <Suspense fallback={<p className="mt-6 text-sm text-slate-600">Carregando...</p>}><FormularioRecuperacao /></Suspense>
      </section>
    </main>
  );
}
