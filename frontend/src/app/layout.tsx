import type { Metadata } from 'next';
import './globals.css';
import ClientShell from '@/components/ClientShell';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'AutoParts — Inventory Management',
  description: 'Automotive dismantling inventory management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <ClientShell>{children}</ClientShell>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
