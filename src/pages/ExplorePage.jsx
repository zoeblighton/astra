import { useEffect, useState } from 'react';
import Artwork from '../components/ui/Artwork.jsx';
import Button from '../components/ui/Button.jsx';
import PageIntro from '../components/layout/PageIntro.jsx';
import { searchCatalogue } from '../services/catalogue.js';
import { usePlayer } from '../components/player/PlayerContext.jsx';
import { useUniverse } from '../components/universe/UniverseContext.jsx';
import './ExplorePage.css';

const CATEGORIES = [
  {
    id: 'mood',
    label: 'Mood',
    description: 'Start with how you want the music to feel.',
    paths: [
      { label: 'Dreamy', query: 'Dreamy' },
      { label: 'Soulful', query: 'Soulful' },
      { label: 'Restless', query: 'Restless' },
      { label: 'Nostalgic', query: 'Nostalgic' },
      { label: 'Uplifting', query: 'Uplifting' },
      { label: 'Tender', query: 'Tender' },
    ],
  },
  {
    id: 'genre',
    label: 'Genre',
    description: 'Step into a sound, scene or musical tradition.',
    paths: [
      { label: 'Dream pop', query: 'Dream pop' },
      { label: 'Neo-soul', query: 'Neo-soul' },
      { label: 'Afro-jazz', query: 'Afro-jazz' },
      { label: 'Post-punk', query: 'Post-punk' },
      { label: 'Electronica', query: 'Electronica' },
      { label: 'Modern classical', query: 'Modern classical' },
      { label: 'Folk', query: 'Folk' },
      { label: 'Post-rock', query: 'Post-rock' },
      { label: 'Latin alternative', query: 'Latin alternative' },
    ],
  },
  {
    id: 'atmosphere',
    label: 'Atmosphere',
    description: 'Follow the textures and spaces between the notes.',
    paths: [
      { label: 'Nocturnal', query: 'Nocturnal' },
      { label: 'Reflective', query: 'Reflective' },
      { label: 'Hypnotic', query: 'Hypnotic' },
      { label: 'Cinematic', query: 'Cinematic' },
      { label: 'Bittersweet', query: 'Bittersweet' },
      { label: 'Curious', query: 'Curious' },
      { label: 'Intimate', query: 'Intimate' },
      { label: 'Brooding', query: 'Brooding' },
    ],
  },
];

