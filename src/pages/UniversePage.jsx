import { useState } from 'react';
import Artwork from '../components/ui/Artwork.jsx';
import Button from '../components/ui/Button.jsx';
import PageIntro from '../components/layout/PageIntro.jsx';
import { useUniverse } from '../components/universe/UniverseContext.jsx';
import SpotifyLibrary from '../components/universe/SpotifyLibrary.jsx';
import { IDENTITIES } from '../data/identities.js';
import { routeHref } from '../paths.js';
import './UniversePage.css';

const FREQUENCY_STORAGE_KEY = 'astra-frequency-result-v1';
const IDENTITY_BY_ID = Object.fromEntries(IDENTITIES.map((identity) => [identity.id, identity]));

function readFrequencyIdentity() {
  try {
    const stored = window.localStorage.getItem(FREQUENCY_STORAGE_KEY);
    if (!stored) return { identity: null, error: '' };

    const parsed = JSON.parse(stored);
    if (parsed.version !== 1) {
      return { identity: null, error: 'Your saved Frequency result could not be recognised. You can retake it below.' };
    }

    const identity = IDENTITY_BY_ID[parsed.result?.dominantId] ?? null;
    return {
      identity,
      error: identity ? '' : 'Your saved Frequency result could not be recognised. You can retake it below.',
    };
  } catch {
    return { identity: null, error: 'Your saved Frequency result could not be read from this browser.' };
  }
}

function ItemArtwork({ item, label }) {
  return item.imageUrl ? (
    <img className="universe-item__image" src={item.imageUrl} alt="" loading="lazy" />
  ) : (
    <Artwork seed={item.id} shape="round" label={label} />
  );
}

function SourceLabel({ item }) {
  return (
    <span className={`universe-source${item.spotifyUrl ? ' universe-source--spotify' : ''}`}>
      {item.spotifyUrl ? 'Spotify' : 'ASTRA sample'}
    </span>
  );
}

