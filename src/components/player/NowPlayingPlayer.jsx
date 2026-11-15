import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { usePlayer } from './PlayerContext.jsx';
import './NowPlayingPlayer.css';

function releaseAudioCapture(capture) {
  if (!capture) return;

  cancelAnimationFrame(capture.frameId);
  capture.stream.getTracks().forEach((track) => {
    track.removeEventListener('ended', capture.onTrackEnded);
    if (track.readyState === 'live') track.stop();
  });
  capture.planet?.style.removeProperty('--audio-low');
  capture.planet?.style.removeProperty('--audio-mid');
  capture.planet?.style.removeProperty('--audio-high');
  capture.source.disconnect();
  capture.analyser.disconnect();
  capture.context.close().catch((error) => {
    console.error('Unable to close the visualiser audio context.', error);
  });
}

function bandLevel(data, start, end) {
  let total = 0;
  for (let index = start; index < end; index += 1) total += data[index];
  return end > start ? total / (end - start) / 255 : 0;
}

export default function NowPlayingPlayer() {
  const {
    currentTrack,
    currentIndex,
    queue,
    canGoPrevious,
    canGoNext,
    spotifyTrackId,
    previousTrack,
    nextTrack,
    clearPlayer,
  } = usePlayer();
  const playerRef = useRef(null);
  const planetRef = useRef(null);
  const captureRef = useRef(null);
  const dragRef = useRef(null);
  const [captureState, setCaptureState] = useState('off');
  const [captureMessage, setCaptureMessage] = useState('');
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  function clampPosition(left, top) {
    const player = playerRef.current;
    if (!player) return { x: left, y: top };

    const margin = 8;
    return {
      x: Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - player.offsetWidth - margin)),
      y: Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - player.offsetHeight - margin)),
    };
  }

  function startDragging(event) {
    if (event.button !== 0) return;

    event.preventDefault();
    const bounds = playerRef.current.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: bounds.left,
      top: bounds.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function dragPlayer(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setPosition(clampPosition(
      drag.left + event.clientX - drag.pointerX,
      drag.top + event.clientY - drag.pointerY,
    ));
  }

  function stopDragging() {
    dragRef.current = null;
    setIsDragging(false);
  }

  function moveWithKeyboard(event) {
    const offsets = {
      ArrowUp: [0, -16],
      ArrowDown: [0, 16],
      ArrowLeft: [-16, 0],
      ArrowRight: [16, 0],
    };
    const offset = offsets[event.key];
    if (!offset) return;

    event.preventDefault();
    const bounds = playerRef.current.getBoundingClientRect();
    setPosition(clampPosition(
      (position?.x ?? bounds.left) + offset[0],
      (position?.y ?? bounds.top) + offset[1],
    ));
  }

  useEffect(() => () => {
    releaseAudioCapture(captureRef.current);
    captureRef.current = null;
  }, []);

  useEffect(() => {
    if (!position) return undefined;

    function keepPlayerInView() {
      const bounds = playerRef.current.getBoundingClientRect();
      setPosition(clampPosition(bounds.left, bounds.top));
    }

    window.addEventListener('resize', keepPlayerInView);
    return () => window.removeEventListener('resize', keepPlayerInView);
  }, [position]);

  async function startAudioCapture() {
    setCaptureMessage('Choose the Spotify tab and enable its audio-sharing option.');

    if (!navigator.mediaDevices?.getDisplayMedia || !window.AudioContext) {
      setCaptureMessage('Tab audio visualisation is not supported by this browser. Try a current version of Chrome or Edge over HTTPS.');
      return;
    }

    setCaptureState('starting');

    let stream;
    let context;

    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        setCaptureState('off');
        setCaptureMessage('No tab audio was shared. Choose the Spotify tab and enable its audio-sharing option.');
        return;
      }

      context = new window.AudioContext();
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);

      const capture = {
        stream,
        context,
        source,
        analyser,
        planet: planetRef.current,
        data: new Uint8Array(analyser.frequencyBinCount),
        frameId: 0,
        onTrackEnded: null,
      };

      function updateVisualiser() {
        analyser.getByteFrequencyData(capture.data);
        const count = capture.data.length;
        const low = bandLevel(capture.data, 0, Math.floor(count * 0.12));
        const mid = bandLevel(capture.data, Math.floor(count * 0.12), Math.floor(count * 0.48));
        const high = bandLevel(capture.data, Math.floor(count * 0.48), count);

        if (planetRef.current) {
          capture.planet?.style.setProperty('--audio-low', low.toFixed(3));
          capture.planet?.style.setProperty('--audio-mid', mid.toFixed(3));
          capture.planet?.style.setProperty('--audio-high', high.toFixed(3));
        }

        capture.frameId = requestAnimationFrame(updateVisualiser);
      }

      capture.onTrackEnded = () => {
        if (captureRef.current !== capture) return;
        releaseAudioCapture(capture);
        captureRef.current = null;
        setCaptureState('off');
        setCaptureMessage('Tab audio sharing has ended.');
      };

      captureRef.current = capture;
      stream.getTracks().forEach((track) => track.addEventListener('ended', capture.onTrackEnded));
      setCaptureState('active');
      setCaptureMessage('Visualiser connected to shared tab audio.');
      updateVisualiser();
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (context && context.state !== 'closed') {
        await context.close().catch((closeError) => {
          console.error('Unable to close the visualiser audio context.', closeError);
        });
      }
      setCaptureState('off');
      setCaptureMessage(
        error.name === 'AbortError'
          ? 'Tab sharing was cancelled.'
          : `Could not start audio visualisation: ${error.message}`,
      );
    }
  }

  function stopAudioCapture() {
    releaseAudioCapture(captureRef.current);
    captureRef.current = null;
    setCaptureState('off');
    setCaptureMessage('Audio visualisation stopped.');
  }

  if (!currentTrack) return null;

  const isSpotifyTrack = Boolean(spotifyTrackId && currentTrack.spotifyUrl);
  const title = currentTrack.title || 'Untitled track';
  const artist = currentTrack.artistName || 'Unknown artist';
  const bars = Array.from({ length: 24 }, (_, index) => {
    const band = index % 3 === 0 ? 'low' : index % 3 === 1 ? 'mid' : 'high';
    return (
      <span
        key={index}
        className={`now-playing__spectrum-bar now-playing__spectrum-bar--${band}`}
        style={{ '--bar-angle': `${index * 15}deg` }}
      />
    );
  });

  return (
    <aside
      ref={playerRef}
      className={`now-playing${isDragging ? ' now-playing--dragging' : ''}`}
      style={position ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' } : undefined}
      aria-label="Now playing"
    >
      <div
        ref={planetRef}
        className={`now-playing__planet${captureState === 'active' ? ' now-playing__planet--reactive' : ''}`}
        aria-label={`${title} by ${artist}`}
      >
        <div className="now-playing__glass" aria-hidden="true" />
        <div className="now-playing__orbit now-playing__orbit--outer" aria-hidden="true" />
        <div className="now-playing__orbit now-playing__orbit--tilted" aria-hidden="true" />
        <div className="now-playing__orbit now-playing__orbit--inner" aria-hidden="true" />

        <div className="now-playing__topline">
          <button
            type="button"
            className="now-playing__drag-handle"
            aria-label="Move player. Drag to reposition, or use the arrow keys."
            title="Drag to move · arrow keys to reposition"
            onPointerDown={startDragging}
            onPointerMove={dragPlayer}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            onLostPointerCapture={stopDragging}
            onKeyDown={moveWithKeyboard}
          >
            <span className="now-playing__drag-grip" aria-hidden="true">⠿</span>
            <span className="now-playing__eyebrow">NOW PLAYING</span>
          </button>
          <IconButton
            icon="close"
            size="sm"
            label="Close player"
            onClick={() => {
              stopAudioCapture();
              clearPlayer();
            }}
          />
        </div>

        <div className="now-playing__metadata" aria-live="polite">
          <p className="now-playing__title" title={title}>{title}</p>
          <p className="now-playing__artist" title={artist}>{artist}</p>
          {isSpotifyTrack ? (
            <a className="now-playing__source" href={currentTrack.spotifyUrl} target="_blank" rel="noopener noreferrer">
              Spotify <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="now-playing__source">ASTRA SAMPLE</span>
          )}
        </div>

        <div className="now-playing__visualiser-core" aria-hidden="true">
          <div className="now-playing__spectrum" aria-hidden="true">{bars}</div>
          <div className="now-playing__lens" aria-hidden="true" />
        </div>

        <div className="now-playing__queue-count" aria-label={`Track ${currentIndex + 1} of ${queue.length}`}>
          {String(currentIndex + 1).padStart(2, '0')} <span>/</span> {String(queue.length).padStart(2, '0')}
        </div>

        <div className="now-playing__controls">
          <IconButton
            icon="skipBack"
            size="sm"
            label="Previous track"
            onClick={previousTrack}
            disabled={!canGoPrevious}
          />
          {isSpotifyTrack ? (
            <a
              className="now-playing__launch"
              href={currentTrack.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${title} by ${artist} on Spotify`}
              title={`Open ${title} on Spotify`}
            >
              <Icon name="play" size={22} />
            </a>
          ) : (
            <IconButton
              icon="play"
              variant="primary"
              label="Sample tracks cannot be played"
              className="now-playing__launch"
              disabled
            />
          )}
          <IconButton
            icon="skipForward"
            size="sm"
            label="Next track"
            onClick={nextTrack}
            disabled={!canGoNext}
          />
        </div>

        <button
          type="button"
          className={`now-playing__visualiser-toggle${captureState === 'active' ? ' is-active' : ''}`}
          aria-label={!isSpotifyTrack
            ? 'Audio visualiser is unavailable for sample tracks'
            : captureState === 'active' ? 'Stop audio visualiser' : 'Share Spotify tab audio for visualiser'}
          aria-describedby="now-playing-visualiser-help"
          aria-pressed={captureState === 'active'}
          title={captureMessage || (!isSpotifyTrack
            ? 'Audio visualiser is unavailable for sample tracks'
            : captureState === 'active' ? 'Stop audio visualiser' : 'Share Spotify tab audio for visualiser')}
          onClick={captureState === 'active' ? stopAudioCapture : startAudioCapture}
          disabled={!isSpotifyTrack || captureState === 'starting'}
        >
          <Icon name="visualiser" size={18} />
          <span className="now-playing__visualiser-label">
            {!isSpotifyTrack
              ? 'SAMPLE'
              : captureState === 'active' ? 'LIVE' : captureState === 'starting' ? 'CONNECTING' : 'VISUALISE'}
          </span>
        </button>
        <p id="now-playing-visualiser-help" className="visually-hidden">
          Choose the Spotify tab and enable audio sharing. Audio is analysed in this browser and is not recorded or uploaded.
        </p>
        <p className="visually-hidden" role="status" aria-live="polite">
          {captureMessage}
        </p>
      </div>
    </aside>
  );
}
