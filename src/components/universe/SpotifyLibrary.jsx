import { useCallback, useEffect, useState } from 'react';
import Artwork from '../ui/Artwork.jsx';
import Button from '../ui/Button.jsx';
import { usePlayer } from '../player/PlayerContext.jsx';
import { ACCOUNT_CHANGED_EVENT, LOGIN_URL, getSpotifyLibrary } from '../../services/account.js';
import './SpotifyLibrary.css';

const LIKED_SONGS_URL = 'https://open.spotify.com/collection/tracks';

/* Square artwork for tracks and playlists (Spotify artwork is never cropped), round for artists. */
function Cover({ item, round = false }) {
  const className = `spotify-library__cover${round ? ' spotify-library__cover--round' : ''}`;
  return item.imageUrl ? (
    <img className={className} src={item.imageUrl} alt="" loading="lazy" />
  ) : (
    <Artwork seed={item.id} shape={round ? 'round' : 'square'} className={className} />
  );
}

function GroupHeading({ id, title, section, noun, link }) {
  const shown = section.items.length;
  return (
    <div className="spotify-library__group-heading">
      <h3 id={id}>{title}</h3>
      {section.available && shown > 0 && (
        <span>
          {section.total > shown ? `${shown} of ${section.total}` : shown} {noun}
          {link && (
            <>
              {' · '}
              <a href={link} target="_blank" rel="noopener noreferrer">All on Spotify ↗</a>
            </>
          )}
        </span>
      )}
    </div>
  );
}

function Unavailable({ section, empty }) {
  if (!section.available) {
    return <p className="spotify-library__note">Spotify doesn’t share this with ASTRA at the moment.</p>;
  }
  return section.items.length === 0 ? <p className="spotify-library__note">{empty}</p> : null;
}

/*
 * "Your Spotify library" in My Universe: the logged-in user's liked songs,
 * followed artists and playlists, read live from Spotify. Read-only: ASTRA's
 * own saved items stay in the browser library below.
 */
export default function SpotifyLibrary() {
  const [state, setState] = useState({ status: 'checking' });
  const { playTrack } = usePlayer();

  const load = useCallback((signal) => {
    setState({ status: 'checking' });
    getSpotifyLibrary({ signal }).then(setState).catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const onAccountChange = () => setState({ status: 'disconnected' });
    window.addEventListener(ACCOUNT_CHANGED_EVENT, onAccountChange);
    return () => {
      controller.abort();
      window.removeEventListener(ACCOUNT_CHANGED_EVENT, onAccountChange);
    };
  }, [load]);

  const { status } = state;
  const library = state.library;

  return (
    <section className="universe-section spotify-library" aria-labelledby="spotify-library-title" aria-busy={status === 'checking'}>
      <div className="universe-section__heading">
        <div>
          <p className="text-meta text-meta--warm">From Spotify</p>
          <h2 id="spotify-library-title">Your Spotify library</h2>
        </div>
        {status === 'connected' && <span className="universe-source universe-source--spotify">Live from Spotify</span>}
      </div>

      {status === 'checking' && (
        <div className="universe-empty surface" role="status">
          <p>Gathering your Spotify library…</p>
        </div>
      )}

      {status === 'disconnected' && (
        <div className="universe-empty surface">
          <p>Connect Spotify to bring your liked songs, artists and playlists into your universe.</p>
          <Button variant="primary" size="sm" href={LOGIN_URL}>Connect Spotify</Button>
        </div>
      )}

      {status === 'not-allowed' && (
        <div className="universe-empty surface">
          <p>This Spotify account isn’t on ASTRA’s access list yet, so Spotify won’t share its library.</p>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="universe-empty surface">
          <p>Your Spotify library couldn’t load just now.</p>
          <Button variant="secondary" size="sm" onClick={() => load()}>Try again</Button>
        </div>
      )}

      {status === 'connected' && (
        <>
          <div className="spotify-library__group" role="group" aria-labelledby="spotify-liked-title">
            <GroupHeading
              id="spotify-liked-title"
              title="Liked songs"
              section={library.likedTracks}
              noun="songs"
              link={LIKED_SONGS_URL}
            />
            <Unavailable section={library.likedTracks} empty="Songs you like on Spotify will appear here." />
            {library.likedTracks.items.length > 0 && (
              <div className="universe-list">
                {library.likedTracks.items.map((track) => (
                  <article className="universe-item spotify-library__track" key={track.id}>
                    <Cover item={track} />
                    <div className="universe-item__details">
                      <h3>{track.title}</h3>
                      <p>{track.subtitle}</p>
                    </div>
                    <div className="universe-item__actions">
                      <button type="button" onClick={() => playTrack(track, library.likedTracks.items)}>
                        Play<span className="visually-hidden"> {track.title}</span>
                      </button>
                      <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer">Open on Spotify ↗</a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="spotify-library__group" role="group" aria-labelledby="spotify-artists-title">
            <GroupHeading id="spotify-artists-title" title="Artists you follow" section={library.followedArtists} noun="artists" />
            <Unavailable section={library.followedArtists} empty="Artists you follow on Spotify will appear here." />
            {library.followedArtists.items.length > 0 && (
              <div className="universe-artists">
                {library.followedArtists.items.map((artist) => (
                  <article className="universe-artist surface" key={artist.id}>
                    <Cover item={artist} round />
                    <h3>{artist.title}</h3>
                    <p>{artist.subtitle}</p>
                    <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">Open on Spotify ↗</a>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="spotify-library__group" role="group" aria-labelledby="spotify-playlists-title">
            <GroupHeading id="spotify-playlists-title" title="Your playlists" section={library.playlists} noun="playlists" />
            <Unavailable section={library.playlists} empty="Playlists you make or save on Spotify will appear here." />
            {library.playlists.items.length > 0 && (
              <div className="spotify-library__playlists">
                {library.playlists.items.map((playlist) => (
                  <a
                    className="spotify-library__playlist surface"
                    key={playlist.id}
                    href={playlist.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Cover item={playlist} />
                    <span className="spotify-library__playlist-title">{playlist.title}</span>
                    <span className="spotify-library__playlist-meta">
                      {playlist.trackCount != null && `${playlist.trackCount} ${playlist.trackCount === 1 ? 'track' : 'tracks'}`}
                      {playlist.trackCount != null && playlist.ownerName && ' · '}
                      {playlist.ownerName}
                    </span>
                    <span className="visually-hidden"> (opens on Spotify)</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
