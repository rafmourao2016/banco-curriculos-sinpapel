import Link from 'next/link';

export default function TermosLgpdPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <Link href="/cadastro" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50">
          Voltar ao cadastro
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">Termo de consentimento LGPD</h1>
        <p className="mt-4 leading-7 text-slate-600">Ao prosseguir com o cadastro, voce autoriza o SINPAPEL a tratar os dados informados para composicao do banco de curriculos e eventual contato por empresas associadas.</p>
        <div className="mt-8 space-y-5 text-slate-700">
          <section><h2 className="font-semibold text-slate-950">Finalidade</h2><p className="mt-2 leading-7">Os dados serao utilizados para cadastro, organizacao, busca e contato profissional relacionado a oportunidades de trabalho.</p></section>
          <section><h2 className="font-semibold text-slate-950">Dados tratados</h2><p className="mt-2 leading-7">Nome, CPF, e-mail, telefone, regiao, escolaridade, experiencias, formacoes e habilidades profissionais.</p></section>
          <section><h2 className="font-semibold text-slate-950">Compartilhamento</h2><p className="mt-2 leading-7">O curriculo ativo pode ser consultado por empresas associadas e aprovadas pelo SINPAPEL, exclusivamente para oportunidades profissionais compativeis.</p></section>
          <section><h2 className="font-semibold text-slate-950">Retencao e inativacao</h2><p className="mt-2 leading-7">A cada 90 dias o SINPAPEL solicita a confirmacao de disponibilidade. Sem resposta, o curriculo e inativado e deixa de aparecer nas buscas. O prazo final de retencao sera confirmado pelo juridico.</p></section>
          <section><h2 className="font-semibold text-slate-950">Direitos do titular</h2><p className="mt-2 leading-7">Voce pode solicitar acesso, correcao ou exclusao dos seus dados. A exclusao de conta esta disponivel na Area do candidato.</p></section>
          <section><h2 className="font-semibold text-slate-950">Canal e prazo de atendimento</h2><p className="mt-2 leading-7">O titular pode usar a Area do candidato ou solicitar atendimento ao administrador do SINPAPEL. O canal oficial, a confirmacao de identidade e o prazo de resposta serao definidos na politica aprovada pelo juridico.</p></section>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Este texto e uma versao operacional para revisao juridica. A publicacao definitiva depende da aprovacao do responsavel por privacidade e da definicao do canal oficial.</div>
        <Link href="/politica-privacidade" className="mt-5 inline-flex font-semibold text-brand-700 underline underline-offset-4">Ler politica de privacidade</Link>
      </article>
    </main>
  );
}
