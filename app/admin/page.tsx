import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LogoutButton } from '@/components/LogoutButton';
import { LoginForm } from '@/components/LoginForm';
import { AdminHomepageSettings } from '@/components/AdminHomepageSettings';

export default async function AdminPage() {
  const ok = await isAdminAuthenticated();

  if (!ok) {
    return (
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1>Login Admin</h1>
        <p className="small">Inserire password operatore.</p>
        <LoginForm />
      </div>
    );
  }

  const config = await prisma.appConfig.findUnique({ where: { id: 1 } });

  return (
    <div className="row">
      <div className="card">
        <h1>Area Admin</h1>
        <div className="nav">
          <Link href="/admin/lotteria">Gestione Lotteria</Link>
          <Link href="/admin/asta">Gestione Asta</Link>
          <a className="button" href="/api/export/lotteria">Export CSV Lotteria</a>
          <a className="button secondary" href="/api/export/asta">Export CSV Asta + Offerte</a>
        </div>
        <LogoutButton />
      </div>
      <AdminHomepageSettings initialInterval={config?.homepageAuctionRotationSeconds ?? 30} />
    </div>
  );
}
