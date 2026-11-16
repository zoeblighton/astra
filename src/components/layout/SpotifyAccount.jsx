import { useEffect, useId, useRef, useState } from 'react';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import { LOGIN_URL, getAccount, logout, takeLoginFailure } from '../../services/account.js';
import './SpotifyAccount.css';

const NOTE_MS = 7000;

/*
 * Header control for the optional Spotify login: "Connect Spotify" when
 * logged out, the user's initial and name (with a Disconnect menu) when in.
 * The rest of ASTRA works without logging in.
 */
export default function SpotifyAccount() {
  const [account, setAccount] = useState({ status: 'checking' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [note, setNote] = useState(null);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    const controller = new AbortController();
    if (takeLoginFailure()) setNote('Couldn’t connect to Spotify. Please try again.');

    getAccount({ signal: controller.signal })
      .then((result) => {
        setAccount(result);
        if (result.status === 'not-allowed') {
          setNote('This Spotify account isn’t on ASTRA’s access list yet.');
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!note) return undefined;
    const id = setTimeout(() => setNote(null), NOTE_MS);
    return () => clearTimeout(id);
  }, [note]);

  // Close the menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function handleDisconnect() {
    setMenuOpen(false);
    await logout();
    setAccount({ status: 'disconnected' });
  }

  // Avoid flashing "Connect" for people who are already logged in.
  if (account.status === 'checking') {
    return <div className="spotify-account" aria-hidden="true" />;
  }

  const connected = account.status === 'connected';
  const name = connected ? account.user.displayName : '';

  return (
    <div className="spotify-account" ref={rootRef}>
      {connected ? (
        <>
          <button
            type="button"
            className="spotify-account__trigger"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Avatar name={name} size="sm" />
            <span className="spotify-account__name">{name}</span>
            <span className="visually-hidden">, Spotify account menu</span>
          </button>

          {menuOpen && (
            <div className="spotify-account__menu" id={menuId}>
              <p className="spotify-account__label">Connected to Spotify</p>
              <p className="spotify-account__user">{name}</p>
              <Button variant="secondary" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          )}
        </>
      ) : (
        <Button variant="secondary" size="sm" href={LOGIN_URL} className="spotify-account__connect">
          Connect Spotify
        </Button>
      )}

      {note && (
        <p className="spotify-account__note" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
