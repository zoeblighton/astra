import AppShell from './components/layout/AppShell.jsx';
import useHashRoute from './hooks/useHashRoute.js';
import { ROUTES, ROUTE_IDS, DEFAULT_ROUTE } from './routes.js';
import { PlayerProvider } from './components/player/PlayerContext.jsx';

export default function App() {
  const routeId = useHashRoute(ROUTE_IDS, DEFAULT_ROUTE);
  const route = ROUTES.find((r) => r.id === routeId);
  const Page = route.component;

  return (
    <PlayerProvider>
      <AppShell currentRoute={route.id} pageTitle={route.title}>
        {/* key resets page state when switching pages */}
        <Page key={route.id} />
      </AppShell>
    </PlayerProvider>
  );
}
