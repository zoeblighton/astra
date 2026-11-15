import { useEffect, useState } from 'react';
import Artwork from '../components/ui/Artwork.jsx';
import Button from '../components/ui/Button.jsx';
import PageIntro from '../components/layout/PageIntro.jsx';
import { searchCatalogue } from '../services/catalogue.js';
import { usePlayer } from '../components/player/PlayerContext.jsx';
import { IDENTITIES } from '../data/identities.js';
import { useUniverse } from '../components/universe/UniverseContext.jsx';
import './FrequencyPage.css';

const STORAGE_KEY = 'astra-frequency-result-v1';

const IDENTITY_BY_ID = Object.fromEntries(IDENTITIES.map((identity) => [identity.id, identity]));

const QUESTIONS = [
  {
    id: 'first-notice',
    title: 'What draws you into a track first?',
    options: [
      { title: 'A melody that opens up', detail: 'Layers, atmosphere and a feeling of space.', scores: { dreamer: 2, observer: 1 } },
      { title: 'A voice with something to say', detail: 'Lyrics, phrasing and emotional detail.', scores: { soul: 2, nostalgic: 1 } },
      { title: 'A rhythm you can feel', detail: 'A groove, a pulse or an unexpected beat.', scores: { pulse: 2, soul: 1 } },
      { title: 'A sound I have not heard before', detail: 'Unusual textures and ideas that surprise.', scores: { explorer: 2, alchemist: 1 } },
    ],
  },
  {
    id: 'listening-journey',
    title: 'Which listening journey sounds most like you?',
    options: [
      { title: 'Drift into another place', detail: 'Let the sound wash over and surround you.', scores: { dreamer: 2, observer: 1 } },
      { title: 'Follow every small detail', detail: 'Notice how the parts fit together.', scores: { observer: 2, alchemist: 1 } },
      { title: 'Find the energy and move with it', detail: 'Give me momentum, edge or a beat.', scores: { pulse: 2, rebel: 1 } },
      { title: 'Take a turn I did not expect', detail: 'Keep me curious about what comes next.', scores: { explorer: 2, alchemist: 1 } },
    ],
  },
  {
    id: 'return-to',
    title: 'What makes you come back to a song?',
    options: [
      { title: 'The feeling in the performance', detail: 'A voice or story that stays with me.', scores: { soul: 2, nostalgic: 1 } },
      { title: 'The way it is put together', detail: 'Details that reveal themselves over time.', scores: { observer: 2, dreamer: 1 } },
      { title: 'The charge it gives me', detail: 'A sound with movement, energy or attitude.', scores: { pulse: 2, rebel: 1 } },
      { title: 'The moment it surprises me', detail: 'A mix of ideas I would not have paired.', scores: { explorer: 2, alchemist: 1 } },
    ],
  },
];

const MOODS = [
  { id: 'dreamy', label: 'Dreamy', scores: { dreamer: 2, observer: 1 } },
  { id: 'grounded', label: 'Grounded', scores: { soul: 2, nostalgic: 1 } },
  { id: 'restless', label: 'Restless', scores: { rebel: 2, pulse: 1 } },
  { id: 'curious', label: 'Curious', scores: { explorer: 2, alchemist: 1 } },
  { id: 'bright', label: 'Bright', scores: { pulse: 2, soul: 1 } },
  { id: 'reflective', label: 'Reflective', scores: { observer: 2, dreamer: 1 } },
  { id: 'nostalgic', label: 'Nostalgic', scores: { nostalgic: 2, soul: 1 } },
  { id: 'unfiltered', label: 'Unfiltered', scores: { rebel: 1, alchemist: 2 } },
];

