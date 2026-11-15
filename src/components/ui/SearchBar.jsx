import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Avatar from './Avatar.jsx';
import { searchCatalogue } from '../../services/catalogue.js';
import './SearchBar.css';

/*
 * Search bar with live results (design/ui-components.png).
 * Implements the ARIA combobox pattern: arrow keys move through results,
 * Enter selects, Escape closes, and the result count is announced.
 */
export default function SearchBar({
  placeholder = 'Search artists, tracks, genres',
  label = 'Search the catalogue',
  autoFocus = false,
  onSelect,
  onDismiss,
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('sample');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const inputRef = useRef(null);
  const inputId = useId();
  const listId = useId();
  const optionId = (i) => `${listId}-option-${i}`;

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Debounced search. Each new keystroke aborts the previous request, so a
  // slow, stale response can never overwrite newer results.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { results: found, source: from } = await searchCatalogue(q, { signal: controller.signal });
        setResults(found);
        setSource(from);
        setActive(-1);
        setLoading(false);
      } catch {
        // Aborted by a newer search: ignore.
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const showPanel = open && hasQuery;
  const showList = showPanel && results.length > 0;

  function choose(item) {
    setQuery(item.title);
    setOpen(false);
    setActive(-1);
    onSelect?.(item);
  }

  function clear() {
    setQuery('');
    setResults([]);
    setActive(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOpen(true);
        if (results.length) setActive((i) => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (results.length) setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
        break;
      case 'Enter':
        if (showList && active >= 0) {
          e.preventDefault();
          choose(results[active]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (showPanel) setOpen(false);
        else if (query) clear();
        else onDismiss?.();
        break;
      default:
    }
  }

  return (
    <div className={`search ${className}`} role="search">
      <label htmlFor={inputId} className="visually-hidden">
        {label}
      </label>

      <div className="search__field">
        <Icon name="search" className="search__icon" />
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          className="search__input"
          placeholder={placeholder}
          value={query}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="search__clear"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      <div className="search__panel" hidden={!showPanel}>
        <ul id={listId} role="listbox" aria-label="Search results" className="search__results" hidden={!showList}>
          {results.map((item, i) => (
            <li
              key={item.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              className={`search__option${i === active ? ' is-active' : ''}`}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(item)}
            >
              <Avatar name={item.artistName} size="sm" />
              <span className="search__text">
                <span className="search__title">{item.title}</span>
                <span className="search__subtitle">{item.subtitle}</span>
              </span>
              <span className="search__type">{item.type}</span>
            </li>
          ))}
        </ul>

        {!showList && (
          <p className="search__empty">
            {loading ? 'Searching…' : `No matches for “${query.trim()}”`}
          </p>
        )}
        <p className="search__note">{source === 'spotify' ? 'Results from Spotify' : 'Sample catalogue'}</p>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {showPanel && !loading ? `${results.length} result${results.length === 1 ? '' : 's'} available` : ''}
      </p>
    </div>
  );
}
