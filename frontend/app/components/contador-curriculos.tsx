'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type EstatisticasPublicas = {
  totalCadastrados: number;
  curriculosAtivos: number;
};

export function ContadorCurriculos() {
  const [estatisticas, setEstatisticas] = useState<EstatisticasPublicas | null>(null);

  useEffect(() => {
    let ativo = true;

    fetch(`${API_URL}/candidatos/estatisticas`)
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
  }, []);

  return (
    <div className="rounded-2xl border border-sinred/20 bg-white px-5 py-4 text-left shadow-sm sm:min-w-[190px] sm:text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-sinred">No banco</p>
      <p className="mt-1 text-3xl font-semibold text-slate-950">
        {estatisticas ? estatisticas.curriculosAtivos.toLocaleString('pt-BR') : '...'}
      </p>
      <p className="text-sm font-medium text-slate-600">currículos ativos</p>
    </div>
  );
}