function readSavedResult() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { result: null, error: '' };

    const parsed = JSON.parse(stored);
    const savedResult = parsed.result;
    const influencesValid = Array.isArray(savedResult?.influences)
      && savedResult.influences.length > 0
      && savedResult.influences.every((item) =>
        IDENTITY_BY_ID[item.id]
        && Number.isFinite(item.percentage)
        && item.percentage >= 0
        && item.percentage <= 100);
    const moodsValid = Array.isArray(savedResult?.moods)
      && savedResult.moods.length > 0
      && savedResult.moods.length <= 3
      && savedResult.moods.every((id) => MOODS.some((mood) => mood.id === id));

    if (
      parsed.version !== 1
      || !IDENTITY_BY_ID[savedResult?.dominantId]
      || !influencesValid
      || !moodsValid
    ) {
      return { result: null, error: 'Your saved Frequency result could not be recognised. You can create a new one below.' };
    }

    return { result: savedResult, error: '' };
  } catch {
    return { result: null, error: 'Your saved Frequency result could not be read. You can create a new one below.' };
  }
}

function createResult(answers, selectedMoods) {
  const scores = Object.fromEntries(IDENTITIES.map(({ id }) => [id, 0]));

  Object.entries(answers).forEach(([questionId, optionIndex]) => {
    const option = QUESTIONS.find((question) => question.id === questionId)?.options[optionIndex];
    Object.entries(option?.scores ?? {}).forEach(([identityId, points]) => {
      scores[identityId] += points;
    });
  });

  selectedMoods.forEach((moodId) => {
    const mood = MOODS.find((item) => item.id === moodId);
    Object.entries(mood?.scores ?? {}).forEach(([identityId, points]) => {
      scores[identityId] += points;
    });
  });

  const ranked = IDENTITIES
    .map((identity, order) => ({ ...identity, score: scores[identity.id], order }))
    .sort((a, b) => b.score - a.score || a.order - b.order);

  return {
    dominantId: ranked[0].id,
    moods: selectedMoods,
    influences: ranked.slice(0, 3).map((identity) => ({
      id: identity.id,
      percentage: Math.round((identity.score / ranked.reduce((total, item) => total + item.score, 0)) * 100),
    })),
    completedAt: new Date().toISOString(),
  };
}

