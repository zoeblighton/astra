/*
 * Catalogue service — the single seam between the UI and music data.
 *
 * Tries the ASTRA API (FastAPI → Spotify) first. If the API isn't running,
 * isn't configured, or errors, it falls back to the fictional sample data.
 * Every response says where it came from (`source`) so the UI can label it.
 */
import { artists, tracksWithArtists } from '../data/sampleData.js';

const API_TIMEOUT_MS = 5000;

async function apiGet(path, { signal } = {}) {
  const timeout = AbortSignal.timeout(API_TIMEOUT_MS);
  const response = await fetch(`/api${path}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) {
    const error = new Error(`API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// Distinguish "the caller cancelled" (stop quietly) from real failures (fall back).
const wasCancelled = (error, signal) => error?.name === 'AbortError' && signal?.aborted;

/* ------------------------------------------------------------- status */

/** @returns {Promise<'spotify'|'sample'>} */
export async function getCatalogueSource() {
  try {
    const status = await apiGet('/health');
    return status.spotifyConfigured ? 'spotify' : 'sample';
  } catch {
    return 'sample';
  }
}

/* ------------------------------------------------------------- search */

function searchSample(query, limit) {
  const q = query.toLowerCase();
  const matches = (...fields) => fields.some((f) => f?.toLowerCase().includes(q));

  const artistResults = artists
    .filter((a) => matches(a.name, a.genre, a.origin))
    .map((a) => ({ id: a.id, type: 'artist', title: a.name, subtitle: a.genre, artistName: a.name }));

  const trackResults = tracksWithArtists
    .filter((t) => matches(t.title, t.artistName, t.genre, t.mood))
    .map((t) => ({
      id: t.id,
      type: 'track',
      title: t.title,
      subtitle: `${t.artistName} · ${t.genre}`,
      artistName: t.artistName,
    }));

  return [...artistResults, ...trackResults].slice(0, limit);
}

/**
 * Search tracks and artists.
 * @returns {Promise<{ results: Array<{id, type, title, subtitle, artistName, imageUrl?, spotifyUrl?}>, source: 'spotify'|'sample' }>}
 */
export async function searchCatalogue(query, { limit = 6, signal } = {}) {
  const q = query.trim();
  if (!q) return { results: [], source: 'sample' };

  try {
    const data = await apiGet(`/search?q=${encodeURIComponent(q)}&limit=${limit}`, { signal });
    return { results: data.results, source: 'spotify' };
  } catch (error) {
    if (wasCancelled(error, signal)) throw error;
    return { results: searchSample(q, limit), source: 'sample' };
  }
}
