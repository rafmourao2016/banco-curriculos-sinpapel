'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  anosExperienciaOptions,
  areaPretendidaOptions,
  cadastroSchema,
  CadastroFormValues,
  escolaridadeOptions,
  formacaoNivelOptions,
  formacaoStatusOptions,
  pretensaoSalarialOptions,
  turnoOptions,
} from '../../lib/cadastroSchema';
import { cadastrarCandidato } from '../../lib/api';
import { apenasDigitos } from '../../lib/documentos';
import { Campo } from '../../components/Campo';

const inputClasses =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15';

const experienciaVazia = {
  empresa: '',
  cargo: '',
  area: '',
  dataInicio: '',
  dataFim: '',
  descricao: '',
};

const formacaoVazia = {
  curso: '',
  nivel: 'medio' as const,
  instituicao: '',
  status: 'cursando' as const,
  ano: new Date().getFullYear(),
};

export default function CadastroPage() {
  const [enviado, setEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [statusCep, setStatusCep] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      possuiCnh: false,
      experienciaSetorPapel: false,
      turnos: [],
      cep: '',
      logradouro: '',
      bairro: '',
      numeroEndereco: '',
      complementoEndereco: '',
      inicioImediato: false,
      disponibilidadeMudanca: false,
      pcd: false,
      experiencias: [experienciaVazia],
      formacoes: [],
    },
  });

  const { fields: experiencias, append: adicionarExperiencia, remove: removerExperiencia } = useFieldArray({
    control,
    name: 'experiencias',
  });
  const { fields: formacoes, append: adicionarFormacao, remove: removerFormacao } = useFieldArray({
    control,
    name: 'formacoes',
  });

  async function onSubmit(dados: CadastroFormValues) {
    setErroEnvio(null);
    try {
      await cadastrarCandidato(dados);
      setEnviado(true);
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.');
    }
  }

  async function buscarCep(valor: string) {
    const cep = apenasDigitos(valor);
    setStatusCep(null);
    if (!cep) return;
    if (cep.length !== 8) {
      setStatusCep('Informe um CEP com 8 dígitos.');
      return;
    }

    setStatusCep('Buscando CEP...');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await res.json();
      if (!res.ok || dados.erro) {
        setStatusCep('CEP não encontrado. Preencha cidade e UF manualmente.');
        return;
      }

      if (dados.localidade) {
        setValue('regiao', dados.localidade, { shouldValidate: true, shouldDirty: true });
      }
      if (dados.uf) {
        setValue('uf', dados.uf, { shouldValidate: true, shouldDirty: true });
      }
      if (dados.logradouro) {
        setValue('logradouro', dados.logradouro, { shouldValidate: true, shouldDirty: true });
      }
      if (dados.bairro) {
        setValue('bairro', dados.bairro, { shouldValidate: true, shouldDirty: true });
      }
      setStatusCep('Endereço preenchido pelo CEP. Complete o número.');
    } catch {
      setStatusCep('Não foi possível buscar o CEP agora. Preencha cidade e UF manualmente.');
    }
  }

  if (enviado) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-slate-200/70">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Cadastro recebido</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Seu curriculo ja esta no banco do SINPAPEL.</h1>
          <p className="mt-4 text-slate-600">
            Empresas associadas poderao encontrar seu perfil conforme as vagas e necessidades cadastradas.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800">
              Voltar ao inicio
            </Link>
            <Link href="/cadastro" className="inline-flex justify-center rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white">
              Fazer outro cadastro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-50 px-5 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="logo-spotlight mx-auto mb-6">
          <img
            src="/logo-sinpapel.png"
            alt="SINPAPEL - Sindicato das Industrias de Celulose, Papel e Papelao no Estado de Minas Gerais"
            className="relative z-10 h-auto w-64 max-w-full sm:w-80"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-600 hover:text-brand-700"
          >
            Voltar ao inicio
          </Link>
          <Link href="/" className="hidden text-sm font-semibold text-brand-700 sm:inline">
            Banco de Curriculos do SINPAPEL
          </Link>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Link
              href="/candidato"
              className="inline-flex justify-center rounded-lg border border-brand-600 bg-white px-3 py-2 text-center text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              Ja tenho cadastro
            </Link>
            <Link
              href="/admin"
              className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-600 hover:text-brand-700"
            >
              Entrar como admin
            </Link>
          </div>
        </div>

        <header className="mt-8 rounded-3xl bg-brand-700 p-5 text-white shadow-2xl shadow-slate-300/60 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">Cadastro gratuito</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
            Cadastre seu curriculo para ser encontrado por empresas associadas.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Preencha seus dados profissionais em poucos minutos. Nao e necessario anexar arquivos.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid gap-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:p-8">
          <section className="grid gap-5 sm:grid-cols-2">
            <Campo id="nome" label="Nome completo" erro={errors.nome?.message}>
              <input id="nome" className={inputClasses} autoComplete="name" {...register('nome')} />
            </Campo>

            <Campo id="cpf" label="CPF" erro={errors.cpf?.message}>
              <input id="cpf" inputMode="numeric" className={inputClasses} placeholder="000.000.000-00" {...register('cpf')} />
            </Campo>

            <Campo id="email" label="E-mail" erro={errors.email?.message}>
              <input id="email" type="email" autoComplete="email" className={inputClasses} {...register('email')} />
            </Campo>

            <Campo id="telefone" label="Telefone (WhatsApp)" erro={errors.telefone?.message}>
              <input id="telefone" inputMode="tel" className={inputClasses} placeholder="(00) 00000-0000" {...register('telefone')} />
            </Campo>

            <Campo id="dataNascimento" label="Data de nascimento" erro={errors.dataNascimento?.message}>
              <input id="dataNascimento" type="date" className={inputClasses} {...register('dataNascimento')} />
            </Campo>

            <Campo id="cep" label="CEP" erro={errors.cep?.message}>
              <>
                <input
                  id="cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={inputClasses}
                  placeholder="00000-000"
                  {...register('cep')}
                  onBlur={(event) => buscarCep(event.target.value)}
                />
                {statusCep && <p className="mt-1 text-sm text-slate-600">{statusCep}</p>}
              </>
            </Campo>

            <Campo id="logradouro" label="Rua / logradouro" erro={errors.logradouro?.message}>
              <input id="logradouro" autoComplete="address-line1" className={inputClasses} placeholder="Rua, avenida, travessa..." {...register('logradouro')} />
            </Campo>

            <Campo id="numeroEndereco" label="Número" erro={errors.numeroEndereco?.message}>
              <input id="numeroEndereco" inputMode="numeric" autoComplete="address-line2" className={inputClasses} placeholder="Ex.: 123" {...register('numeroEndereco')} />
            </Campo>

            <Campo id="bairro" label="Bairro" erro={errors.bairro?.message}>
              <input id="bairro" className={inputClasses} placeholder="Bairro" {...register('bairro')} />
            </Campo>

            <Campo id="complementoEndereco" label="Complemento (opcional)" erro={errors.complementoEndereco?.message}>
              <input id="complementoEndereco" autoComplete="address-line3" className={inputClasses} placeholder="Apto, bloco, referência..." {...register('complementoEndereco')} />
            </Campo>

            <Campo id="regiao" label="Cidade / regiao" erro={errors.regiao?.message}>
              <input id="regiao" autoComplete="address-level2" className={inputClasses} {...register('regiao')} />
            </Campo>

            <Campo id="uf" label="UF" erro={errors.uf?.message}>
              <input id="uf" autoComplete="address-level1" className={inputClasses} maxLength={2} placeholder="MG" {...register('uf')} />
            </Campo>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <Campo id="escolaridade" label="Escolaridade" erro={errors.escolaridade?.message}>
              <select id="escolaridade" className={inputClasses} {...register('escolaridade')}>
                {escolaridadeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="possuiCnh" label="Possui CNH?" erro={errors.possuiCnh?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="possuiCnh" type="checkbox" className="h-5 w-5" {...register('possuiCnh')} />
                <label htmlFor="possuiCnh" className="text-sm text-slate-700">
                  Sim, possuo Carteira Nacional de Habilitacao
                </label>
              </div>
            </Campo>

            <Campo id="categoriaCnh" label="Categoria da CNH (opcional)" erro={errors.categoriaCnh?.message}>
              <input id="categoriaCnh" className={inputClasses} placeholder="Ex.: B, C, D" {...register('categoriaCnh')} />
            </Campo>
          </section>

          <section className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Campo id="areaPretendida" label="Area pretendida" erro={errors.areaPretendida?.message}>
              <select id="areaPretendida" className={inputClasses} {...register('areaPretendida')}>
                {areaPretendidaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="cargoPretendido" label="Cargo pretendido" erro={errors.cargoPretendido?.message}>
              <input id="cargoPretendido" className={inputClasses} placeholder="Ex.: Auxiliar de producao" {...register('cargoPretendido')} />
            </Campo>

            <Campo id="pretensaoSalarial" label="Pretensao salarial" erro={errors.pretensaoSalarial?.message}>
              <select id="pretensaoSalarial" className={inputClasses} {...register('pretensaoSalarial')}>
                {pretensaoSalarialOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="anosExperienciaTotal" label="Experiencia total" erro={errors.anosExperienciaTotal?.message}>
              <select id="anosExperienciaTotal" className={inputClasses} {...register('anosExperienciaTotal')}>
                {anosExperienciaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="experienciaSetorPapel" label="Ja trabalhou no setor papel/embalagem?" erro={errors.experienciaSetorPapel?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="experienciaSetorPapel" type="checkbox" className="h-5 w-5" {...register('experienciaSetorPapel')} />
                <label htmlFor="experienciaSetorPapel" className="text-sm text-slate-700">
                  Sim, ja trabalhei no setor
                </label>
              </div>
            </Campo>

            <Campo id="inicioImediato" label="Inicio imediato?" erro={errors.inicioImediato?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="inicioImediato" type="checkbox" className="h-5 w-5" {...register('inicioImediato')} />
                <label htmlFor="inicioImediato" className="text-sm text-slate-700">
                  Tenho disponibilidade imediata
                </label>
              </div>
            </Campo>
          </section>

          <section className="grid gap-5 border-t border-slate-200 pt-5">
            <Campo id="turnos" label="Turnos disponiveis" erro={errors.turnos?.message}>
              <div className="grid gap-3 rounded-xl border border-slate-300 p-4 sm:grid-cols-2">
                {turnoOptions.map((turno) => (
                  <label key={turno.value} className="flex items-center gap-3 text-sm text-slate-700">
                    <input type="checkbox" value={turno.value} className="h-5 w-5" {...register('turnos')} />
                    {turno.label}
                  </label>
                ))}
              </div>
            </Campo>

            <Campo id="disponibilidadeMudanca" label="Mudanca de cidade" erro={errors.disponibilidadeMudanca?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="disponibilidadeMudanca" type="checkbox" className="h-5 w-5" {...register('disponibilidadeMudanca')} />
                <label htmlFor="disponibilidadeMudanca" className="text-sm text-slate-700">
                  Tenho disponibilidade para mudanca de cidade
                </label>
              </div>
            </Campo>
          </section>

          <section className="grid gap-4 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Formacao</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Se tiver cursos ou formacoes, adicione aqui. Voce pode incluir ate 10 registros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => adicionarFormacao({ ...formacaoVazia })}
                disabled={formacoes.length >= 10}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                + Adicionar formacao
              </button>
            </div>

            {errors.formacoes?.message && (
              <p role="alert" className="text-sm text-red-600">{errors.formacoes.message}</p>
            )}

            {formacoes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
                Nenhuma formacao adicionada. Este campo e opcional.
              </div>
            )}

            {formacoes.map((formacao, index) => (
              <div key={formacao.id} className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 sm:col-span-2">
                  <h3 className="font-semibold text-brand-700">Formacao {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removerFormacao(index)}
                    className="rounded-lg border border-sinred px-3 py-2 text-xs font-semibold text-sinred"
                  >
                    Remover
                  </button>
                </div>

                <Campo id={`formacoes.${index}.curso`} label="Curso / formacao" erro={errors.formacoes?.[index]?.curso?.message}>
                  <input id={`formacoes.${index}.curso`} className={inputClasses} placeholder="Ex.: Ensino medio, Tecnico em mecanica" {...register(`formacoes.${index}.curso`)} />
                </Campo>

                <Campo id={`formacoes.${index}.nivel`} label="Nivel do curso" erro={errors.formacoes?.[index]?.nivel?.message}>
                  <select id={`formacoes.${index}.nivel`} className={inputClasses} {...register(`formacoes.${index}.nivel`)}>
                    {formacaoNivelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo id={`formacoes.${index}.instituicao`} label="Instituicao" erro={errors.formacoes?.[index]?.instituicao?.message}>
                  <input id={`formacoes.${index}.instituicao`} className={inputClasses} {...register(`formacoes.${index}.instituicao`)} />
                </Campo>

                <Campo id={`formacoes.${index}.status`} label="Situacao da formacao" erro={errors.formacoes?.[index]?.status?.message}>
                  <select id={`formacoes.${index}.status`} className={inputClasses} {...register(`formacoes.${index}.status`)}>
                    {formacaoStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo id={`formacoes.${index}.ano`} label="Ano" erro={errors.formacoes?.[index]?.ano?.message}>
                  <input id={`formacoes.${index}.ano`} type="number" className={inputClasses} placeholder="2026" {...register(`formacoes.${index}.ano`)} />
                </Campo>
              </div>
            ))}
          </section>

          <section className="grid gap-4 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Cargos e experiencias</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Informe o cargo atual ou os ultimos cargos relevantes. Voce pode adicionar ate 5 registros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => adicionarExperiencia({ ...experienciaVazia })}
                disabled={experiencias.length >= 5}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                + Adicionar novo cargo
              </button>
            </div>

            {errors.experiencias?.message && (
              <p role="alert" className="text-sm text-red-600">{errors.experiencias.message}</p>
            )}

            {experiencias.map((experiencia, index) => (
              <div key={experiencia.id} className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 sm:col-span-2">
                  <h3 className="font-semibold text-brand-700">Cargo {index + 1}</h3>
                  {experiencias.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerExperiencia(index)}
                      className="rounded-lg border border-sinred px-3 py-2 text-xs font-semibold text-sinred"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <Campo id={`experiencias.${index}.empresa`} label="Empresa (opcional)" erro={errors.experiencias?.[index]?.empresa?.message}>
                  <input id={`experiencias.${index}.empresa`} className={inputClasses} {...register(`experiencias.${index}.empresa`)} />
                </Campo>

                <Campo id={`experiencias.${index}.cargo`} label={index === 0 ? 'Cargo atual / ultimo cargo' : 'Cargo'} erro={errors.experiencias?.[index]?.cargo?.message}>
                  <input id={`experiencias.${index}.cargo`} className={inputClasses} placeholder="Ex.: Trainee industrial" {...register(`experiencias.${index}.cargo`)} />
                </Campo>

                <Campo id={`experiencias.${index}.area`} label="Area de atuacao" erro={errors.experiencias?.[index]?.area?.message}>
                  <input id={`experiencias.${index}.area`} className={inputClasses} placeholder="Ex.: Producao, manutencao, administrativo" {...register(`experiencias.${index}.area`)} />
                </Campo>

                <Campo id={`experiencias.${index}.dataInicio`} label="Inicio no cargo" erro={errors.experiencias?.[index]?.dataInicio?.message}>
                  <input id={`experiencias.${index}.dataInicio`} type="date" className={inputClasses} {...register(`experiencias.${index}.dataInicio`)} />
                </Campo>

                <Campo id={`experiencias.${index}.dataFim`} label="Fim no cargo (opcional)" erro={errors.experiencias?.[index]?.dataFim?.message}>
                  <input id={`experiencias.${index}.dataFim`} type="date" className={inputClasses} {...register(`experiencias.${index}.dataFim`)} />
                </Campo>

                <Campo id={`experiencias.${index}.descricao`} label="Resumo da experiencia (opcional)" erro={errors.experiencias?.[index]?.descricao?.message}>
                  <textarea
                    id={`experiencias.${index}.descricao`}
                    className={`${inputClasses} min-h-28 resize-y`}
                    placeholder="Descreva atividades em ate 300 caracteres"
                    {...register(`experiencias.${index}.descricao`)}
                  />
                </Campo>
              </div>
            ))}
          </section>

          <section className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Campo id="idiomas" label="Idiomas" erro={errors.idiomas?.message}>
              <input id="idiomas" className={inputClasses} placeholder="Ex.: ingles basico, espanhol" {...register('idiomas')} />
            </Campo>

            <Campo id="pcd" label="PCD? (opcional)" erro={errors.pcd?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="pcd" type="checkbox" className="h-5 w-5" {...register('pcd')} />
                <label htmlFor="pcd" className="text-sm text-slate-700">
                  Sim
                </label>
              </div>
            </Campo>

            <Campo id="pcdObservacao" label="Observacao PCD (opcional)" erro={errors.pcdObservacao?.message}>
              <input id="pcdObservacao" className={inputClasses} {...register('pcdObservacao')} />
            </Campo>
          </section>

          <Campo id="habilidades" label="Principais habilidades" erro={errors.habilidades?.message}>
            <input
              id="habilidades"
              className={inputClasses}
              placeholder="Ex.: atendimento, logistica, manutencao, Excel"
              {...register('habilidades')}
            />
          </Campo>

          <Campo id="senha" label="Crie uma senha" erro={errors.senha?.message}>
            <input id="senha" type="password" autoComplete="new-password" className={inputClasses} {...register('senha')} />
          </Campo>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <input id="aceiteTermoLgpd" type="checkbox" className="mt-1 h-5 w-5" {...register('aceiteTermoLgpd')} />
              <label htmlFor="aceiteTermoLgpd" className="text-sm leading-6 text-slate-700">
                Li e aceito o{' '}
                <Link href="/termos-lgpd" className="font-semibold text-brand-700 underline">
                  termo de consentimento para tratamento de dados (LGPD)
                </Link>
                .
              </label>
            </div>
            {errors.aceiteTermoLgpd && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {errors.aceiteTermoLgpd.message}
              </p>
            )}
          </div>

          {erroEnvio && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {erroEnvio}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-600 px-5 py-4 text-base font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : 'Cadastrar meu curriculo'}
          </button>
        </form>
      </div>
    </main>
  );
}
