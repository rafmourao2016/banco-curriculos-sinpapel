import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-7xl content-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1fr)_520px]">
        <div className="flex flex-col justify-center">
          <div className="logo-spotlight flex items-center">
            <img
              src="/logo-sinpapel.png"
              alt="SINPAPEL - Sindicato das Indústrias de Celulose, Papel e Papelão no Estado de Minas Gerais"
              className="relative z-10 h-auto w-64 max-w-full sm:w-80"
            />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-sinred sm:text-sm">
            Banco de Currículos
          </p>
          <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Banco de Curriculos SINPAPEL para aproximar talentos e empresas associadas.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-700 sm:text-xl sm:leading-9 lg:text-2xl">
            Uma iniciativa alinhada a missao de congregar, promover e defender os interesses das empresas do setor em Minas Gerais.
          </p>
          <p className="mt-4 max-w-3xl rounded-2xl border border-brand-600/20 bg-white/70 px-4 py-3 text-base font-medium leading-7 text-brand-700 shadow-sm sm:text-lg">
            Escaneie o QR Code e cadastre seu curriculo para participar do banco de oportunidades do SINPAPEL.
          </p>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Link href="/cadastro" className="inline-flex justify-center rounded-xl bg-brand-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700">
              Cadastrar curriculo agora
            </Link>
            <Link href="/candidato" className="inline-flex justify-center rounded-xl border border-brand-600 bg-white px-5 py-4 text-base font-semibold text-brand-700 hover:bg-brand-50">
              Ja tenho cadastro
            </Link>
            <Link href="/empresa" className="inline-flex justify-center rounded-xl border border-singreen bg-white px-5 py-4 text-base font-semibold text-singreen hover:bg-emerald-50">
              Sou empresa
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-brand-700">
            <Link href="/termos-lgpd" className="underline underline-offset-4">Termo LGPD</Link>
            <Link href="/politica-privacidade" className="underline underline-offset-4">Politica de privacidade</Link>
            <Link href="/admin" className="underline underline-offset-4">Acesso administrativo</Link>
          </div>
        </div>

        <aside className="flex flex-col justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-2xl shadow-slate-300/70 sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-singreen">
              Cadastro rapido
            </p>
            <div className="mx-auto mt-5 w-full max-w-[360px] rounded-xl border border-slate-200 bg-white p-3 sm:max-w-[420px]">
              <img
                src="/qr-cadastro-sinpapel.svg"
                alt="QR Code para cadastro de curriculo no Banco de Curriculos SINPAPEL"
                className="aspect-square w-full"
              />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Escaneie para cadastrar
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700 sm:text-lg">
              O QR Code leva direto ao formulario de curriculo.
            </p>
            <p className="mt-4 break-all rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-brand-700 sm:text-base">
              sinpapel.vercel.app/cadastro
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
