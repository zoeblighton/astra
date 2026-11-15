import Avatar from '../ui/Avatar.jsx';
import Artwork from '../ui/Artwork.jsx';
import { IconButton } from '../ui/Button.jsx';
import { formatDuration } from '../../utils/format.js';
import './MusicCard.css';

/*
 * Music card for a single track.
 *  layout="row"  → design/ui-components.png: avatar, title + artist, artwork right
 *  layout="tile" → artwork on top, for grids and carousels
 *
 * The title is the card's one interactive element (when onSelect is given);
 * a stretched pseudo-element makes the whole card clickable.
 */
export default function MusicCard({ track, layout = 'row', onSelect, onPlay, className = '' }) {
  const { id, title, artistName, genre, duration } = track;

  const titleContent = onSelect ? (
    <button type="button" className="music-card__link" onClick={() => onSelect(track)}>
      {title}
    </button>
  ) : (
    title
  );

  if (layout === 'tile') {
    return (
      <article className={`music-card music-card--tile ${className}`}>
        <div className="music-card__art">
          <Artwork seed={id} />
          {onPlay && (
            <IconButton
              icon="play"
              variant="primary"
              label={`Play ${title} by ${artistName}`}
              className="music-card__play"
              onClick={() => onPlay(track)}
            />
          )}
        </div>
        <div className="music-card__body">
          <h3 className="music-card__title">{titleContent}</h3>
          <p className="music-card__artist">{artistName}</p>
          <p className="music-card__meta">
            <span>{genre}</span>
            {duration != null && <span>{formatDuration(duration)}</span>}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={`music-card music-card--row ${className}`}>
      <Avatar name={artistName} />
      <div className="music-card__body">
        <h3 className="music-card__title">{titleContent}</h3>
        <p className="music-card__artist">{artistName}</p>
      </div>
      <div className="music-card__art">
        <Artwork seed={id} />
      </div>
    </article>
  );
}
