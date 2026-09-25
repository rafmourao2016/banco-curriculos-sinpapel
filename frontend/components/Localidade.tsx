'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
// Municipalities grouped by UF from the IBGE localidades API.
import estados from '../lib/localidades-br.json';
import { microrregioesMg } from '../lib/localidades-mg';

type Props = {
  uf?: string;
  cidade?: string;
  onChange?: (uf: string, cidade: string) => void;
  className: string;
  filtro?: boolean;
};

export function Localidade({ uf, cidade, onChange, className, filtro = false }: Props) {
  // Single-select mode for candidate registration (/cadastro)
  const [singleUf, setSingleUf] = useState(uf ?? 'MG');
  const [singleCidade, setSingleCidade] = useState(cidade ?? '');

  // Multi-select mode for filters (/empresa and /admin)
  const [selectedUfs, setSelectedUfs] = useState<string[]>(uf ? uf.split(',').map((s) => s.trim()).filter(Boolean) : []);
  const [selectedCidades, setSelectedCidades] = useState<string[]>(cidade ? cidade.split(',').map((s) => s.trim()).filter(Boolean) : []);
  const [selectedMicros, setSelectedMicros] = useState<string[]>([]);

  const [openDropdown, setOpenDropdown] = useState<'uf' | 'cidade' | 'micro' | null>(null);
  const [searchUf, setSearchUf] = useState('');
  const [searchCidade, setSearchCidade] = useState('');
  const [searchMicro, setSearchMicro] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available cities based on selected UFs
  const availableCidades = useMemo(() => {
    if (selectedUfs.length === 0) {
      // If no UF is selected, offer all cities (with MG cities prioritized)
      const all: string[] = [];
      const mgItem = estados.find((e) => e.uf === 'MG');
      if (mgItem) all.push(...mgItem.cidades);
      estados.forEach((e) => {
        if (e.uf !== 'MG') all.push(...e.cidades);
      });
      return all;
    }
    const result: string[] = [];
    selectedUfs.forEach((ufCode) => {
      const match = estados.find((e) => e.uf.toUpperCase() === ufCode.toUpperCase());
      if (match) result.push(...match.cidades);
    });
    return result;
  }, [selectedUfs]);

  // Filtered lists for search inside dropdowns
  const filteredEstados = useMemo(() => {
    const q = searchUf.trim().toLowerCase();
    if (!q) return estados;
    return estados.filter((e) => e.uf.toLowerCase().includes(q) || e.nome.toLowerCase().includes(q));
  }, [searchUf]);

  const filteredCidades = useMemo(() => {
    const q = searchCidade.trim().toLowerCase();
    if (!q) return availableCidades.slice(0, 100);
    return availableCidades.filter((c) => c.toLowerCase().includes(q)).slice(0, 100);
  }, [availableCidades, searchCidade]);

  const filteredMicros = useMemo(() => {
    const q = searchMicro.trim().toLowerCase();
    if (!q) return microrregioesMg;
    return microrregioesMg.filter((m) => m.nome.toLowerCase().includes(q));
  }, [searchMicro]);

  // Aggregate cities from selected microrregiões
  const aggregatedMicroCities = useMemo(() => {
    const list: string[] = [];
    selectedMicros.forEach((microNome) => {
      const found = microrregioesMg.find((m) => m.nome === microNome);
      if (found) list.push(...found.cidades);
    });
    return Array.from(new Set(list));
  }, [selectedMicros]);

  // When in single-select mode (registration)
  if (!filtro) {
    const cidadesSingle = estados.find((item) => item.uf === singleUf)?.cidades ?? [];
    return (
      <>
        <label className="block min-w-0 text-sm text-slate-700">
          <span className="mb-1 block font-medium">UF</span>
          <select
            name="uf"
            aria-label="UF"
            value={singleUf}
            className={className}
            autoComplete="address-level1"
            onChange={(event) => {
              const proxUf = event.target.value;
              setSingleUf(proxUf);
              setSingleCidade('');
              onChange?.(proxUf, '');
            }}
          >
            <option value="">Selecione a UF</option>
            {estados.map((item) => (
              <option key={item.uf} value={item.uf}>
                {item.uf} - {item.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-sm text-slate-700">
          <span className="mb-1 block font-medium">Cidade</span>
          <select
            name="regiao"
            aria-label="Cidade"
            value={singleCidade}
            disabled={!singleUf}
            className={className}
            autoComplete="address-level2"
            onChange={(event) => {
              const proxCid = event.target.value;
              setSingleCidade(proxCid);
              onChange?.(singleUf, proxCid);
            }}
          >
            <option value="">{!singleUf ? 'Selecione a UF primeiro' : 'Selecione a cidade'}</option>
            {singleCidade && !cidadesSingle.includes(singleCidade) && <option value={singleCidade}>{singleCidade}</option>}
            {cidadesSingle.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </>
    );
  }

  // Multi-select mode for filters
  const toggleUf = (ufCode: string) => {
    setSelectedUfs((prev) => {
      const exists = prev.includes(ufCode);
      const next = exists ? prev.filter((u) => u !== ufCode) : [...prev, ufCode];
      onChange?.(next.join(','), selectedCidades.join(','));
      return next;
    });
  };

  const toggleCidade = (cid: string) => {
    setSelectedCidades((prev) => {
      const exists = prev.includes(cid);
      const next = exists ? prev.filter((c) => c !== cid) : [...prev, cid];
      onChange?.(selectedUfs.join(','), next.join(','));
      return next;
    });
  };

  const toggleMicro = (microNome: string) => {
    setSelectedMicros((prev) => {
      const exists = prev.includes(microNome);
      const next = exists ? prev.filter((m) => m !== microNome) : [...prev, microNome];
      // Automatically add MG to selected UFs if a micro is chosen
      if (!exists && !selectedUfs.includes('MG')) {
        setSelectedUfs((u) => [...u, 'MG']);
      }
      return next;
    });
  };

  // Combine direct city selections with microrregião cities
  const allFinalCities = Array.from(new Set([...selectedCidades, ...aggregatedMicroCities]));

  return (
    <div ref={containerRef} className="col-span-full grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {/* Hidden inputs for natural HTML form submission */}
      <input type="hidden" name="uf" value={selectedUfs.join(',')} />
      <input type="hidden" name="regiao" value={selectedCidades.join(',')} />
      <input type="hidden" name="cidades" value={allFinalCities.join(',')} />

      {/* 1. Multi-Select Estados (UFs) */}
      <div className="relative">
        <label className="block min-w-0 text-xs font-semibold text-slate-700 mb-1">
          Estados (UFs) {selectedUfs.length > 0 && <span className="text-brand-700">({selectedUfs.length} selecionados)</span>}
        </label>
        <button
          type="button"
          onClick={() => setOpenDropdown((cur) => (cur === 'uf' ? null : 'uf'))}
          className={`${className} flex items-center justify-between text-left truncate cursor-pointer`}
        >
          <span className="truncate">
            {selectedUfs.length === 0
              ? 'Todas as UFs'
              : selectedUfs.length <= 3
              ? selectedUfs.join(', ')
              : `${selectedUfs.length} UFs selecionadas`}
          </span>
          <span className="ml-2 text-xs text-slate-400">▼</span>
        </button>

        {openDropdown === 'uf' && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <input
                type="text"
                placeholder="Buscar estado..."
                value={searchUf}
                onChange={(e) => setSearchUf(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-brand-600"
              />
              {selectedUfs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedUfs([])}
                  className="ml-2 shrink-0 text-xs font-semibold text-red-600 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="mt-1 max-h-52 overflow-y-auto space-y-1">
              {filteredEstados.map((item) => {
                const checked = selectedUfs.includes(item.uf);
                return (
                  <label
                    key={item.uf}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer transition ${
                      checked ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUf(item.uf)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      <strong>{item.uf}</strong> - {item.nome}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Multi-Select Cidades */}
      <div className="relative">
        <label className="block min-w-0 text-xs font-semibold text-slate-700 mb-1">
          Cidades {selectedCidades.length > 0 && <span className="text-brand-700">({selectedCidades.length} selecionadas)</span>}
        </label>
        <button
          type="button"
          onClick={() => setOpenDropdown((cur) => (cur === 'cidade' ? null : 'cidade'))}
          className={`${className} flex items-center justify-between text-left truncate cursor-pointer`}
        >
          <span className="truncate">
            {selectedCidades.length === 0
              ? selectedUfs.length > 0
                ? `Todas as cidades (${selectedUfs.join(', ')})`
                : 'Todas as cidades'
              : selectedCidades.length <= 2
              ? selectedCidades.join(', ')
              : `${selectedCidades.length} cidades selecionadas`}
          </span>
          <span className="ml-2 text-xs text-slate-400">▼</span>
        </button>

        {openDropdown === 'cidade' && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[260px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <input
                type="text"
                placeholder="Buscar cidade..."
                value={searchCidade}
                onChange={(e) => setSearchCidade(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-brand-600"
              />
              {selectedCidades.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCidades([])}
                  className="ml-2 shrink-0 text-xs font-semibold text-red-600 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="mt-1 max-h-52 overflow-y-auto space-y-1">
              {filteredCidades.map((cid) => {
                const checked = selectedCidades.includes(cid);
                return (
                  <label
                    key={cid}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer transition ${
                      checked ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCidade(cid)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="truncate">{cid}</span>
                  </label>
                );
              })}
              {filteredCidades.length === 0 && (
                <p className="p-2 text-center text-xs text-slate-400">Nenhuma cidade encontrada.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Multi-Select Microrregiões (MG) */}
      <div className="relative">
        <label className="block min-w-0 text-xs font-semibold text-slate-700 mb-1">
          Microrregiões (MG) {selectedMicros.length > 0 && <span className="text-brand-700">({selectedMicros.length} selecionadas)</span>}
        </label>
        <button
          type="button"
          onClick={() => setOpenDropdown((cur) => (cur === 'micro' ? null : 'micro'))}
          className={`${className} flex items-center justify-between text-left truncate cursor-pointer`}
        >
          <span className="truncate">
            {selectedMicros.length === 0
              ? 'Todas as microrregiões (MG)'
              : selectedMicros.length <= 2
              ? selectedMicros.join(', ')
              : `${selectedMicros.length} microrregiões`}
          </span>
          <span className="ml-2 text-xs text-slate-400">▼</span>
        </button>

        {openDropdown === 'micro' && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[280px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <input
                type="text"
                placeholder="Buscar microrregião..."
                value={searchMicro}
                onChange={(e) => setSearchMicro(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-brand-600"
              />
              {selectedMicros.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMicros([])}
                  className="ml-2 shrink-0 text-xs font-semibold text-red-600 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="mt-1 max-h-52 overflow-y-auto space-y-1">
              {filteredMicros.map((item) => {
                const checked = selectedMicros.includes(item.nome);
                return (
                  <label
                    key={item.nome}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-medium cursor-pointer transition ${
                      checked ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMicro(item.nome)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="truncate">{item.nome}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                      {item.cidades.length} cidades
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Tag Badges */}
      {(selectedUfs.length > 0 || selectedCidades.length > 0 || selectedMicros.length > 0) && (
        <div className="col-span-full flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Filtros de Local:</span>
          {selectedUfs.map((ufCode) => (
            <span
              key={`badge-uf-${ufCode}`}
              className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800 border border-brand-200/60"
            >
              UF: {ufCode}
              <button
                type="button"
                onClick={() => toggleUf(ufCode)}
                className="hover:text-red-700 font-bold ml-0.5"
                title="Remover estado"
              >
                ✕
              </button>
            </span>
          ))}

          {selectedCidades.map((cid) => (
            <span
              key={`badge-cid-${cid}`}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/60"
            >
              Cidade: {cid}
              <button
                type="button"
                onClick={() => toggleCidade(cid)}
                className="hover:text-red-700 font-bold ml-0.5"
                title="Remover cidade"
              >
                ✕
              </button>
            </span>
          ))}

          {selectedMicros.map((microNome) => (
            <span
              key={`badge-micro-${microNome}`}
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200/60"
            >
              Micro: {microNome}
              <button
                type="button"
                onClick={() => toggleMicro(microNome)}
                className="hover:text-red-700 font-bold ml-0.5"
                title="Remover microrregião"
              >
                ✕
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => {
              setSelectedUfs([]);
              setSelectedCidades([]);
              setSelectedMicros([]);
              onChange?.('', '');
            }}
            className="text-xs text-slate-500 hover:text-red-600 underline underline-offset-2 ml-1"
          >
            Limpar todos os locais
          </button>
        </div>
      )}
    </div>
  );
}
