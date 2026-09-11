'use client';

import { useState } from 'react';
// Municipalities grouped by UF from the IBGE localidades API (September 2026).
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
  const [local, setLocal] = useState({ uf: uf ?? (filtro ? '' : 'MG'), cidade: cidade ?? '' });
  const estado = uf ?? local.uf;
  const municipio = cidade ?? local.cidade;
  const [micro, setMicro] = useState('');
  const cidades = estados.find((item) => item.uf === estado)?.cidades ?? [];
  function alterar(proximaUf: string, proximaCidade: string) {
    setLocal({ uf: proximaUf, cidade: proximaCidade });
    setMicro('');
    onChange?.(proximaUf, proximaCidade);
  }
  return <>
    <label className="block min-w-0 text-sm text-slate-700">
      <span className="mb-1 block">UF</span>
      <select name="uf" aria-label="UF" value={estado} className={className} autoComplete={filtro ? 'off' : 'address-level1'}
        onChange={(event) => alterar(event.target.value, '')}>
        <option value="">{filtro ? 'Todas as UFs' : 'Selecione a UF'}</option>
        {estados.map((item) => <option key={item.uf} value={item.uf}>{item.uf} - {item.nome}</option>)}
      </select>
    </label>
    <label className="block min-w-0 text-sm text-slate-700">
      <span className="mb-1 block">Cidade</span>
      <select name="regiao" aria-label="Cidade" value={municipio} disabled={!estado} className={className}
        autoComplete={filtro ? 'off' : 'address-level2'} onChange={(event) => alterar(estado, event.target.value)}>
        <option value="">{!estado ? 'Selecione a UF primeiro' : filtro ? 'Todas as cidades' : 'Selecione a cidade'}</option>
        {municipio && !cidades.includes(municipio) && <option value={municipio}>{municipio}</option>}
        {cidades.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
      </select>
    </label>
    {filtro && <label className="block min-w-0 text-sm text-slate-700">
      <span className="mb-1 block">Microrregião (MG)</span>
      <select name="cidades" aria-label="Microrregião (MG)" value={micro} disabled={!!estado && estado !== 'MG'} className={className}
        onChange={(event) => {
          alterar('MG', '');
          setMicro(event.target.value);
        }}>
        <option value="">Todas as microrregiões</option>
        {microrregioesMg.map((item) => <option key={item.nome} value={item.cidades.join(',')}>{item.nome}</option>)}
      </select>
    </label>}
  </>;
}
