import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { usePlayer } from './PlayerContext.jsx';
import './NowPlayingPlayer.css';

let spotifyIframeApiPromise;

function loadSpotifyIframeApi() {
  if (!spotifyIframeApiPromise) {
    spotifyIframeApiPromise = new Promise((resolve, reject) => {
      const previousCallback = window.onSpotifyIframeApiReady;
      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      script.onerror = () => {
        window.onSpotifyIframeApiReady = previousCallback;
        reject(new Error('Spotify’s playback controls could not be loaded.'));
      };
      window.onSpotifyIframeApiReady = (api) => {
        window.onSpotifyIframeApiReady = previousCallback;
        try {
          previousCallback?.(api);
          resolve(api);
        } catch (error) {
          reject(error);
        }
      };
      document.head.appendChild(script);
    });
  }

  return spotifyIframeApiPromise;
}

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

const geometryPetals = Array.from({ length: 6 }, (_, index) => {
  const angle = (index * Math.PI) / 3;
  return {
    x: 100 + Math.cos(angle) * 42,
    y: 100 + Math.sin(angle) * 42,
  };
});

const geometryOuterPetals = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6;
  return {
    x: 100 + Math.cos(angle) * 76,
    y: 100 + Math.sin(angle) * 76,
  };
});

const geometrySpokes = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6;
  return {
    x: 100 + Math.cos(angle) * 92,
    y: 100 + Math.sin(angle) * 92,
  };
});

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
  const playbackRef = useRef(null);
  const embedRef = useRef(null);
  const embedControllerRef = useRef(null);
  const planetRef = useRef(null);
  const captureRef = useRef(null);
  const dragRef = useRef(null);
  const [playbackOpen, setPlaybackOpen] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState('idle');
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

  useEffect(() => {
    const container = embedRef.current;
    if (!spotifyTrackId || !container) {
      setPlaybackStatus('idle');
      return undefined;
    }

    let cancelled = false;
    let controller = null;
    const embedTarget = document.createElement('div');
    container.replaceChildren(embedTarget);
    setPlaybackStatus('loading');

    loadSpotifyIframeApi()
      .then((api) => {
        if (cancelled) return;

        api.createController(
          embedTarget,
          { uri: `spotify:track:${spotifyTrackId}`, width: '100%', height: 152 },
          (createdController) => {
            if (cancelled) {
              createdController.destroy();
              return;
            }

            controller = createdController;
            embedControllerRef.current = createdController;
            setPlaybackStatus('paused');
            createdController.addListener('playback_update', (event) => {
              if (embedControllerRef.current !== createdController) return;
              setPlaybackStatus(event.data.isPaused ? 'paused' : 'playing');
            });
          },
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Unable to initialise Spotify playback.', error);
        setPlaybackStatus('error');
      });

    return () => {
      cancelled = true;
      if (embedControllerRef.current === controller) embedControllerRef.current = null;
      controller?.destroy();
      container.replaceChildren();
    };
  }, [spotifyTrackId]);

  useEffect(() => {
    if (!playbackOpen) return undefined;

    function placePlaybackPanel() {
      const player = playerRef.current;
      const panel = playbackRef.current;
      if (!player || !panel) return;

      const playerBounds = player.getBoundingClientRect();
      const panelWidth = panel.offsetWidth;
      const panelHeight = panel.offsetHeight;
      const margin = 12;
      const left = Math.min(
        Math.max(margin, playerBounds.left + (playerBounds.width - panelWidth) / 2),
        Math.max(margin, window.innerWidth - panelWidth - margin),
      );
      let top = playerBounds.top - panelHeight - 14;
      if (top < margin) top = playerBounds.bottom + 14;
      if (top + panelHeight > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - panelHeight - margin);
      }

      panel.style.left = `${left - playerBounds.left}px`;
      panel.style.top = `${top - playerBounds.top}px`;
    }

    const frameId = requestAnimationFrame(placePlaybackPanel);
    window.addEventListener('resize', placePlaybackPanel);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', placePlaybackPanel);
    };
  }, [playbackOpen, position, spotifyTrackId]);

  async function startAudioCapture() {
    setCaptureMessage('Choose the ASTRA tab and enable its audio-sharing option.');

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
        setCaptureMessage('No tab audio was shared. Choose the ASTRA tab and enable its audio-sharing option.');
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
      {isSpotifyTrack && (
        <section
          ref={playbackRef}
          className={`now-playing__playback${playbackOpen ? ' is-open' : ''}`}
          aria-label="Spotify playback"
          aria-hidden={!playbackOpen}
        >
          <div className="now-playing__playback-heading">
            <div>
              <p className="now-playing__playback-eyebrow">SPOTIFY PLAYER</p>
              <h2>{title}</h2>
              <p>{artist}</p>
            </div>
            <IconButton
              icon="close"
              size="sm"
              label="Close Spotify player"
              onClick={() => setPlaybackOpen(false)}
            />
          </div>
          <p className="now-playing__playback-status" role="status" aria-live="polite">
            {playbackStatus === 'loading' && 'Preparing Spotify playback…'}
            {playbackStatus === 'error' && 'Spotify controls could not be loaded. Open the track in Spotify instead.'}
            {playbackStatus === 'paused' && 'Paused. Press the planet’s play button or use Spotify’s controls below.'}
            {playbackStatus === 'playing' && 'Playing through Spotify.'}
          </p>
          <div
            ref={embedRef}
            className="now-playing__embed"
            aria-label={`Spotify player for ${title} by ${artist}`}
          />
          <a className="now-playing__spotify-link" href={currentTrack.spotifyUrl} target="_blank" rel="noopener noreferrer">
            Having trouble? Open in Spotify <span aria-hidden="true">↗</span>
          </a>
        </section>
      )}

      <div
        ref={planetRef}
        className={`now-playing__planet${captureState === 'active' ? ' now-playing__planet--reactive' : ''}`}
        aria-label={`${title} by ${artist}`}
      >
        <div className="now-playing__glass" aria-hidden="true" />
        <div className="now-playing__orbit now-playing__orbit--outer" aria-hidden="true" />
        <div className="now-playing__orbit now-playing__orbit--tilted" aria-hidden="true" />
        <div className="now-playing__orbit now-playing__orbit--inner" aria-hidden="true" />

        <svg
          className="now-playing__geometry"
          viewBox="0 0 200 200"
          aria-hidden="true"
          focusable="false"
        >
          <g className="now-playing__geometry-spin">
            <circle className="now-playing__geometry-ring" cx="100" cy="100" r="92" />
            <circle className="now-playing__geometry-ring now-playing__geometry-ring--fine" cx="100" cy="100" r="82" />
            <path
              className="now-playing__geometry-lines"
              d={`M ${geometrySpokes.map(({ x, y }) => `${x} ${y}`).join(' L ')} Z`}
            />
            <path
              className="now-playing__geometry-rays"
              d={geometrySpokes.map(({ x, y }) => `M 100 100 L ${x} ${y}`).join(' ')}
            />
            <path
              className="now-playing__geometry-lines now-playing__geometry-lines--inner"
              d={`M ${geometryPetals.map(({ x, y }) => `${x} ${y}`).join(' L ')} Z`}
            />
            <path
              className="now-playing__geometry-star"
              d={`${geometryPetals
                .filter((_, index) => index % 2 === 0)
                .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
                .join(' ')} Z`}
            />
            <path
              className="now-playing__geometry-star"
              d={`${geometryPetals
                .filter((_, index) => index % 2 === 1)
                .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
                .join(' ')} Z`}
            />
            {geometryPetals.map(({ x, y }, index) => (
              <circle
                key={`petal-${index}`}
                className="now-playing__geometry-circle"
                cx={x}
                cy={y}
                r="42"
              />
            ))}
            {geometryOuterPetals.map(({ x, y }, index) => (
              <circle
                key={`outer-petal-${index}`}
                className="now-playing__geometry-circle now-playing__geometry-circle--outer"
                cx={x}
                cy={y}
                r="22"
              />
            ))}
            <circle className="now-playing__geometry-ring" cx="100" cy="100" r="30" />
          </g>
        </svg>

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
            <button
              type="button"
              className="now-playing__launch"
              aria-label={playbackStatus === 'playing' ? `Pause ${title}` : `Play ${title}`}
              aria-expanded={playbackOpen}
              title={playbackStatus === 'playing' ? 'Pause via Spotify' : 'Play via Spotify'}
              onClick={() => {
                setPlaybackOpen(true);
                embedControllerRef.current?.togglePlay();
              }}
            >
              <Icon name={playbackStatus === 'playing' ? 'pause' : 'play'} size={22} />
            </button>
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
            : captureState === 'active' ? 'Stop audio visualiser' : 'Share ASTRA tab audio for visualiser'}
          aria-describedby="now-playing-visualiser-help"
          aria-pressed={captureState === 'active'}
          title={captureMessage || (!isSpotifyTrack
            ? 'Audio visualiser is unavailable for sample tracks'
            : captureState === 'active' ? 'Stop audio visualiser' : 'Share ASTRA tab audio for visualiser')}
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
          Choose the ASTRA tab and enable audio sharing. Audio is analysed in this browser and is not recorded or uploaded.
        </p>
        <p className="visually-hidden" role="status" aria-live="polite">
          {captureMessage}
        </p>
      </div>
    </aside>
  );
}
