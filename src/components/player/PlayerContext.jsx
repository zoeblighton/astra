import { createContext, useContext, useMemo, useState } from 'react';

const PlayerContext = createContext(null);
const SPOTIFY_TRACK_PATH = /^https:\/\/open\.spotify\.com\/track\/([A-Za-z0-9]{22})(?:[/?#]|$)/;

function spotifyTrackUri(track) {
  if (!track?.spotifyUrl) return null;
  return track.spotifyUrl.match(SPOTIFY_TRACK_PATH)?.[1] ?? null;
}

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const currentTrack = queue[currentIndex] ?? null;

  function playTrack(track, tracks = []) {
    if (track?.type !== 'track') return;

    const spotifyTracks = tracks.filter((item) => item?.type === 'track' && spotifyTrackUri(item));
    const nextQueue = spotifyTracks.length > 0 ? spotifyTracks : [track];
    let nextIndex = nextQueue.findIndex((item) => item.id === track.id);

    if (nextIndex === -1) {
      nextQueue.push(track);
      nextIndex = nextQueue.length - 1;
    }

    setQueue(nextQueue);
    setCurrentIndex(nextIndex);
  }

  function clearPlayer() {
    setQueue([]);
    setCurrentIndex(-1);
  }

  function selectTrack(index) {
    if (index >= 0 && index < queue.length) setCurrentIndex(index);
  }

  const value = useMemo(() => ({
    currentTrack,
    currentIndex,
    queue,
    canGoPrevious: currentIndex > 0,
    canGoNext: currentIndex >= 0 && currentIndex < queue.length - 1,
    spotifyTrackId: spotifyTrackUri(currentTrack),
    playTrack,
    clearPlayer,
    previousTrack: () => selectTrack(currentIndex - 1),
    nextTrack: () => selectTrack(currentIndex + 1),
  }), [currentTrack, currentIndex, queue]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error('usePlayer must be used within a PlayerProvider.');
  return player;
}
