import './Artwork.css';

/*
 * Generative placeholder artwork: an abstract planet with an optional
 * orbital ring, built only from brand colours. The same `seed` (e.g. a track
 * id) always produces the same image, so every item has a stable identity
 * until real artwork URLs come from the backend.
 */

// Background (a → b) and orb colour combinations, all from the brand palette.
const SCHEMES = [
  { a: '--smoky-plum', b: '--cosmic-charcoal', orb: '--clay-copper' },
  { a: '--nebula-violet', b: '--deep-graphite', orb: '--dusty-terracotta' },
  { a: '--atmospheric-lilac', b: '--nebula-violet', orb: '--starlight-ivory' },
  { a: '--burnt-copper', b: '--cosmic-charcoal', orb: '--dusty-terracotta' },
  { a: '--deep-graphite', b: '--cosmic-charcoal', orb: '--atmospheric-lilac' },
  { a: '--clay-copper', b: '--smoky-plum', orb: '--starlight-ivory' },
  { a: '--smoky-plum', b: '--deep-graphite', orb: '--nebula-violet' },
];

// FNV-1a: fast, deterministic string hash.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function Artwork({ seed = 'astra', shape = 'square', label, className = '' }) {
  const h = hash(String(seed));
  const scheme = SCHEMES[h % SCHEMES.length];

  const style = {
    '--art-a': `var(${scheme.a})`,
    '--art-b': `var(${scheme.b})`,
    '--art-orb': `var(${scheme.orb})`,
    '--art-orb-size': `${36 + ((h >>> 3) % 30)}%`,
    '--art-orb-x': `${25 + ((h >>> 7) % 50)}%`,
    '--art-orb-y': `${25 + ((h >>> 11) % 50)}%`,
    '--art-light-x': `${(h >>> 15) % 100}%`,
    '--art-ring-rot': `${-35 + ((h >>> 19) % 70)}deg`,
    '--art-ring-opacity': (h >>> 23) % 3 === 0 ? 0 : 0.6,
  };

  return (
    <div
      className={`artwork artwork--${shape} ${className}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="artwork__orb" />
      <span className="artwork__ring" />
    </div>
  );
}
