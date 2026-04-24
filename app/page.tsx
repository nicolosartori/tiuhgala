import { getHomepageLiveData } from '@/lib/homepage-live';
import { HomepageLiveDashboard } from '@/components/HomepageLiveDashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const liveData = await getHomepageLiveData();

  return (
    <div className="home-dashboard-page dashboard-shell">
      <section className="hero-board">
        <div className="hero-copy">
          <h1>Lotteria e asta aggiornate in tempo reale.</h1>
          <p className="hero-text">
            Desideri acquistare una busta o rilanciare un&apos;offerta per una maglia? Chiedi al
            cameriere del tuo tavolo.
          </p>
        </div>
      </section>
      <HomepageLiveDashboard initialData={liveData} />
    </div>
  );
}
