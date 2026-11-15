import { useEffect, useRef, useState } from 'react';
import Artwork from '../ui/Artwork.jsx';
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
  const planetRef = useRef(null);
  const captureRef = useRef(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [captureState, setCaptureState] = useState('off');
  const [captureMessage, setCaptureMessage] = useState('');

  useEffect(() => () => {
    releaseAudioCapture(captureRef.current);
    captureRef.current = null;
  }, []);

  async function startAudioCapture() {
    setPanelOpen(true);
    setCaptureMessage('');

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
    <aside className="now-playing" aria-label="Now playing">
      {panelOpen && (
        <section className="now-playing__panel" aria-label="Playback and visualiser controls">
          <div className="now-playing__panel-heading">
            <div>
              <p className="now-playing__panel-eyebrow">NOW PLAYING</p>
              <h2>{title}</h2>
              <p>{artist}</p>
            </div>
            <IconButton
              icon="close"
              size="sm"
              label="Close playback panel"
              onClick={() => setPanelOpen(false)}
            />
          </div>

          {isSpotifyTrack ? (
            <>
              <iframe
                key={spotifyTrackId}
                className="now-playing__embed"
                title={`Spotify player for ${title} by ${artist}`}
                src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
              <a className="now-playing__spotify-link" href={currentTrack.spotifyUrl} target="_blank" rel="noopener noreferrer">
                Open on Spotify <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <p className="now-playing__sample-note">
              This is fictional ASTRA sample data. It has no audio and cannot be played.
            </p>
          )}

          <p className="now-playing__capture-help">
            To sync the visualiser, choose the ASTRA tab in the share dialog and allow tab audio.
            Audio is analysed in this browser and is not recorded or uploaded.
          </p>
          {captureMessage && (
            <p className="now-playing__capture-message" role="status">{captureMessage}</p>
          )}
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

        <div className="now-playing__topline">
          <span className="now-playing__eyebrow">NOW PLAYING</span>
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

        <div className="now-playing__art-wrap" aria-hidden="true">
          {currentTrack.imageUrl ? (
            <img className="now-playing__album-art" src={currentTrack.imageUrl} alt="" />
          ) : (
            <Artwork seed={currentTrack.id} shape="round" className="now-playing__album-art" />
          )}
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
          <IconButton
            icon="headphones"
            variant="primary"
            label="Open playback controls"
            className="now-playing__controls-main"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((open) => !open)}
          />
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
            : captureState === 'active' ? 'Stop audio visualiser' : 'Share tab audio for visualiser'}
          aria-pressed={captureState === 'active'}
          disabled={captureState === 'starting'}
          title={!isSpotifyTrack
            ? 'Audio visualiser is unavailable for sample tracks'
            : captureState === 'active' ? 'Stop audio visualiser' : 'Share tab audio for visualiser'}
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
      </div>
    </aside>
  );
}