function OrbitMoods({ selectedMoods, onToggle }) {
  return (
    <div className="frequency-orbit" role="group" aria-label="Select up to three moods">
      <div className="frequency-orbit__ring frequency-orbit__ring--outer" />
      <div className="frequency-orbit__ring frequency-orbit__ring--inner" />
      <div className="frequency-orbit__core">
        <span className="frequency-orbit__core-label">Your sound</span>
        <span className="frequency-orbit__core-count">{selectedMoods.length} / 3</span>
      </div>
      {MOODS.map((mood, index) => {
        const angle = index * (360 / MOODS.length);
        const selected = selectedMoods.includes(mood.id);
        return (
          <button
            key={mood.id}
            className={`frequency-orbit__mood${selected ? ' frequency-orbit__mood--selected' : ''}`}
            style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(var(--orbit-radius)) rotate(${-angle}deg)` }}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(mood.id)}
          >
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}

function FrequencyRecommendations({ identity, secondaryIdentity }) {
  const { playTrack } = usePlayer();
  const { library, toggleSavedTrack, toggleFavouriteArtist } = useUniverse();
  const [recommendations, setRecommendations] = useState([]);
  const [source, setSource] = useState('sample');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    const queries = [...new Set([identity.genres[0], secondaryIdentity?.genres[0]].filter(Boolean))];
    setStatus('loading');
    setRecommendations([]);

    Promise.all(
      queries.map((query) => searchCatalogue(query, { limit: 6, signal: controller.signal })),
    )
      .then((responses) => {
        const seen = new Set();
        const combined = responses.flatMap((response) =>
          response.results.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }).map((item) => ({ ...item, source: response.source })),
        );
        const sources = new Set(responses.map((response) => response.source));
        setSource(sources.size > 1 ? 'mixed' : responses[0]?.source ?? 'sample');
        setRecommendations(combined.slice(0, 6));
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [identity, secondaryIdentity]);

  return (
    <section className="frequency-recommendations" aria-labelledby="frequency-recommendations-title">
      <div className="frequency-results__section-heading">
        <div>
          <p className="text-meta text-meta--warm">A place to continue</p>
          <h2 id="frequency-recommendations-title">Sounds in your orbit</h2>
        </div>
        <span className={`frequency-source frequency-source--${source}`}>
          {source === 'spotify'
            ? 'Spotify catalogue'
            : source === 'mixed'
              ? 'Spotify + ASTRA samples'
              : 'ASTRA sample collection'}
        </span>
      </div>

      {status === 'loading' && <p className="frequency-message" role="status">Finding music that fits your frequency…</p>}
      {status === 'error' && <p className="frequency-message" role="alert">Your recommendations could not load just now. Please try again later.</p>}
      {status === 'ready' && recommendations.length === 0 && (
        <p className="frequency-message">We couldn’t find a close match in this catalogue just yet.</p>
      )}
      {status === 'ready' && recommendations.length > 0 && (
        <div className="frequency-recommendations__grid">
          {recommendations.map((item) => (
            <article className="frequency-rec-card" key={`${item.source}-${item.type}-${item.id}`}>
              {item.source === 'spotify' && item.imageUrl ? (
                <img className="frequency-rec-card__image" src={item.imageUrl} alt="" loading="lazy" />
              ) : (
                <Artwork
                  className="frequency-rec-card__artwork"
                  seed={item.id}
                  label={`Abstract ASTRA artwork for ${item.title}`}
                />
              )}
              <div className="frequency-rec-card__details">
                <span className="frequency-rec-card__type">{item.type === 'artist' ? 'Artist' : 'Track'}</span>
                <h3 className="frequency-rec-card__title">{item.title}</h3>
                <p className="frequency-rec-card__subtitle">
                  {item.type === 'artist' ? item.subtitle : item.artistName}
                </p>
                {item.spotifyUrl ? (
                  <a href={item.spotifyUrl} target="_blank" rel="noopener noreferrer">
                    Open on Spotify ↗
                  </a>
                ) : (
                  <span className="frequency-rec-card__sample">ASTRA sample</span>
                )}
                {item.type === 'track' && (
                  <div className="frequency-rec-card__actions">
                    <button
                      className="frequency-rec-card__queue"
                      type="button"
                      onClick={() => playTrack(
                        item,
                        recommendations.filter((candidate) =>
                          candidate.type === 'track' && candidate.source === item.source),
                      )}
                    >
                      {item.spotifyUrl ? 'Add to player' : 'View sample in player'}
                    </button>
                    <button
                      className="frequency-rec-card__save"
                      type="button"
                      aria-pressed={library.savedTracks.some((track) => track.id === item.id)}
                      onClick={() => toggleSavedTrack(item)}
                    >
                      {library.savedTracks.some((track) => track.id === item.id) ? 'Saved' : 'Save track'}
                    </button>
                  </div>
                )}
                {item.type === 'artist' && (
                  <button
                    className="frequency-rec-card__save"
                    type="button"
                    aria-pressed={library.favouriteArtists.some((artist) => artist.id === item.id)}
                    onClick={() => toggleFavouriteArtist(item)}
                  >
                    {library.favouriteArtists.some((artist) => artist.id === item.id) ? 'Following' : 'Follow artist'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="frequency-recommendations__note">
        Suggestions are matched to your musical preferences using ASTRA’s own genre-based logic.
        {source !== 'sample' && ' Spotify does not provide recommendation data for this feature.'}
        {source === 'sample' && ' Sample results are fictional and clearly labelled.'}
      </p>
    </section>
  );
}

export default function FrequencyPage() {
  const [savedState] = useState(readSavedResult);
  const [phase, setPhase] = useState(savedState.result ? 'results' : 'intro');
  const [result, setResult] = useState(savedState.result);
  const [storageMessage, setStorageMessage] = useState(savedState.error);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedMoods, setSelectedMoods] = useState([]);

  const dominantIdentity = result ? IDENTITY_BY_ID[result.dominantId] : null;
  const secondaryInfluences = result?.influences.slice(1) ?? [];
  const secondaryIdentity = secondaryInfluences[0]
    ? IDENTITY_BY_ID[secondaryInfluences[0].id]
    : null;

  function startQuiz() {
    setAnswers({});
    setSelectedMoods([]);
    setQuestionIndex(0);
    setPhase('quiz');
  }

  function finishQuiz() {
    const nextResult = createResult(answers, selectedMoods);
    setResult(nextResult);
    setPhase('results');
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, result: nextResult }));
      setStorageMessage('');
    } catch {
      setStorageMessage('This result is available for this visit, but could not be saved in this browser.');
    }
  }

  function toggleMood(moodId) {
    setSelectedMoods((current) => {
      if (current.includes(moodId)) return current.filter((id) => id !== moodId);
      if (current.length >= 3) return current;
      return [...current, moodId];
    });
  }

  const currentQuestion = QUESTIONS[questionIndex];

  return (
    <div className="frequency-page">
      <PageIntro
        eyebrow="Your Frequency"
        title="What does your universe sound like?"
        lead="A short reflection on your musical taste—not a personality test. Find the sounds and genres that feel most like your listening."
      />

      {storageMessage && <p className="frequency-storage-message" role="status">{storageMessage}</p>}

      {phase === 'intro' && (
        <section className="frequency-intro surface surface--feature">
          <div className="frequency-intro__orb" aria-hidden="true">
            <span />
          </div>
          <div className="frequency-intro__content">
            <p className="text-meta text-meta--warm">A listening reflection</p>
            <h2>There’s a pattern in what you play.</h2>
            <p>
              Answer three questions about the sounds you return to, then choose a few moods
              from your orbit. Your result is a musical identity with a mix of influences and
              a starting point for new discoveries.
            </p>
            <Button variant="primary" size="lg" onClick={startQuiz}>
              Begin your frequency
            </Button>
          </div>
          <p className="frequency-intro__duration">3 questions · 1 mood orbit · about 2 minutes</p>
        </section>
      )}

      {phase === 'quiz' && (
        <section className="frequency-step surface surface--feature" aria-labelledby="frequency-question-title">
          <div className="frequency-progress">
            <p className="text-meta">Listening preferences</p>
            <span>Question {questionIndex + 1} of {QUESTIONS.length}</span>
            <div
              className="frequency-progress__track"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={0}
              aria-valuemax={QUESTIONS.length + 1}
              aria-valuenow={questionIndex + 1}
            >
              <span style={{ width: `${((questionIndex + 1) / (QUESTIONS.length + 1)) * 100}%` }} />
            </div>
          </div>
          <p className="text-meta text-meta--warm">Question {questionIndex + 1}</p>
          <h2 id="frequency-question-title">{currentQuestion.title}</h2>
          <div className="frequency-answers" role="group" aria-label="Choose your answer">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option.title}
                className={`frequency-answer${answers[currentQuestion.id] === index ? ' frequency-answer--selected' : ''}`}
                type="button"
                aria-pressed={answers[currentQuestion.id] === index}
                onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: index }))}
              >
                <span className="frequency-answer__title">{option.title}</span>
                <span className="frequency-answer__detail">{option.detail}</span>
              </button>
            ))}
          </div>
          <div className="frequency-step__actions">
            <Button
              variant="ghost"
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={answers[currentQuestion.id] == null}
              onClick={() => {
                if (questionIndex === QUESTIONS.length - 1) {
                  setPhase('moods');
                } else {
                  setQuestionIndex((index) => index + 1);
                }
              }}
            >
              {questionIndex === QUESTIONS.length - 1 ? 'Choose your moods' : 'Continue'}
            </Button>
          </div>
        </section>
      )}

      {phase === 'moods' && (
        <section className="frequency-step frequency-step--moods surface surface--feature" aria-labelledby="frequency-moods-title">
          <div className="frequency-progress">
            <p className="text-meta">Your listening orbit</p>
            <span>Final step</span>
            <div
              className="frequency-progress__track"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={0}
              aria-valuemax={QUESTIONS.length + 1}
              aria-valuenow={QUESTIONS.length + 1}
            >
              <span style={{ width: '100%' }} />
            </div>
          </div>
          <div className="frequency-step__heading">
            <p className="text-meta text-meta--warm">Orbiting moods</p>
            <h2 id="frequency-moods-title">Which moods find their way into your listening?</h2>
            <p>Select up to three. There’s no right answer—choose what you often come back to.</p>
          </div>
          <OrbitMoods selectedMoods={selectedMoods} onToggle={toggleMood} />
          <p className="frequency-orbit-hint" aria-live="polite">
            {selectedMoods.length === 0
              ? 'Choose at least one mood to continue.'
              : selectedMoods.length === 3
                ? 'Your orbit is full. Deselect a mood to change it.'
                : `${selectedMoods.length} selected. Choose up to ${3 - selectedMoods.length} more.`}
          </p>
          <div className="frequency-step__actions">
            <Button variant="ghost" onClick={() => setPhase('quiz')}>
              Back to questions
            </Button>
            <Button variant="primary" disabled={selectedMoods.length === 0} onClick={finishQuiz}>
              Discover my frequency
            </Button>
          </div>
        </section>
      )}

      {phase === 'results' && result && dominantIdentity && (
        <div className="frequency-results">
          <section className="frequency-identity surface surface--feature" aria-labelledby="frequency-identity-title">
            <div className="frequency-identity__art">
              <Artwork
                seed={`identity-${dominantIdentity.id}`}
                shape="round"
                label={`Abstract artwork representing ${dominantIdentity.name}`}
              />
              <span className="frequency-identity__orbit frequency-identity__orbit--one" />
              <span className="frequency-identity__orbit frequency-identity__orbit--two" />
            </div>
            <div className="frequency-identity__copy">
              <p className="text-meta text-meta--warm">Your dominant musical identity · {dominantIdentity.essence}</p>
              <h2 id="frequency-identity-title">{dominantIdentity.name}</h2>
              <p>{dominantIdentity.description}</p>
              <div className="frequency-genres" aria-label="Genres in your orbit">
                {dominantIdentity.genres.map((genre) => <span key={genre}>{genre}</span>)}
              </div>
            </div>
          </section>

          <section className="frequency-influences surface" aria-labelledby="frequency-influences-title">
            <div className="frequency-results__section-heading">
              <div>
                <p className="text-meta text-meta--warm">A blend, not a box</p>
                <h2 id="frequency-influences-title">Your influence mix</h2>
              </div>
              <p>Based on your answers and selected moods</p>
            </div>
            <div className="frequency-influences__list">
              {result.influences.map((influence) => {
                const identity = IDENTITY_BY_ID[influence.id];
                return (
                  <div className="frequency-influence" key={influence.id}>
                    <div className="frequency-influence__label">
                      <span>{identity.name}</span>
                      <span>{influence.percentage}%</span>
                    </div>
                    <div
                      className="frequency-influence__track"
                      role="meter"
                      aria-label={`${identity.name} influence`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={influence.percentage}
                    >
                      <span style={{ width: `${influence.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="frequency-mood-summary">
              Moods in this orbit: {result.moods.map((id) => MOODS.find((mood) => mood.id === id)?.label).filter(Boolean).join(' · ')}
            </p>
          </section>

          <FrequencyRecommendations identity={dominantIdentity} secondaryIdentity={secondaryIdentity} />

          <div className="frequency-results__actions">
            <Button variant="secondary" onClick={startQuiz}>
              Retake your reflection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
