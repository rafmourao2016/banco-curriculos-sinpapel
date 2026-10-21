'use client';

import React, { useState, useRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { JobVideoComposition, JobVideoProps } from './JobVideoComposition';

type VagaInfo = {
  id: string;
  area: string;
  requisitos: string;
  imagemUrl?: string | null;
};

type Props = {
  vaga: VagaInfo | null;
  empresaNome?: string;
  aberto: boolean;
  aoFechar: () => void;
};

export const JobVideoModal: React.FC<Props> = ({ vaga, empresaNome = 'Empresa Associada SINPAPEL', aberto, aoFechar }) => {
  const [formato, setFormato] = useState<'stories' | 'feed'>('stories');
  const [tituloCustomizado, setTituloCustomizado] = useState('');
  const [cidade, setCidade] = useState('Minas Gerais');
  const [modalidade, setModalidade] = useState('Presencial • CLT');
  const [salario, setSalario] = useState('A combinar');
  const [exibirEmpresa, setExibirEmpresa] = useState(true);
  const [beneficiosTexto, setBeneficiosTexto] = useState(
    'Plano de Saúde\nTransporte Fretado / VT\nRefeição no Local\nOportunidade de Crescimento'
  );
  const [copiado, setCopiado] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  if (!aberto || !vaga) return null;

  const tituloFinal = tituloCustomizado.trim() || vaga.area || 'Oportunidade de Trabalho';
  const beneficiosLista = beneficiosTexto
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean);

  const videoProps: JobVideoProps = {
    titulo: tituloFinal,
    empresaNome: exibirEmpresa ? empresaNome : 'Empresa do Setor',
    cidade,
    modalidade,
    setor: 'Papel, Papelão e Embalagens',
    beneficios: beneficiosLista,
    salario,
    qrCodeUrl: '/qr-cadastro-sinpapel.svg',
    bannerUrl: vaga.imagemUrl,
    formato,
    exibirEmpresa,
  };

  const isStories = formato === 'stories';
  const compWidth = 1080;
  const compHeight = isStories ? 1920 : 1080;

  // Gerar mensagem formatada para WhatsApp
  const mensagemWhatsApp = `🌟 *VAGA ABERTA - SETOR DE PAPEL & CELULOSE*\n\n` +
    `📌 *Cargo:* ${tituloFinal}\n` +
    (exibirEmpresa ? `🏢 *Empresa:* ${empresaNome}\n` : '') +
    `📍 *Local:* ${cidade}\n` +
    `💼 *Modelo:* ${modalidade}\n` +
    (salario !== 'A combinar' ? `💰 *Salário:* ${salario}\n` : '') +
    `\n✨ *Destaques / Benefícios:*\n` +
    beneficiosLista.map((b) => ` • ${b}`).join('\n') +
    `\n\n📲 *Candidate-se gratuitamente pelo Banco de Talentos SINPAPEL:*\n` +
    `https://sinpapel.vercel.app/cadastro`;

  const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`;

  function copiarTextoWhatsApp() {
    navigator.clipboard.writeText(mensagemWhatsApp);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800 text-xl font-bold shadow-2xs">
              🎬
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Gerador de Vídeo Card para Redes & WhatsApp
              </h2>
              <p className="text-xs text-slate-600">
                Criado com animação programática Remotion • Ideal para Stories, WhatsApp Status e LinkedIn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal em 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto flex-1">
          {/* Coluna Esquerda: Player Remotion Interativo */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950/5 rounded-2xl p-4 border border-slate-200/80">
            {/* Seletor de Formato */}
            <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setFormato('stories')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  formato === 'stories'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>📱</span> Stories / WhatsApp (9:16)
              </button>
              <button
                type="button"
                onClick={() => setFormato('feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  formato === 'feed'
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>⏹️</span> Feed / Post (1:1)
              </button>
            </div>

            {/* Container do Player com Proporção Controlada */}
            <div
              className="w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 shadow-lg relative border border-slate-800"
              style={{
                aspectRatio: isStories ? '9 / 16' : '1 / 1',
                maxHeight: isStories ? '500px' : '440px',
              }}
            >
              <Player
                ref={playerRef}
                component={JobVideoComposition}
                durationInFrames={240}
                compositionWidth={compWidth}
                compositionHeight={compHeight}
                fps={30}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                controls
                autoPlay
                loop
                inputProps={videoProps}
              />
            </div>

            <p className="mt-3 text-[11px] text-slate-500 text-center">
              💡 Use a barra de controles do player para pausar, avançar frames ou assistir em tela cheia.
            </p>
          </div>

          {/* Coluna Direita: Personalização dos Dados & Ações */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-50/60 p-3.5 border border-brand-200 text-xs text-brand-950 flex items-start gap-2.5">
                <span className="text-base">✨</span>
                <div>
                  <strong>Personalize em tempo real:</strong> qualquer alteração nos campos abaixo atualiza instantaneamente o vídeo ao lado!
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título do Cargo / Vaga
                </label>
                <input
                  type="text"
                  value={tituloCustomizado}
                  onChange={(e) => setTituloCustomizado(e.target.value)}
                  placeholder={vaga.area}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cidade / Região
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modalidade / Contrato
                  </label>
                  <input
                    type="text"
                    value={modalidade}
                    onChange={(e) => setModalidade(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Faixa Salarial
                  </label>
                  <input
                    type="text"
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="exibirEmpresaCheck"
                    checked={exibirEmpresa}
                    onChange={(e) => setExibirEmpresa(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="exibirEmpresaCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Exibir nome da empresa
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Benefícios / Diferenciais (1 por linha, até 4 itens)
                </label>
                <textarea
                  rows={3}
                  value={beneficiosTexto}
                  onChange={(e) => setBeneficiosTexto(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                />
              </div>
            </div>

            {/* Ações de Compartilhamento e Download */}
            <div className="space-y-2.5 pt-4 border-t border-slate-200">
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
              >
                <span>💬</span> Compartilhar no WhatsApp
              </a>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={copiarTextoWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-2xs"
                >
                  {copiado ? '✅ Mensagem Copiada!' : '📋 Copiar Texto Formatado'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playerRef.current?.pause();
                    playerRef.current?.seekTo(190); // Pula para a cena de destaque com QR Code
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-2xs"
                  title="Pausar no frame do QR Code"
                >
                  <span>🎯</span> Ir ao QR Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50 text-xs text-slate-500">
          <span>Selo Institucional Oficial SINPAPEL & Sistema FIEMG</span>
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-lg px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
