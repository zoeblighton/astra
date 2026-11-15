import { createContext, useContext, useRef, useState } from 'react';

const STORAGE_KEY = 'astra-universe-library-v1';
const EMPTY_LIBRARY = {
  savedTracks: [],
  favouriteArtists: [],
  discoveries: [],
  playlists: [],
};
const UniverseContext = createContext(null);

function isSavedItem(item, type) {
  return item
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && item.type === type;
}

function readLibrary() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { library: EMPTY_LIBRARY, error: '' };

    const parsed = JSON.parse(stored);
    if (parsed.version !== 1 || !parsed.library || typeof parsed.library !== 'object') {
      return { library: EMPTY_LIBRARY, error: 'Your saved Universe could not be recognised. You can start a new library below.' };
    }

    const library = parsed.library;
    return {
      library: {
        savedTracks: Array.isArray(library.savedTracks)
          ? library.savedTracks.filter((item) => isSavedItem(item, 'track'))
          : [],
        favouriteArtists: Array.isArray(library.favouriteArtists)
          ? library.favouriteArtists.filter((item) => isSavedItem(item, 'artist'))
          : [],
        discoveries: Array.isArray(library.discoveries)
          ? library.discoveries.filter((item) =>
            ['track', 'artist'].includes(item.type) && isSavedItem(item, item.type))
          : [],
        playlists: Array.isArray(library.playlists)
          ? library.playlists.filter((playlist) =>
            typeof playlist.id === 'string'
            && typeof playlist.name === 'string'
            && Array.isArray(playlist.trackIds)
            && playlist.trackIds.every((trackId) => typeof trackId === 'string'))
          : [],
      },
      error: '',
    };
  } catch {
    return { library: EMPTY_LIBRARY, error: 'Your saved Universe could not be read from this browser.' };
  }
}

function cleanItem(item, type) {
  return {
    id: String(item.id),
    type,
    title: item.title,
    artistName: item.artistName || '',
    subtitle: item.subtitle || '',
    imageUrl: item.imageUrl || '',
    spotifyUrl: item.spotifyUrl || '',
  };
}

export function UniverseProvider({ children }) {
  const [initialState] = useState(readLibrary);
  const libraryRef = useRef(initialState.library);
  const [library, setLibrary] = useState(initialState.library);
  const [storageMessage, setStorageMessage] = useState(initialState.error);

  function updateLibrary(update) {
    const nextLibrary = update(libraryRef.current);
    libraryRef.current = nextLibrary;
    setLibrary(nextLibrary);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, library: nextLibrary }));
      setStorageMessage('');
    } catch {
      setStorageMessage('Your changes are available for this visit, but could not be saved in this browser.');
    }
  }

  function toggleSavedTrack(item) {
    if (item?.type !== 'track' || !item.id || !item.title) return;
    const savedTrack = cleanItem(item, 'track');
    updateLibrary((current) => {
      const alreadySaved = current.savedTracks.some((track) => track.id === savedTrack.id);
      return {
        ...current,
        savedTracks: alreadySaved
          ? current.savedTracks.filter((track) => track.id !== savedTrack.id)
          : [savedTrack, ...current.savedTracks],
        playlists: alreadySaved
          ? current.playlists.map((playlist) => ({
            ...playlist,
            trackIds: playlist.trackIds.filter((trackId) => trackId !== savedTrack.id),
          }))
          : current.playlists,
      };
    });
  }

  function toggleFavouriteArtist(item) {
    if (item?.type !== 'artist' || !item.id || !item.title) return;
    const artist = cleanItem(item, 'artist');
    updateLibrary((current) => ({
      ...current,
      favouriteArtists: current.favouriteArtists.some((saved) => saved.id === artist.id)
        ? current.favouriteArtists.filter((saved) => saved.id !== artist.id)
        : [artist, ...current.favouriteArtists],
    }));
  }

  function toggleDiscovery(item) {
    if (!['track', 'artist'].includes(item?.type) || !item.id || !item.title) return;
    const discovery = cleanItem(item, item.type);
    updateLibrary((current) => ({
      ...current,
      discoveries: current.discoveries.some((saved) => saved.id === discovery.id && saved.type === discovery.type)
        ? current.discoveries.filter((saved) => saved.id !== discovery.id || saved.type !== discovery.type)
        : [discovery, ...current.discoveries],
    }));
  }

  function createPlaylist(name) {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    if (libraryRef.current.playlists.some((playlist) => playlist.name.toLowerCase() === trimmedName.toLowerCase())) {
      return false;
    }

    updateLibrary((current) => ({
      ...current,
      playlists: [{ id: `playlist-${Date.now()}`, name: trimmedName, trackIds: [] }, ...current.playlists],
    }));
    return true;
  }

  function removePlaylist(playlistId) {
    updateLibrary((current) => ({
      ...current,
      playlists: current.playlists.filter((playlist) => playlist.id !== playlistId),
    }));
  }

  function togglePlaylistTrack(playlistId, trackId) {
    if (!libraryRef.current.savedTracks.some((track) => track.id === trackId)) return;
    updateLibrary((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        const containsTrack = playlist.trackIds.includes(trackId);
        return {
          ...playlist,
          trackIds: containsTrack
            ? playlist.trackIds.filter((id) => id !== trackId)
            : [...playlist.trackIds, trackId],
        };
      }),
    }));
  }

  return (
    <UniverseContext.Provider value={{
      library,
      storageMessage,
      toggleSavedTrack,
      toggleFavouriteArtist,
      toggleDiscovery,
      createPlaylist,
      removePlaylist,
      togglePlaylistTrack,
    }}>
      {children}
    </UniverseContext.Provider>
  );
}

export function useUniverse() {
  const universe = useContext(UniverseContext);
  if (!universe) throw new Error('useUniverse must be used within a UniverseProvider.');
  return universe;
}
