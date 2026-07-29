'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  anosExperienciaOptions,
  areaPretendidaOptions,
  cadastroSchema,
  CadastroFormValues,
  escolaridadeOptions,
  formacaoStatusOptions,
  pretensaoSalarialOptions,
  turnoOptions,
} from '../../lib/cadastroSchema';
import { cadastrarCandidato } from '../../lib/api';
import { Campo } from '../../components/Campo';

const inputClasses =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15';

export default function CadastroPage() {
  const [enviado, setEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      possuiCnh: false,
      experienciaSetorPapel: false,
      turnos: [],
      inicioImediato: false,
      disponibilidadeMudanca: false,
      pcd: false,
    },
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

  if (enviado) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-slate-200/70">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Cadastro recebido</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Seu currículo já está no banco do SINPAPEL.</h1>
          <p className="mt-4 text-slate-600">
            Empresas associadas poderão encontrar seu perfil conforme as vagas e necessidades cadastradas.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800">
              Voltar ao início
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-brand-600 hover:text-brand-700"
          >
            Voltar ao início
          </Link>
          <Link href="/" className="hidden text-sm font-semibold text-brand-700 sm:inline">
            Banco de Currículos do SINPAPEL
          </Link>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Link
              href="/candidato"
              className="inline-flex justify-center rounded-lg border border-brand-600 bg-white px-3 py-2 text-center text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              Já tenho cadastro
            </Link>
            <Link
              href="/admin"
              className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-600 hover:text-brand-700"
            >
              Entrar como admin
            </Link>
          </div>
        </div>

        <header className="mt-8 rounded-3xl bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/60 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-200">Cadastro gratuito</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
            Cadastre seu currículo para ser encontrado por empresas associadas.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Preencha seus dados profissionais em poucos minutos. Não é necessário anexar arquivos.
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

            <Campo id="regiao" label="Cidade / região" erro={errors.regiao?.message}>
              <input id="regiao" className={inputClasses} {...register('regiao')} />
            </Campo>

            <Campo id="uf" label="UF" erro={errors.uf?.message}>
              <input id="uf" className={inputClasses} maxLength={2} placeholder="MG" {...register('uf')} />
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
                  Sim, possuo Carteira Nacional de Habilitação
                </label>
              </div>
            </Campo>

            <Campo id="categoriaCnh" label="Categoria da CNH (opcional)" erro={errors.categoriaCnh?.message}>
              <input id="categoriaCnh" className={inputClasses} placeholder="Ex.: B, C, D" {...register('categoriaCnh')} />
            </Campo>
          </section>

          <section className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Campo id="areaPretendida" label="Área pretendida" erro={errors.areaPretendida?.message}>
              <select id="areaPretendida" className={inputClasses} {...register('areaPretendida')}>
                {areaPretendidaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="cargoPretendido" label="Cargo pretendido" erro={errors.cargoPretendido?.message}>
              <input id="cargoPretendido" className={inputClasses} placeholder="Ex.: Auxiliar de produção" {...register('cargoPretendido')} />
            </Campo>

            <Campo id="pretensaoSalarial" label="Pretensão salarial" erro={errors.pretensaoSalarial?.message}>
              <select id="pretensaoSalarial" className={inputClasses} {...register('pretensaoSalarial')}>
                {pretensaoSalarialOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="anosExperienciaTotal" label="Experiência total" erro={errors.anosExperienciaTotal?.message}>
              <select id="anosExperienciaTotal" className={inputClasses} {...register('anosExperienciaTotal')}>
                {anosExperienciaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="experienciaSetorPapel" label="Já trabalhou no setor papel/embalagem?" erro={errors.experienciaSetorPapel?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="experienciaSetorPapel" type="checkbox" className="h-5 w-5" {...register('experienciaSetorPapel')} />
                <label htmlFor="experienciaSetorPapel" className="text-sm text-slate-700">
                  Sim, já trabalhei no setor
                </label>
              </div>
            </Campo>

            <Campo id="inicioImediato" label="Início imediato?" erro={errors.inicioImediato?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="inicioImediato" type="checkbox" className="h-5 w-5" {...register('inicioImediato')} />
                <label htmlFor="inicioImediato" className="text-sm text-slate-700">
                  Tenho disponibilidade imediata
                </label>
              </div>
            </Campo>
          </section>

          <section className="grid gap-5 border-t border-slate-200 pt-5">
            <Campo id="turnos" label="Turnos disponíveis" erro={errors.turnos?.message}>
              <div className="grid gap-3 rounded-xl border border-slate-300 p-4 sm:grid-cols-2">
                {turnoOptions.map((turno) => (
                  <label key={turno.value} className="flex items-center gap-3 text-sm text-slate-700">
                    <input type="checkbox" value={turno.value} className="h-5 w-5" {...register('turnos')} />
                    {turno.label}
                  </label>
                ))}
              </div>
            </Campo>

            <Campo id="disponibilidadeMudanca" label="Mudança de cidade" erro={errors.disponibilidadeMudanca?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="disponibilidadeMudanca" type="checkbox" className="h-5 w-5" {...register('disponibilidadeMudanca')} />
                <label htmlFor="disponibilidadeMudanca" className="text-sm text-slate-700">
                  Tenho disponibilidade para mudança de cidade
                </label>
              </div>
            </Campo>
          </section>

          <section className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Campo id="cursoFormacao" label="Curso / formação" erro={errors.cursoFormacao?.message}>
              <input id="cursoFormacao" className={inputClasses} placeholder="Ex.: Ensino médio, Técnico em mecânica" {...register('cursoFormacao')} />
            </Campo>

            <Campo id="instituicaoFormacao" label="Instituição" erro={errors.instituicaoFormacao?.message}>
              <input id="instituicaoFormacao" className={inputClasses} {...register('instituicaoFormacao')} />
            </Campo>

            <Campo id="statusFormacao" label="Situação da formação" erro={errors.statusFormacao?.message}>
              <select id="statusFormacao" className={inputClasses} {...register('statusFormacao')}>
                {formacaoStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo id="anoFormacao" label="Ano" erro={errors.anoFormacao?.message}>
              <input id="anoFormacao" type="number" className={inputClasses} placeholder="2026" {...register('anoFormacao')} />
            </Campo>
          </section>

          <section className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Campo id="empresaExperiencia" label="Empresa da última experiência (opcional)" erro={errors.empresaExperiencia?.message}>
              <input id="empresaExperiencia" className={inputClasses} {...register('empresaExperiencia')} />
            </Campo>

            <Campo id="cargoAtual" label="Último cargo / cargo atual" erro={errors.cargoAtual?.message}>
              <input id="cargoAtual" className={inputClasses} {...register('cargoAtual')} />
            </Campo>

            <Campo id="areaAtual" label="Área de atuação" erro={errors.areaAtual?.message}>
              <input id="areaAtual" className={inputClasses} {...register('areaAtual')} />
            </Campo>

            <Campo id="dataInicioExperiencia" label="Início no cargo" erro={errors.dataInicioExperiencia?.message}>
              <input id="dataInicioExperiencia" type="date" className={inputClasses} {...register('dataInicioExperiencia')} />
            </Campo>

            <Campo id="dataFimExperiencia" label="Fim no cargo (opcional)" erro={errors.dataFimExperiencia?.message}>
              <input id="dataFimExperiencia" type="date" className={inputClasses} {...register('dataFimExperiencia')} />
            </Campo>
          </section>

          <Campo id="descricaoExperiencia" label="Resumo da experiência (opcional)" erro={errors.descricaoExperiencia?.message}>
            <textarea
              id="descricaoExperiencia"
              className={`${inputClasses} min-h-28 resize-y`}
              placeholder="Descreva atividades em até 300 caracteres"
              {...register('descricaoExperiencia')}
            />
          </Campo>

          <section className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <Campo id="cursosCertificacoes" label="Cursos e certificações" erro={errors.cursosCertificacoes?.message}>
              <input id="cursosCertificacoes" className={inputClasses} placeholder="Ex.: NR-12, empilhadeira, informática" {...register('cursosCertificacoes')} />
            </Campo>

            <Campo id="idiomas" label="Idiomas" erro={errors.idiomas?.message}>
              <input id="idiomas" className={inputClasses} placeholder="Ex.: inglês básico, espanhol" {...register('idiomas')} />
            </Campo>

            <Campo id="pcd" label="PCD? (opcional)" erro={errors.pcd?.message}>
              <div className="flex min-h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input id="pcd" type="checkbox" className="h-5 w-5" {...register('pcd')} />
                <label htmlFor="pcd" className="text-sm text-slate-700">
                  Sim
                </label>
              </div>
            </Campo>

            <Campo id="pcdObservacao" label="Observação PCD (opcional)" erro={errors.pcdObservacao?.message}>
              <input id="pcdObservacao" className={inputClasses} {...register('pcdObservacao')} />
            </Campo>
          </section>

          <Campo id="habilidades" label="Principais habilidades" erro={errors.habilidades?.message}>
            <input
              id="habilidades"
              className={inputClasses}
              placeholder="Ex.: atendimento, logística, manutenção, Excel"
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
            {isSubmitting ? 'Enviando...' : 'Cadastrar meu currículo'}
          </button>
        </form>
      </div>
    </main>
  );
}
