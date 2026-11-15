import { useEffect, useState } from 'react';
import Artwork from '../components/ui/Artwork.jsx';
import Button from '../components/ui/Button.jsx';
import PageIntro from '../components/layout/PageIntro.jsx';
import { routeHref } from '../paths.js';
import { searchCatalogue } from '../services/catalogue.js';
import './DiscoverPage.css';

const LISTENING_PATHS = [
  { label: 'Dream pop', query: 'dream pop' },
  { label: 'Neo-soul', query: 'neo-soul' },
  { label: 'Post-rock', query: 'post-rock' },
  { label: 'Afro-jazz', query: 'afro-jazz' },
  { label: 'Electronic', query: 'electronica' },
];

export default function DiscoverPage() {
  const [activePath, setActivePath] = useState(LISTENING_PATHS[0]);
  const [tracks, setTracks] = useState([]);
  const [source, setSource] = useState('sample');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    searchCatalogue(activePath.query, { limit: 10, signal: controller.signal })
      .then(({ results, source: resultSource }) => {
        setTracks(results.filter((item) => item.type === 'track').slice(0, 4));
        setSource(resultSource);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setTracks([]);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [activePath]);

  return (
    <div className="discover-page">
      <PageIntro
        eyebrow="A place to begin"
        title="Every sound opens a new universe."
        lead="Follow a feeling into the unfamiliar. Find new artists and sounds beyond your usual orbit."
      >
        <Button variant="primary" size="lg" href={routeHref('explore')}>
          Explore by mood
        </Button>
        <Button variant="secondary" size="lg" href={routeHref('frequency')}>
          Find your frequency
        </Button>
      </PageIntro>

      <section className="discover-section" aria-labelledby="listening-path-title">
        <div className="discover-section__heading">
          <div>
            <p className="text-meta text-meta--warm">A listening path</p>
            <h2 id="listening-path-title">Choose a thread to follow</h2>
          </div>
          <p className="discover-section__hint">A new direction, whenever you need one.</p>
        </div>

        <div className="discover-paths" role="group" aria-label="Choose a musical direction">
          {LISTENING_PATHS.map((path) => (
            <button
              key={path.query}
              type="button"
              className={`discover-path${activePath.query === path.query ? ' discover-path--active' : ''}`}
              aria-pressed={activePath.query === path.query}
              onClick={() => setActivePath(path)}
            >
              {path.label}
            </button>
          ))}
        </div>

        <div className="discover-results-heading">
          <h3>{activePath.label}, from here</h3>
          <span className={`discover-source discover-source--${source}`}>
            {source === 'spotify' ? 'Live Spotify search' : 'ASTRA sample collection'}
          </span>
        </div>

        {status === 'loading' && (
          <p className="discover-message" role="status">Finding a new direction…</p>
        )}
        {status === 'error' && (
          <p className="discover-message" role="alert">
            This listening path couldn’t load just now. Please try another direction.
          </p>
        )}
        {status === 'ready' && tracks.length === 0 && (
          <p className="discover-message">
            No tracks surfaced for this path. Choose another direction to keep exploring.
          </p>
        )}

        {status === 'ready' && tracks.length > 0 && (
          <div className="discover-grid">
            {tracks.map((track) => (
              <article className="discover-track" key={track.id}>
                <Artwork seed={track.id} label={`Abstract ASTRA artwork for ${track.title}`} />
                <div className="discover-track__details">
                  <h3 className="discover-track__title">{track.title}</h3>
                  <p className="discover-track__artist">{track.artistName}</p>
                  {track.spotifyUrl ? (
                    <a
                      className="discover-track__link"
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${track.title} by ${track.artistName} on Spotify`}
                    >
                      Open in Spotify <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span className="discover-track__sample">Sample track</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="discover-invitation">
        <div>
          <p className="text-meta text-meta--warm">Your sound, in motion</p>
          <h2>There’s more to your listening story.</h2>
          <p>Map the sounds you’re drawn to and discover the musical identity behind them.</p>
        </div>
        <Button variant="secondary" href={routeHref('frequency')} icon="arrowRight" iconPosition="end">
          Find your frequency
        </Button>
      </aside>
    </div>
  );
}
