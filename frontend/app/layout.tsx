import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteShell } from '../components/SiteShell';

export const metadata: Metadata = {
  title: 'Banco de Currículos do SINPAPEL',
  description: 'Cadastre seu currículo e seja encontrado por empresas associadas.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
