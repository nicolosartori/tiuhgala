import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { isAdminAuthenticated } from '@/lib/auth';

export const metadata = {
  title: 'Ticino Unihockey – Cena di Gala',
  description: 'Gestione lotteria e asta maglie'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = await isAdminAuthenticated();

  return (
    <html lang="it">
      <body>
        {isAuthenticated ? <SiteHeader /> : null}
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
