'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cadastroSchema, CadastroFormValues, escolaridadeOptions } from '../../lib/cadastroSchema';
import { cadastrarCandidato } from '../../lib/api';
import { Campo } from '../../components/Campo';

const inputClasses =
  'w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30';

export default function CadastroPage() {
  const [enviado, setEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { possuiCnh: false },
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
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-medium text-gray-900">Cadastro recebido!</h1>
        <p className="mt-2 text-gray-600">
          Seu currículo já está ativo no banco do SINPAPEL. Empresas associadas poderão encontrá-lo agora.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-medium text-gray-900">Banco de Currículos do SINPAPEL</h1>
        <p className="mt-1 text-sm text-gray-600">
          Leva menos de 5 minutos. Preencha os campos abaixo — sem necessidade de anexar arquivos.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Campo id="nome" label="Nome completo" erro={errors.nome?.message}>
          <input id="nome" className={inputClasses} autoComplete="name" {...register('nome')} />
        </Campo>

        <Campo id="cpf" label="CPF" erro={errors.cpf?.message}>
          <input id="cpf" inputMode="numeric" className={inputClasses} {...register('cpf')} />
        </Campo>

        <Campo id="email" label="E-mail" erro={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClasses} {...register('email')} />
        </Campo>

        <Campo id="telefone" label="Telefone (WhatsApp)" erro={errors.telefone?.message}>
          <input id="telefone" inputMode="tel" className={inputClasses} {...register('telefone')} />
        </Campo>

        <Campo id="dataNascimento" label="Data de nascimento" erro={errors.dataNascimento?.message}>
          <input id="dataNascimento" type="date" className={inputClasses} {...register('dataNascimento')} />
        </Campo>

        <Campo id="regiao" label="Cidade / região" erro={errors.regiao?.message}>
          <input id="regiao" className={inputClasses} {...register('regiao')} />
        </Campo>

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
          <div className="flex items-center gap-2">
            <input id="possuiCnh" type="checkbox" className="h-5 w-5" {...register('possuiCnh')} />
            <label htmlFor="possuiCnh" className="text-sm text-gray-700">
              Sim, possuo Carteira Nacional de Habilitação
            </label>
          </div>
        </Campo>

        <Campo id="cargoAtual" label="Último cargo / cargo atual" erro={errors.cargoAtual?.message}>
          <input id="cargoAtual" className={inputClasses} {...register('cargoAtual')} />
        </Campo>

        <Campo id="areaAtual" label="Área de atuação" erro={errors.areaAtual?.message}>
          <input id="areaAtual" className={inputClasses} {...register('areaAtual')} />
        </Campo>

        <Campo id="habilidades" label="Principais habilidades (separadas por vírgula)" erro={errors.habilidades?.message}>
          <input id="habilidades" className={inputClasses} placeholder="ex.: atendimento, excel, logística" {...register('habilidades')} />
        </Campo>

        <Campo id="senha" label="Crie uma senha" erro={errors.senha?.message}>
          <input id="senha" type="password" autoComplete="new-password" className={inputClasses} {...register('senha')} />
        </Campo>

        <div className="flex items-start gap-2">
          <input id="aceiteTermoLgpd" type="checkbox" className="mt-1 h-5 w-5" {...register('aceiteTermoLgpd')} />
          <label htmlFor="aceiteTermoLgpd" className="text-sm text-gray-700">
            Li e aceito o{' '}
            <a href="/termos-lgpd" className="text-brand-600 underline">
              termo de consentimento para tratamento de dados (LGPD)
            </a>
            .
          </label>
        </div>
        {errors.aceiteTermoLgpd && (
          <p role="alert" className="text-sm text-red-600">
            {errors.aceiteTermoLgpd.message}
          </p>
        )}

        {erroEnvio && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {erroEnvio}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-brand-600 px-4 py-3 text-base font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Enviando...' : 'Cadastrar meu currículo'}
        </button>
      </form>
    </main>
  );
}
