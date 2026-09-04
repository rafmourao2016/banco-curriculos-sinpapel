import Link from 'next/link';

export default function TermosLgpdPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <Link href="/cadastro" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50">
          Voltar ao cadastro
        </Link>
        <div className="logo-spotlight mt-8">
          <img
            src="/logo-sinpapel.png"
            alt="SINPAPEL - Sindicato das Indústrias de Celulose, Papel e Papelão no Estado de Minas Gerais"
            className="relative z-10 h-auto w-56 max-w-full sm:w-72"
          />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">Termo de consentimento LGPD</h1>
        <p className="mt-4 leading-7 text-slate-600">Ao prosseguir com o cadastro, você autoriza o SINPAPEL a tratar os dados informados para composição do banco de currículos e eventual contato por empresas associadas.</p>
        <div className="mt-8 space-y-5 text-slate-700">
          <section><h2 className="font-semibold text-slate-950">Finalidade</h2><p className="mt-2 leading-7">Os dados serão utilizados para cadastro, organização, busca e contato profissional relacionado a oportunidades de trabalho.</p></section>
          <section><h2 className="font-semibold text-slate-950">Dados tratados</h2><p className="mt-2 leading-7">Nome, CPF, e-mail, telefone, região, escolaridade, experiências, formações e habilidades profissionais.</p></section>
          <section><h2 className="font-semibold text-slate-950">Compartilhamento</h2><p className="mt-2 leading-7">O currículo ativo pode ser consultado por empresas associadas e aprovadas pelo SINPAPEL, exclusivamente para oportunidades profissionais compatíveis.</p></section>
          <section><h2 className="font-semibold text-slate-950">Retenção e inativação</h2><p className="mt-2 leading-7">A cada 90 dias o SINPAPEL solicita a confirmação de disponibilidade. Sem resposta, o currículo é inativado e deixa de aparecer nas buscas. O prazo final de retenção será confirmado pelo jurídico.</p></section>
          <section><h2 className="font-semibold text-slate-950">Direitos do titular</h2><p className="mt-2 leading-7">Você pode solicitar acesso, correção ou exclusão dos seus dados. A exclusão de conta está disponível na Área do candidato.</p></section>
          <section><h2 className="font-semibold text-slate-950">Canal e prazo de atendimento</h2><p className="mt-2 leading-7">O titular pode usar a Área do candidato ou solicitar atendimento ao administrador do SINPAPEL. O canal oficial, a confirmação de identidade e o prazo de resposta serão definidos na política aprovada pelo jurídico.</p></section>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Este texto é uma versão operacional para revisão jurídica. A publicação definitiva depende da aprovação do responsável por privacidade e da definição do canal oficial.</div>
        <Link href="/politica-privacidade" className="mt-5 inline-flex font-semibold text-brand-700 underline underline-offset-4">Ler política de privacidade</Link>
      </article>
    </main>
  );
}
