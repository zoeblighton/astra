import { useEffect, useState } from 'react';
import Navigation from './Navigation.jsx';
import SearchBar from '../ui/SearchBar.jsx';
import { IconButton } from '../ui/Button.jsx';
import { DEFAULT_ROUTE, routeHref } from '../../paths.js';
import './Header.css';

/*
 * Sticky app header: wordmark, navigation (desktop) and search.
 * On mobile, search lives behind a toggle to keep the header compact.
 */
export default function Header({ currentRoute }) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Close the mobile search panel when the page changes.
  useEffect(() => setSearchOpen(false), [currentRoute]);

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
            onSelect={() => setSearchOpen(false)}
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
