import Link from 'next/link';

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-slate-950 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">Voltar ao inicio</Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-singreen">SINPAPEL</p>
        <h1 className="mt-3 text-3xl font-semibold">Politica de privacidade</h1>
        <p className="mt-4 leading-7 text-slate-600">Versao operacional para revisao juridica antes da publicacao definitiva.</p>
        <div className="mt-8 space-y-6 text-slate-700">
          <section><h2 className="text-lg font-semibold text-slate-950">1. Finalidade</h2><p className="mt-2 leading-7">O SINPAPEL trata dados profissionais para formar um banco de curriculos, permitir buscas por empresas aprovadas e viabilizar contatos relacionados a oportunidades de trabalho.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">2. Dados utilizados</h2><p className="mt-2 leading-7">Podem ser tratados dados de identificacao, contato, localizacao, escolaridade, experiencias, habilidades, cursos, idiomas, CNH e disponibilidade fornecidos pelo titular.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">3. Acesso e compartilhamento</h2><p className="mt-2 leading-7">Somente empresas aprovadas podem consultar curriculos ativos. O acesso e registrado para seguranca, auditoria e atendimento a solicitacoes do titular.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">4. Retencao</h2><p className="mt-2 leading-7">O titular pode excluir o cadastro imediatamente. Curriculos sem confirmacao sao inativados pelo ciclo operacional. O prazo definitivo de eliminacao sera aprovado pelo juridico.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">5. Direitos do titular</h2><p className="mt-2 leading-7">O titular pode solicitar acesso, correcao, informacoes sobre o uso dos dados, revogacao do consentimento e exclusao, observadas as hipoteses legais de conservacao.</p></section>
          <section><h2 className="text-lg font-semibold text-slate-950">6. Atendimento</h2><p className="mt-2 leading-7">Enquanto o canal oficial nao for definido, o atendimento ocorre pela Area do candidato ou pelo administrador do SINPAPEL. A identidade e confirmada e o prazo de resposta sera definido na versao juridica final.</p></section>
        </div>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Pendencias para aprovacao: responsavel pelo tratamento, canal oficial, prazo de atendimento, periodo de retencao, bases legais e contratos com operadores.</div>
      </article>
    </main>
  );
}
