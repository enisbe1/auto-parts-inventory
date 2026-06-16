import type { Metadata } from 'next';
import './globals.css';
import ClientShell from '@/components/ClientShell';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const metadata: Metadata = {
  title: 'AutoParts — Inventory Management',
  description: 'Automotive dismantling inventory management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <LanguageProvider>
          <ClientShell>{children}</ClientShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
