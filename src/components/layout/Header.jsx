import { useEffect, useState } from 'react';
import Navigation from './Navigation.jsx';
import SearchBar from '../ui/SearchBar.jsx';
import { IconButton } from '../ui/Button.jsx';
import { usePlayer } from '../player/PlayerContext.jsx';
import { DEFAULT_ROUTE, routeHref } from '../../paths.js';
import './Header.css';

/*
 * Sticky app header: wordmark, navigation (desktop) and search.
 * On mobile, search lives behind a toggle to keep the header compact.
 */
export default function Header({ currentRoute }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { playTrack } = usePlayer();

  // Close the mobile search panel when the page changes.
  useEffect(() => setSearchOpen(false), [currentRoute]);

  function handleSearchSelect(item) {
    if (item.type === 'track') {
      playTrack(item);
      setSearchOpen(false);
      return true;
    }

    if (item.type === 'artist' && item.spotifyUrl) {
      window.open(item.spotifyUrl, '_blank', 'noopener,noreferrer');
      setSearchOpen(false);
      return true;
    }

    return false;
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <a href={routeHref(DEFAULT_ROUTE)} className="header__brand">
          ASTRA
        </a>

        <Navigation currentRoute={currentRoute} />

        <div className={`header__search${searchOpen ? ' is-open' : ''}`}>
          <SearchBar
            autoFocus={searchOpen}
            onSelect={handleSearchSelect}
            onDismiss={() => setSearchOpen(false)}
          />
        </div>

        <IconButton
          className="header__search-toggle"
          icon={searchOpen ? 'close' : 'search'}
          label={searchOpen ? 'Close search' : 'Open search'}
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        />
      </div>
    </header>
  );
}
