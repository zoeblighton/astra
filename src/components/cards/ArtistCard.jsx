import { useState } from 'react';
import Artwork from '../ui/Artwork.jsx';
import Button from '../ui/Button.jsx';
import { formatCount } from '../../utils/format.js';
import './ArtistCard.css';

/*
 * Artist card: round planetary artwork, name, genre and a follow toggle.
 * Follow state is local for now; it moves to the user's library in Stage 7.
 */
export default function ArtistCard({ artist, onSelect, defaultFollowing = false, className = '' }) {
  const { id, name, genre, monthlyListeners } = artist;
  const [following, setFollowing] = useState(defaultFollowing);

  return (
    <article className={`artist-card ${className}`}>
      <div className="artist-card__art">
        <Artwork seed={id} shape="round" />
      </div>

      <h3 className="artist-card__name">
        {onSelect ? (
          <button type="button" className="artist-card__link" onClick={() => onSelect(artist)}>
            {name}
          </button>
        ) : (
          name
        )}
      </h3>
      <p className="artist-card__genre">{genre}</p>
      {monthlyListeners != null && (
        <p className="artist-card__listeners">{formatCount(monthlyListeners)} listeners</p>
      )}

      <Button
        variant="secondary"
        size="sm"
        icon={following ? 'check' : 'plus'}
        aria-pressed={following}
        className="artist-card__follow"
        onClick={() => setFollowing((f) => !f)}
      >
        {following ? 'Following' : 'Follow'}
        <span className="visually-hidden"> {name}</span>
      </Button>
    </article>
  );
}
