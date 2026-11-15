import { useEffect, useRef, useState } from 'react';
import { getCatalogueSource } from '../../services/catalogue.js';
import CosmicBackground from './CosmicBackground.jsx';
import Header from './Header.jsx';
import NowPlayingPlayer from '../player/NowPlayingPlayer.jsx';
import { usePlayer } from '../player/PlayerContext.jsx';
import { routeHref } from '../../paths.js';
import './AppShell.css';

/*
 * App frame shared by every page: background, header/nav, main and footer.
 * Also handles what a browser does on a real page load but a single-page app
 * doesn't: updating the tab title, scrolling to the top and moving focus to
 * the new page's heading so screen-reader users hear the page change.
 */
export default function AppShell({ currentRoute, pageTitle, children }) {
  const isFirstRender = useRef(true);
  const [source, setSource] = useState('sample');
  const { currentTrack } = usePlayer();

  useEffect(() => {
    getCatalogueSource().then(setSource);
  }, []);

  useEffect(() => {
    document.title = `${pageTitle} — ASTRA`;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }, [currentRoute, pageTitle]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <CosmicBackground />
      <Header currentRoute={currentRoute} />

      <main id="main" className={`app-main container${currentTrack ? ' app-main--with-player' : ''}`}>
        {children}
      </main>

      <footer className="app-footer container">
        <p>
          ASTRA · portfolio build ·{' '}
          {source === 'spotify'
            ? 'search powered by Spotify; other sections use fictional sample data'
            : 'all music shown is fictional sample data'}
        </p>
        <a href={routeHref('kit')}>UI kit</a>
      </footer>

      <NowPlayingPlayer />
    </>
  );
}
