/*
 * Account service: the Spotify login session, held by the ASTRA API.
 *
 * Logging in is a full-page redirect through Spotify (LOGIN_URL); the API
 * keeps the tokens and gives the browser only an HttpOnly session cookie.
 * Development Mode allows the app owner plus up to 5 allowlisted users.
 */

export const LOGIN_URL = '/api/auth/login';

const API_TIMEOUT_MS = 8000;

/**
 * @returns {Promise<
 *   | { status: 'connected', user: { id: string, displayName: string, imageUrl: string | null } }
 *   | { status: 'disconnected' }
 *   | { status: 'not-allowed' }
 * >}
 * 'not-allowed': logged in, but Spotify refuses the account because it isn't
 * on the app's Development Mode user list.
 */
export async function getAccount({ signal } = {}) {
  const timeout = AbortSignal.timeout(API_TIMEOUT_MS);
  try {
    const response = await fetch('/api/me', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (response.ok) {
      const data = await response.json();
      return { status: 'connected', user: data.user };
    }
    if (response.status === 403) return { status: 'not-allowed' };
  } catch (error) {
    if (error?.name === 'AbortError' && signal?.aborted) throw error;
    // API asleep or offline: offer Connect, which also wakes it.
  }
  return { status: 'disconnected' };
}

/**
 * The user's Spotify library: liked songs, followed artists and playlists.
 * Each section is { items, total, available }; available: false means
 * Spotify refused that part (Development Mode restrictions).
 * A sleeping API can take ~50s to wake, hence the longer timeout.
 *
 * @returns {Promise<
 *   | { status: 'connected', library: { likedTracks: object, followedArtists: object, playlists: object } }
 *   | { status: 'disconnected' }
 *   | { status: 'not-allowed' }
 *   | { status: 'unavailable' }
 * >}
 */
export async function getSpotifyLibrary({ signal } = {}) {
  const timeout = AbortSignal.timeout(60000);
  try {
    const response = await fetch('/api/me/library', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (response.ok) return { status: 'connected', library: await response.json() };
    if (response.status === 401) return { status: 'disconnected' };
    if (response.status === 403) return { status: 'not-allowed' };
  } catch (error) {
    if (error?.name === 'AbortError' && signal?.aborted) throw error;
  }
  return { status: 'unavailable' };
}

/** Fired on window after logging out, so open pages can update. */
export const ACCOUNT_CHANGED_EVENT = 'astra:account-changed';

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {
    // The session is dropped server-side anyway once it expires.
  }
  window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
}

/**
 * Reads and clears the ?auth=failed flag the API adds when a login is
 * cancelled or rejected, so a refresh doesn't show the message again.
 */
export function takeLoginFailure() {
  const url = new URL(window.location.href);
  if (url.searchParams.get('auth') !== 'failed') return false;
  url.searchParams.delete('auth');
  window.history.replaceState(window.history.state, '', url);
  return true;
}
