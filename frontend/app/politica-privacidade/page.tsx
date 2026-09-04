import Link from 'next/link';

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-slate-950 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">Voltar ao início</Link>
        <div className="logo-spotlight mt-8">
          <img
            src="/logo-sinpapel.png"
            alt="SINPAPEL - Sindicato das Indústrias de Celulose, Papel e Papelão no Estado de Minas Gerais"
            className="relative z-10 h-auto w-56 max-w-full sm:w-72"
          />
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-singreen">SINPAPEL</p>
        <h1 className="mt-3 text-3xl font-semibold">Política de privacidade</h1>
        <p className="mt-4 leading-7 text-slate-600">Versão operacional para revisão jurídica antes da publicação definitiva.</p>
        <div className="mt-8 space-y-6 text-slate-700">
          <section><h2 className="text-lg font-semibold text-slate-950">1. Finalidade</h2><p className="mt-2 leading-7">O SINPAPEL trata dados profissionais para formar um banco de currículos, permitir buscas por empresas aprovadas e viabilizar contatos relacionados a oportunidades de trabalho.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">2. Dados utilizados</h2><p className="mt-2 leading-7">Podem ser tratados dados de identificação, contato, localização, escolaridade, experiências, habilidades, cursos, idiomas, CNH e disponibilidade fornecidos pelo titular.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">3. Acesso e compartilhamento</h2><p className="mt-2 leading-7">Somente empresas aprovadas podem consultar currículos ativos. O acesso é registrado para segurança, auditoria e atendimento a solicitações do titular.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">4. Retenção</h2><p className="mt-2 leading-7">O titular pode excluir o cadastro imediatamente. Currículos sem confirmação são inativados pelo ciclo operacional. O prazo definitivo de eliminação será aprovado pelo jurídico.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">5. Direitos do titular</h2><p className="mt-2 leading-7">O titular pode solicitar acesso, correção, informações sobre o uso dos dados, revogação do consentimento e exclusão, observadas as hipóteses legais de conservação.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">6. Atendimento</h2><p className="mt-2 leading-7">Enquanto o canal oficial não for definido, o atendimento ocorre pela Área do candidato ou pelo administrador do SINPAPEL. A identidade é confirmada e o prazo de resposta será definido na versão jurídica final.</p></section>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Pendências para aprovação: responsável pelo tratamento, canal oficial, prazo de atendimento, período de retenção, bases legais e contratos com operadores.</div>
      </article>
    </main>
  );
}
