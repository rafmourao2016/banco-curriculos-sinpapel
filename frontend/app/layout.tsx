import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Banco de Currículos do SINPAPEL',
  description: 'Cadastre seu currículo e seja encontrado por empresas associadas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