export default function UniversePage() {
  const {
    library,
    storageMessage,
    toggleSavedTrack,
    toggleFavouriteArtist,
    toggleDiscovery,
    createPlaylist,
    removePlaylist,
    togglePlaylistTrack,
  } = useUniverse();
  const [frequencyState] = useState(readFrequencyIdentity);
  const identity = frequencyState.identity;
  const [playlistName, setPlaylistName] = useState('');
  const [playlistMessage, setPlaylistMessage] = useState('');

  function submitPlaylist(event) {
    event.preventDefault();
    if (!playlistName.trim()) {
      setPlaylistMessage('Give your playlist a name first.');
      return;
    }

    if (!createPlaylist(playlistName)) {
      setPlaylistMessage('A playlist with that name already exists.');
      return;
    }

    setPlaylistName('');
    setPlaylistMessage('Your playlist is ready. Add saved tracks to it below.');
  }

  return (
    <div className="universe-page">
      <PageIntro
        eyebrow="My Universe"
        title="Everything in your orbit."
        lead="Your saved tracks, favourite artists and discoveries, gathered in one place."
      />

      <p className="universe-storage-note">
        What you save in ASTRA stays in this browser and isn’t added to your Spotify account.
      </p>
      {storageMessage && <p className="universe-message" role="status">{storageMessage}</p>}
      {frequencyState.error && <p className="universe-message" role="status">{frequencyState.error}</p>}

      <section className="universe-stats" aria-label="Your Universe at a glance">
        <div><strong>{library.savedTracks.length}</strong><span>Saved tracks</span></div>
        <div><strong>{library.favouriteArtists.length}</strong><span>Favourite artists</span></div>
        <div><strong>{library.discoveries.length}</strong><span>Discoveries</span></div>
        <div><strong>{library.playlists.length}</strong><span>Playlists</span></div>
      </section>

      <section className="universe-identity surface surface--feature" aria-labelledby="universe-identity-title">
        <div className="universe-identity__art">
          {identity ? (
            <Artwork seed={`identity-${identity.id}`} shape="round" label={`Abstract art for ${identity.name}`} />
          ) : (
            <div className="universe-identity__empty-orbit" aria-hidden="true"><span /></div>
          )}
        </div>
        <div className="universe-identity__copy">
          <p className="text-meta text-meta--warm">Your musical identity</p>
          <h2 id="universe-identity-title">{identity?.name ?? 'Your frequency is waiting'}</h2>
          <p>
            {identity
              ? `${identity.essence} sounds, shaped by your musical preferences.`
              : 'Reflect on the sounds you love to add your musical identity to this space.'}
          </p>
          <Button variant="secondary" size="sm" href={routeHref('frequency')}>
            {identity ? 'Revisit your frequency' : 'Find your frequency'}
          </Button>
        </div>
      </section>

      <SpotifyLibrary />

      <section className="universe-section" aria-labelledby="universe-tracks-title">
        <div className="universe-section__heading">
          <div>
            <p className="text-meta text-meta--warm">Kept close</p>
            <h2 id="universe-tracks-title">Saved tracks</h2>
          </div>
          <span>{library.savedTracks.length} {library.savedTracks.length === 1 ? 'track' : 'tracks'}</span>
        </div>
        {library.savedTracks.length === 0 ? (
          <div className="universe-empty surface">
            <p>Your saved tracks will find a home here.</p>
            <Button variant="secondary" size="sm" href={routeHref('discover')}>Discover music</Button>
          </div>
        ) : (
          <div className="universe-list">
            {library.savedTracks.map((track) => (
              <article className="universe-item" key={track.id}>
                <ItemArtwork item={track} label={`Artwork for ${track.title}`} />
                <div className="universe-item__details">
                  <h3>{track.title}</h3>
                  <p>{track.artistName || 'Artist details unavailable'}</p>
                  <SourceLabel item={track} />
                </div>
                <div className="universe-item__actions">
                  {track.spotifyUrl && (
                    <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer">Open on Spotify ↗</a>
                  )}
                  <button type="button" onClick={() => toggleSavedTrack(track)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="universe-section" aria-labelledby="universe-artists-title">
        <div className="universe-section__heading">
          <div>
            <p className="text-meta text-meta--warm">Names to remember</p>
            <h2 id="universe-artists-title">Favourite artists</h2>
          </div>
          <span>{library.favouriteArtists.length} {library.favouriteArtists.length === 1 ? 'artist' : 'artists'}</span>
        </div>
        {library.favouriteArtists.length === 0 ? (
          <div className="universe-empty surface">
            <p>Follow artists as you explore to keep them in your orbit.</p>
            <Button variant="secondary" size="sm" href={routeHref('explore')}>Explore artists</Button>
          </div>
        ) : (
          <div className="universe-artists">
            {library.favouriteArtists.map((artist) => (
              <article className="universe-artist surface" key={artist.id}>
                <ItemArtwork item={artist} label={`Artwork for ${artist.title}`} />
                <h3>{artist.title}</h3>
                {artist.subtitle && <p>{artist.subtitle}</p>}
                <SourceLabel item={artist} />
                {artist.spotifyUrl && (
                  <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">Open on Spotify ↗</a>
                )}
                <button type="button" onClick={() => toggleFavouriteArtist({ ...artist, type: 'artist' })}>
                  Remove favourite
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="universe-section" aria-labelledby="universe-discoveries-title">
        <div className="universe-section__heading">
          <div>
            <p className="text-meta text-meta--warm">Threads worth following</p>
            <h2 id="universe-discoveries-title">Saved discoveries</h2>
          </div>
          <span>{library.discoveries.length} {library.discoveries.length === 1 ? 'discovery' : 'discoveries'}</span>
        </div>
        {library.discoveries.length === 0 ? (
          <div className="universe-empty surface">
            <p>Save a discovery in Explore and it will be waiting here.</p>
            <Button variant="secondary" size="sm" href={routeHref('explore')}>Explore sounds</Button>
          </div>
        ) : (
          <div className="universe-discoveries">
            {library.discoveries.map((item) => (
              <article className="universe-discovery surface" key={`${item.type}-${item.id}`}>
                <ItemArtwork item={item} label={`Artwork for ${item.title}`} />
                <div className="universe-item__details">
                  <span className="universe-source">{item.type === 'artist' ? 'Artist' : 'Track'}</span>
                  <h3>{item.title}</h3>
                  <p>{item.type === 'artist' ? item.subtitle : item.artistName}</p>
                </div>
                {item.spotifyUrl && (
                  <a href={item.spotifyUrl} target="_blank" rel="noopener noreferrer">Open ↗</a>
                )}
                <button type="button" onClick={() => toggleDiscovery(item)}>Remove</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="universe-section" aria-labelledby="universe-playlists-title">
        <div className="universe-section__heading">
          <div>
            <p className="text-meta text-meta--warm">Gathered by you</p>
            <h2 id="universe-playlists-title">Your playlists</h2>
          </div>
          <span>{library.playlists.length} {library.playlists.length === 1 ? 'playlist' : 'playlists'}</span>
        </div>

        <form className="universe-playlist-form" onSubmit={submitPlaylist}>
          <label htmlFor="universe-playlist-name">Create a playlist</label>
          <div>
            <input
              id="universe-playlist-name"
              type="text"
              value={playlistName}
              maxLength={50}
              onChange={(event) => {
                setPlaylistName(event.target.value);
                setPlaylistMessage('');
              }}
              placeholder="A name for this collection"
            />
            <Button type="submit" variant="primary" size="sm">Create playlist</Button>
          </div>
          {playlistMessage && <p role="status">{playlistMessage}</p>}
        </form>

        {library.playlists.length === 0 ? (
          <div className="universe-empty surface">
            <p>Make a playlist around a mood, a moment or a sound you want to return to.</p>
          </div>
        ) : (
          <div className="universe-playlists">
            {library.playlists.map((playlist) => {
              const playlistTracks = playlist.trackIds
                .map((trackId) => library.savedTracks.find((track) => track.id === trackId))
                .filter(Boolean);
              const availableTracks = library.savedTracks.filter((track) => !playlist.trackIds.includes(track.id));

              return (
                <article className="universe-playlist surface" key={playlist.id}>
                  <div className="universe-playlist__heading">
                    <div>
                      <p className="text-meta text-meta--warm">ASTRA · PERSONAL COLLECTION</p>
                      <h3>{playlist.name}</h3>
                      <p>{playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'}</p>
                    </div>
                    <button type="button" onClick={() => removePlaylist(playlist.id)}>Delete playlist</button>
                  </div>
                  {playlistTracks.length > 0 && (
                    <ul className="universe-playlist__tracks">
                      {playlistTracks.map((track) => (
                        <li key={track.id}>
                          <span>{track.title} <small>— {track.artistName}</small></span>
                          <button
                            type="button"
                            onClick={() => togglePlaylistTrack(playlist.id, track.id)}
                            aria-label={`Remove ${track.title} from ${playlist.name}`}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {availableTracks.length > 0 ? (
                    <label className="universe-playlist__add">
                      Add a saved track
                      <select
                        value=""
                        onChange={(event) => {
                          if (event.target.value) togglePlaylistTrack(playlist.id, event.target.value);
                        }}
                      >
                        <option value="">Choose a track</option>
                        {availableTracks.map((track) => (
                          <option key={track.id} value={track.id}>{track.title} — {track.artistName}</option>
                        ))}
                      </select>
                    </label>
                  ) : library.savedTracks.length === 0 ? (
                    <p className="universe-playlist__empty">Save a track first, then add it to this playlist.</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
