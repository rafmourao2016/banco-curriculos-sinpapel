'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type EstatisticasPublicas = {
  totalCadastrados: number;
  curriculosAtivos: number;
};

type ContadorCurriculosProps = {
  token: string;
};

export function ContadorCurriculos({ token }: ContadorCurriculosProps) {
  const [estatisticas, setEstatisticas] = useState<EstatisticasPublicas | null>(null);

  useEffect(() => {
    if (!token) return;
    let ativo = true;

    fetch(`${API_URL}/empresas/estatisticas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((dados) => {
        if (ativo && dados) setEstatisticas(dados);
      })
      .catch(() => {
        if (ativo) setEstatisticas(null);
      });

    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <div className="rounded-2xl border border-sinred/20 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sinred">Currículos cadastrados</p>
      <p className="mt-1 text-4xl font-semibold text-slate-950">
        {estatisticas ? estatisticas.curriculosAtivos.toLocaleString('pt-BR') : '...'}
      </p>
      <p className="text-sm font-medium text-slate-600">ativos e disponíveis para consulta</p>
    </div>
  );
}
