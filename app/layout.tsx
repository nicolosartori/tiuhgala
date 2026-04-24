import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata = {
  title: 'Ticino Unihockey – Cena di Gala',
  description: 'Gestione lotteria e asta maglie'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <SiteHeader />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