export default function ExplorePage() {
  const { playTrack } = usePlayer();
  const { library, toggleSavedTrack, toggleFavouriteArtist, toggleDiscovery } = useUniverse();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [activePath, setActivePath] = useState(CATEGORIES[0].paths[0]);
  const [items, setItems] = useState([]);
  const [source, setSource] = useState('sample');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setItems([]);
    setStatus('loading');

    searchCatalogue(activePath.query, { limit: 10, signal: controller.signal })
      .then(({ results, source: resultSource }) => {
        setItems(results);
        setSource(resultSource);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setItems([]);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [activePath]);

  function chooseCategory(nextCategory) {
    setCategory(nextCategory);
    setActivePath(nextCategory.paths[0]);
  }

  return (
    <div className="explore-page">
      <PageIntro
        eyebrow="Explore"
        title="Wander by mood, genre and atmosphere."
        lead="Follow a feeling, a scene or a sound. There’s always another direction to take."
      />

      <section className="explore-browser" aria-labelledby="explore-browser-title">
        <div className="explore-browser__intro">
          <div>
            <p className="text-meta text-meta--warm">Find your way in</p>
            <h2 id="explore-browser-title">What are you drawn to?</h2>
          </div>
          <p>Choose a starting point. Follow it wherever it leads.</p>
        </div>

        <div className="explore-tabs" role="group" aria-label="Ways to explore">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              className={`explore-tabs__tab${category.id === item.id ? ' explore-tabs__tab--active' : ''}`}
              type="button"
              aria-pressed={category.id === item.id}
              onClick={() => chooseCategory(item)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="explore-panel">
          <p className="explore-panel__description">{category.description}</p>
          <div
            className="explore-paths"
            role="group"
            aria-label={`Choose a ${category.label.toLowerCase()}`}
          >
            {category.paths.map((path) => (
              <button
                key={path.query}
                type="button"
                className={`explore-path${activePath.query === path.query ? ' explore-path--active' : ''}`}
                aria-pressed={activePath.query === path.query}
                onClick={() => setActivePath(path)}
              >
                {path.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="explore-results" aria-labelledby="explore-results-title" aria-live="polite">
        <div className="explore-results__heading">
          <div>
            <p className="text-meta">Following {category.label.toLowerCase()}</p>
            <h2 id="explore-results-title">{activePath.label}</h2>
          </div>
          {status === 'ready' && (
            <span className={`explore-source explore-source--${source}`}>
              {source === 'spotify' ? 'Live Spotify results' : 'ASTRA sample collection'}
            </span>
          )}
        </div>

        {status === 'loading' && (
          <p className="explore-message" role="status">Finding sounds to follow…</p>
        )}
        {status === 'error' && (
          <p className="explore-message" role="alert">
            This path couldn’t load just now. Please try another direction.
          </p>
        )}
        {status === 'ready' && items.length === 0 && (
          <p className="explore-message">
            Nothing surfaced on this path yet. Choose another thread and keep wandering.
          </p>
        )}

        {status === 'ready' && items.length > 0 && (
          <div className="explore-results__grid">
            {items.map((item) => (
              <article className="explore-card" key={`${item.type}-${item.id}`}>
                {source === 'spotify' && item.imageUrl ? (
                  <img
                    className="explore-card__image"
                    src={item.imageUrl}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <Artwork
                    className="explore-card__artwork"
                    seed={item.id}
                    label={`Abstract ASTRA artwork for ${item.title}`}
                  />
                )}
                <span className="explore-card__type">
                  {item.type === 'artist' ? 'Artist' : 'Track'}
                </span>
                <div className="explore-card__details">
                  <h3 className="explore-card__title">
                    {item.spotifyUrl ? (
                      <a
                        href={item.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.title}
                      </a>
                    ) : item.title}
                  </h3>
                  <p className="explore-card__subtitle">
                    {item.type === 'artist' ? item.subtitle : item.artistName}
                  </p>
                  {item.spotifyUrl ? (
                    <a
                      className="explore-card__link"
                      href={item.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open on Spotify ↗
                    </a>
                  ) : (
                    <span className="explore-card__sample">ASTRA sample</span>
                  )}
                  {item.type === 'track' && (
                    <div className="explore-card__actions">
                      <Button
                        className="explore-card__queue"
                        variant="ghost"
                        size="sm"
                        onClick={() => playTrack(item, items.filter((candidate) => candidate.type === 'track'))}
                      >
                        {item.spotifyUrl ? 'Add to player' : 'View sample in player'}
                      </Button>
                      <Button
                        className="explore-card__save"
                        variant="ghost"
                        size="sm"
                        aria-pressed={library.savedTracks.some((track) => track.id === item.id)}
                        onClick={() => toggleSavedTrack(item)}
                      >
                        {library.savedTracks.some((track) => track.id === item.id) ? 'Saved' : 'Save track'}
                      </Button>
                    </div>
                  )}
                  {item.type === 'artist' && (
                    <div className="explore-card__actions">
                      <Button
                        className="explore-card__save"
                        variant="ghost"
                        size="sm"
                        aria-pressed={library.favouriteArtists.some((artist) => artist.id === item.id)}
                        onClick={() => toggleFavouriteArtist(item)}
                      >
                        {library.favouriteArtists.some((artist) => artist.id === item.id) ? 'Following' : 'Follow artist'}
                      </Button>
                      <Button
                        className="explore-card__save"
                        variant="ghost"
                        size="sm"
                        aria-pressed={library.discoveries.some((saved) => saved.id === item.id && saved.type === item.type)}
                        onClick={() => toggleDiscovery(item)}
                      >
                        {library.discoveries.some((saved) => saved.id === item.id && saved.type === item.type)
                          ? 'Saved discovery'
                          : 'Save discovery'}
                      </Button>
                    </div>
                  )}
                  {item.type === 'track' && (
                    <Button
                      className="explore-card__save"
                      variant="ghost"
                      size="sm"
                      aria-pressed={library.discoveries.some((saved) => saved.id === item.id && saved.type === item.type)}
                      onClick={() => toggleDiscovery(item)}
                    >
                      {library.discoveries.some((saved) => saved.id === item.id && saved.type === item.type)
                        ? 'Saved discovery'
                        : 'Save discovery'}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="explore-attribution">
          {source === 'spotify'
            ? 'Music and artist information provided by Spotify. Open a result to listen on Spotify.'
            : 'Fictional music created for ASTRA. This collection is sample data, not a Spotify playlist.'}
        </p>
      </section>
    </div>
  );
}
