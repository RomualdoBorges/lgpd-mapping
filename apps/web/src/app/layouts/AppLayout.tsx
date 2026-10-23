import { useState, useSyncExternalStore } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';

const desktopQuery = '(min-width: 64rem)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
function desktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

export function AppLayout() {
  const desktop = useSyncExternalStore(subscribe, desktopSnapshot);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const { pathname } = useLocation();
  const title = pathname === '/' ? 'Início' : 'Página não encontrada';

  return (
    <>
      <a href="#main-content" className="skip-link">
        Ir para o conteúdo
      </a>
      <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Sidebar
          hidden={!desktop && !navigationOpen}
          onNavigate={() => setNavigationOpen(false)}
        />
        <div className="min-w-0">
          <Header
            title={title}
            desktop={desktop}
            navigationOpen={navigationOpen}
            onToggleNavigation={() => setNavigationOpen((open) => !open)}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
